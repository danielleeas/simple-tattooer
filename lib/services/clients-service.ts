import { supabase } from '@/lib/supabase';

export interface CreateClientInput {
	full_name: string;
	email: string;
	phone_number: string;
	project_notes?: string | null;
	location?: string | null;
	artist_id: string;
}

export interface CreateClientResult {
	success: boolean;
	client?: any;
	authUserId?: string;
	error?: string;
}

/**
 * Creates a Supabase Auth user for the client and inserts a row into `clients`
 * with id = auth user id via the `create-client` Edge Function.
 * This keeps admin logic off the client and preserves the current session.
 */
export async function createClientWithAuth(input: CreateClientInput): Promise<CreateClientResult> {
	try {
		const fullName = input.full_name.trim();
		const email = input.email.trim();
		const phone = input.phone_number.trim();
		const location = (input.location ?? '') as string; // DB requires NOT NULL
		const notes = input.project_notes ?? null;
		const artistId = input.artist_id;
		const nowIso = new Date().toISOString();

		// 1) If a client already exists (by email or phone), ensure link and return
		{
			const { data: existingCandidates, error: findErr } = await supabase
				.from('clients')
				.select('id, full_name, email, phone_number, project_notes, location, created_at, updated_at')
				.or(`email.eq.${email},phone_number.eq.${phone}`)
				.limit(1);

			if (findErr) {
				return { success: false, error: findErr.message || 'Failed checking existing client' };
			}

			const existingClient = Array.isArray(existingCandidates) && existingCandidates.length > 0 ? existingCandidates[0] : null;

			if (existingClient?.id) {
				// Ensure artist<->client link exists. If it exists, just bump updated_at (avoid resetting meaningful statuses)
				const { data: existingLink, error: linkFetchErr } = await supabase
					.from('links')
					.select('id, status')
					.eq('client_id', existingClient.id)
					.eq('artist_id', artistId)
					.limit(1);

				if (linkFetchErr) {
					return { success: false, error: linkFetchErr.message || 'Failed ensuring client link' };
				}

				if (Array.isArray(existingLink) && existingLink.length > 0) {
					// Update only updated_at to preserve status such as 'need_deposit' or 'deposit_paid'
					const { error: bumpErr } = await supabase
						.from('links')
						.update({ status: 'need_deposit', updated_at: nowIso })
						.eq('id', existingLink[0].id);
					if (bumpErr) {
						return { success: false, error: bumpErr.message || 'Failed updating client link' };
					}
				} else {
					// Create a new link with default 'pending' status
					const { error: insertLinkErr } = await supabase
						.from('links')
						.insert({
							client_id: existingClient.id,
							artist_id: artistId,
							status: 'pending',
							updated_at: nowIso,
						});
					if (insertLinkErr) {
						return { success: false, error: insertLinkErr.message || 'Failed creating client link' };
					}
				}

				return {
					success: true,
					client: existingClient,
				};
			}
		}

		// 2) No existing client found: use Edge Function to create auth user + client row
		const { data, error } = await supabase.functions.invoke('create-client', {
			body: {
				full_name: fullName,
				email,
				phone_number: phone,
				project_notes: notes,
				location,
				artist_id: artistId,
			},
		});

		// Normalize function payload: supabase returns text if the function
		// doesn't set application/json. Ensure we always return a typed object.
		let payload: any = data;
		if (typeof payload === 'string') {
			try {
				payload = JSON.parse(payload);
			} catch {
				return { success: false, error: 'Malformed response from server' };
			}
		}

		if (error) {
			return { success: false, error: error.message || payload?.error || 'Failed to create client' };
		}

		if (!payload || typeof payload !== 'object' || payload.success !== true) {
			return { success: false, error: payload?.error || 'Failed to create client' };
		}

		// 3) Ensure artist<->client link exists after creation (Edge Function may not create link)
		try {
			const createdClientId: string | undefined = payload?.client?.id || payload?.authUserId;
			if (createdClientId) {
				// Upsert to avoid race with any parallel link creation; preserve existing status by only setting when inserting
				// Note: Upsert updates provided fields; we avoid overriding status by attempting insert first and
				// falling back to a light update of updated_at if conflict arises.
				const { error: tryInsertErr } = await supabase
					.from('links')
					.insert({
						client_id: createdClientId,
						artist_id: artistId,
						status: 'pending',
						updated_at: nowIso,
					});

				if (tryInsertErr) {
					// If unique violation, just bump updated_at
					const { error: bumpErr } = await supabase
						.from('links')
						.update({ updated_at: nowIso })
						.eq('client_id', createdClientId)
						.eq('artist_id', artistId);
					if (bumpErr) {
						// Non-fatal for client creation, but reportable
						console.warn('Failed to ensure link after client creation:', bumpErr);
					}
				}
			}
		} catch (e: any) {
			console.warn('Unexpected error ensuring link after client creation:', e);
		}

		return payload as CreateClientResult;
	} catch (err: any) {
		return { success: false, error: err?.message || 'Unexpected error creating client' };
	}
}



/**
 * Fetch recent clients for an artist by the latest link activity.
 * Returns up to `limit` client records, ordered by `links.updated_at` desc.
 */
export async function getRecentClients(artistId: string, limit: number = 6): Promise<any[]> {
	if (!artistId) return [];

	// Join links -> clients and order by links.updated_at
	const { data, error } = await supabase
		.from('links')
		.select('updated_at, status, clients(id, full_name, email, phone_number, project_notes, location, created_at, updated_at)')
		.eq('artist_id', artistId)
		.order('updated_at', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching recent clients:', error);
		return [];
	}

	const rows = Array.isArray(data) ? data : [];

	const clients = rows
		.map((row: any) => {
			const client = row?.clients || row?.client || null;
			if (!client) return null;
			const status: string = row?.status || '';

			return {
				...client,
				name: client.full_name,
				status,
				last_link_updated_at: row?.updated_at,
			};
		})
		.filter(Boolean);

	return clients;
}

/**
 * Search clients linked to an artist by full name, email, or phone number.
 * Returns up to `limit` client records.
 */
export async function searchClients(artistId: string, term: string, limit: number = 10): Promise<any[]> {
	if (!artistId || !term || term.trim().length < 1) return [];

	const query = term.trim();
	const ilike = `%${query}%`;

	const { data, error } = await supabase
		.from('clients')
		.select('id, full_name, email, phone_number, location, project_notes, links!inner(artist_id)')
		.eq('links.artist_id', artistId)
		.or(`full_name.ilike.${ilike},email.ilike.${ilike},phone_number.ilike.${ilike}`)
		.limit(limit);

	if (error) {
		console.error('Error searching clients:', error);
		return [];
	}

	const rows = Array.isArray(data) ? data : [];

	return rows.map((client: any) => ({
		...client,
		name: client.full_name,
	}));
}

/**
 * Fetch all clients linked to an artist, ordered by client name.
 */
export async function getAllClients(artistId: string): Promise<any[]> {
	if (!artistId) return [];

	const { data, error } = await supabase
		.from('clients')
		.select('id, full_name, email, phone_number, location, project_notes, created_at, updated_at, links!inner(artist_id, status)')
		.eq('links.artist_id', artistId)
		.order('full_name', { ascending: true });

	if (error) {
		console.error('Error fetching all clients:', error);
		return [];
	}

	const rows = Array.isArray(data) ? data : [];

	return rows.map((row: any) => {
		const links = (row as any)?.links;
		const linkObj = Array.isArray(links) ? links[0] : links;
		const status: string | undefined = linkObj?.status;

		return {
			...row,
			name: row.full_name,
			status: status || '',
		};
	});
}

/**
 * Fetch a single client by id that is linked to the given artist.
 * Returns null if not found or not linked to artist.
 */
export async function getClientById(artistId: string, clientId: string): Promise<any | null> {
	if (!artistId || !clientId) return null;

	const { data, error } = await supabase
		.from('clients')
		.select('id, full_name, email, phone_number, location, project_notes, created_at, updated_at, links!inner(artist_id, status, is_new, notes)')
		.eq('id', clientId)
		.eq('links.artist_id', artistId)
		.single();

	if (error) {
		console.error('Error fetching client by id:', error);
		return null;
	}

	if (!data) return null;

	const links = (data as any)?.links;
	const linkObj = Array.isArray(links) ? links[0] : links;
	const status: string | undefined = linkObj?.status;

	return {
		...data,
		name: data.full_name,
		status: status || '',
		links: links,
	};
}

export async function findClientById(clientId: string): Promise<any | null> {
	if (!clientId) return null;

	const { data, error } = await supabase
		.from('clients')
		.select('id, full_name, email')
		.eq('id', clientId)
		.single();

	if (error) {
		// PGRST116 means "no rows found" - this is expected when client doesn't exist
		if (error.code === 'PGRST116') {
			return null;
		}
		console.error('Error fetching client by id:', error);
		return null;
	}

	if (!data) return null;

	return data;
}

/**
 * Update client information and link notes.
 * Updates the clients table with name, email, phone_number, and location.
 * Updates the links table with notes for the specific artist-client relationship.
 */
export async function updateClient(artistId: string, clientId: string, formData: {
	name: string;
	email: string;
	phone_number: string;
	location: string;
	notes: string;
}): Promise<boolean> {
	if (!artistId || !clientId) return false;

	const nowIso = new Date().toISOString();

	// Update clients table
	const { error: clientError } = await supabase
		.from('clients')
		.update({
			full_name: formData.name.trim(),
			email: formData.email.trim(),
			phone_number: formData.phone_number.trim(),
			location: formData.location.trim() || '',
			updated_at: nowIso,
		})
		.eq('id', clientId);

	if (clientError) {
		console.error('Error updating client:', clientError);
		return false;
	}

	// Update links table (notes)
	const { error: linkError } = await supabase
		.from('links')
		.update({
			notes: formData.notes.trim() || null,
			updated_at: nowIso,
		})
		.eq('client_id', clientId)
		.eq('artist_id', artistId);

	if (linkError) {
		console.error('Error updating link notes:', linkError);
		return false;
	}

	return true;
}

/**
 * Check if the client has any project with status = 'need_drawing' (scoped to artist).
 */
export async function clientHasProjectNeedingDrawing(artistId: string, clientId: string): Promise<boolean> {
	if (!artistId || !clientId) return false;

	const { data, error } = await supabase
		.from('projects')
		.select('id')
		.eq('artist_id', artistId)
		.eq('client_id', clientId)
		.eq('status', 'need_drawing')
		.limit(1);

	if (error) {
		console.error('Error checking projects needing drawing:', error);
		return false;
	}

	return Array.isArray(data) && data.length > 0;
}

/**
 * Fetch all projects for a client (scoped to artist), including sessions.
 */
export async function getClientProjectsWithSessions(artistId: string, clientId: string): Promise<any[]> {
	if (!artistId || !clientId) return [];

	const { data, error } = await supabase
		.from('projects')
		.select(`
			id,
			artist_id,
			client_id,
			client:clients(full_name),
			title,
			deposit_amount,
			deposit_paid,
			deposit_paid_date,
			deposit_payment_method,
			notes,
			waiver_signed,
			created_at,
			updated_at,
			drawing:drawings (
				id,
				image_url,
				artist_notes,
				is_approved,
				client_notes,
				created_at,
				updated_at
			),
			sessions (
				id,
				project_id,
				date,
				start_time,
				duration,
				location_id,
				location:locations(address),
				session_rate,
				tip,
				payment_method,
				notes,
				created_at,
				updated_at
			)
		`)
		.eq('artist_id', artistId)
		.eq('client_id', clientId)
		.order('created_at', { ascending: false })
		.order('date', { foreignTable: 'sessions', ascending: true });

	if (error) {
		console.error('Error fetching client projects with sessions:', error);
		return [];
	}

	return Array.isArray(data) ? data : [];
}

/**
 * Update a project's deposit paid status.
 */
export async function updateProjectDepositPaid(projectId: string, isPaid: boolean, artistId: string, clientId: string): Promise<boolean> {
	if (!projectId || !artistId || !clientId) return false;
	const nowIso = new Date().toISOString();
	const todayUtc = nowIso.split('T')[0];
	// 1) Update project deposit fields
	const nextProjectStatus = isPaid ? 'need_drawing' : 'need_deposit';
	const { error: projectErr } = await supabase
		.from('projects')
		.update({
			deposit_paid: isPaid,
			deposit_paid_date: isPaid ? todayUtc : null,
			status: nextProjectStatus,
			updated_at: nowIso,
		})
		.eq('id', projectId);
	if (projectErr) {
		console.error('Error updating project deposit_paid:', projectErr);
		return false;
	}
	// 2) Update link status based on deposit state
	const nextStatus = isPaid ? 'deposit_paid' : 'need_deposit';
	const { error: linkErr } = await supabase
		.from('links')
		.update({ status: nextStatus, is_new: false, updated_at: nowIso })
		.eq('artist_id', artistId)
		.eq('client_id', clientId);
	if (linkErr) {
		console.error('Error updating link status after deposit change:', linkErr);
		return false;
	}

	// 3) On deposit paid, create calendar events for all sessions of this project
	if (isPaid) {
		try {
			// Get client name for event title
			const { data: clientRow, error: fetchClientErr } = await supabase
				.from('clients')
				.select('full_name')
				.eq('id', clientId)
				.single();

			if (fetchClientErr) {
				console.warn('Unable to fetch client name for session events:', fetchClientErr);
			}

			const eventTitle = clientRow?.full_name || 'Session';

			// Fetch sessions for the project
			const { data: sessions, error: sessionsErr } = await supabase
				.from('sessions')
				.select('id, date, start_time, duration, source, source_id')
				.eq('project_id', projectId);

			if (sessionsErr) {
				console.error('Error fetching sessions for project when creating events:', sessionsErr);
			} else if (Array.isArray(sessions) && sessions.length > 0) {
				const sessionIds = sessions.map((s: any) => s.id);

				// Avoid duplicates: find existing events already created for these sessions
				const { data: existing, error: existingErr } = await supabase
					.from('events')
					.select('source_id')
					.eq('source', 'session')
					.in('source_id', sessionIds);

				if (existingErr) {
					console.warn('Unable to check existing session events:', existingErr);
				}

				const existingSet = new Set<string>((existing || []).map((e: any) => e.source_id));

				const rowsToInsert = sessions
					.filter((s: any) => !!s?.id && !!s?.date && !existingSet.has(s.id) && s.source !== 'quick_appointment')
					.map((s: any) => {
						const rawStart = String(s?.start_time ?? '00:00').padStart(5, '0');
						const startTime = /^\d{2}:\d{2}$/.test(rawStart) ? rawStart : '00:00';
						const startStr = `${s.date} ${startTime}`; // "YYYY-MM-DD HH:mm"

						let endStr = startStr;
						const durationMinutes = Number(s?.duration) || 0;
						if (durationMinutes > 0) {
							const startLocal = new Date(`${s.date}T${startTime}:00`);
							if (!isNaN(startLocal.getTime())) {
								const endLocal = new Date(startLocal.getTime() + durationMinutes * 60_000);
								const y = endLocal.getFullYear();
								const m = String(endLocal.getMonth() + 1).padStart(2, '0');
								const d = String(endLocal.getDate()).padStart(2, '0');
								const H = String(endLocal.getHours()).padStart(2, '0');
								const M = String(endLocal.getMinutes()).padStart(2, '0');
								endStr = `${y}-${m}-${d} ${H}:${M}`;
							}
						}
						return {
							artist_id: artistId,
							title: eventTitle,
							start_date: startStr,
							end_date: endStr,
							color: 'purple',
							type: 'item', // not background
							source: 'session',
							source_id: s.id,
							updated_at: nowIso,
						};
					});

				if (rowsToInsert.length > 0) {
					const { error: insertErr } = await supabase
						.from('events')
						.insert(rowsToInsert);

					if (insertErr) {
						console.error('Error inserting session events on deposit paid:', insertErr);
					}
				}
			}
		} catch (e: any) {
			console.error('Unexpected error creating session events on deposit paid:', e);
		}
	}
	return true;
}

/**
 * Update a session's tip amount.
 */
export async function updateSessionTip(sessionId: string, tipAmount: number): Promise<boolean> {
	if (!sessionId) return false;
	const nowIso = new Date().toISOString();
	const { error } = await supabase
		.from('sessions')
		.update({
			tip: tipAmount,
			updated_at: nowIso,
		})
		.eq('id', sessionId);
	if (error) {
		console.error('Error updating session tip:', error);
		return false;
	}
	return true;
}
/**
 * Update a project's deposit paid date.
 */
export async function updateProjectDepositPaidDate(projectId: string, date: Date | null): Promise<boolean> {
	if (!projectId) return false;
	const nowIso = new Date().toISOString();
	const depositDate = date ? new Date(date).toISOString().split('T')[0] : null;
	const { error } = await supabase
		.from('projects')
		.update({
			deposit_paid_date: depositDate,
			updated_at: nowIso,
		})
		.eq('id', projectId);
	if (error) {
		console.error('Error updating project deposit_paid_date:', error);
		return false;
	}
	return true;
}

/**
 * Update a project's deposit payment method.
 * Expects method values like: 'paypal' | 'e_transfer' | 'credit_card' | 'venmo'
 */
export async function updateProjectDepositPaymentMethod(projectId: string, method: string): Promise<boolean> {
	if (!projectId) return false;
	const nowIso = new Date().toISOString();
	const { error } = await supabase
		.from('projects')
		.update({
			deposit_payment_method: method,
			updated_at: nowIso,
		})
		.eq('id', projectId);
	if (error) {
		console.error('Error updating project deposit_payment_method:', error);
		return false;
	}
	return true;
}

/**
 * Update a project's waiver_signed flag.
 */
export async function updateProjectWaiverSigned(projectId: string, signed: boolean): Promise<boolean> {
	if (!projectId) return false;
	const nowIso = new Date().toISOString();
	const { error } = await supabase
		.from('projects')
		.update({
			waiver_signed: signed,
			updated_at: nowIso,
		})
		.eq('id', projectId);
	if (error) {
		console.error('Error updating project waiver_signed:', error);
		return false;
	}
	return true;
}

/**
 * Update a project's notes.
 */
export async function updateProjectNotes(projectId: string, notes: string): Promise<boolean> {
	if (!projectId) return false;
	const nowIso = new Date().toISOString();
	const { error } = await supabase
		.from('projects')
		.update({
			notes: notes.trim() || null,
			updated_at: nowIso,
		})
		.eq('id', projectId);
	if (error) {
		console.error('Error updating project notes:', error);
		return false;
	}
	return true;
}

/**
 * Update a session's payment method.
 * Expects method values like: 'paypal' | 'e_transfer' | 'credit_card' | 'venmo'
 */
export async function updateSessionPaymentMethod(sessionId: string, method: string): Promise<boolean> {
	if (!sessionId) return false;
	const nowIso = new Date().toISOString();
	const { error } = await supabase
		.from('sessions')
		.update({
			payment_method: method,
			updated_at: nowIso,
		})
		.eq('id', sessionId);
	if (error) {
		console.error('Error updating session payment_method:', error);
		return false;
	}
	return true;
}

/**
 * Update a session's notes.
 */
export async function updateSessionNotes(sessionId: string, notes: string): Promise<boolean> {
	if (!sessionId) return false;
	const nowIso = new Date().toISOString();
	const { error } = await supabase
		.from('sessions')
		.update({
			notes: notes.trim() || null,
			updated_at: nowIso,
		})
		.eq('id', sessionId);
	if (error) {
		console.error('Error updating session notes:', error);
		return false;
	}
	return true;
}

/**
 * Fetch a single session by id, including related project, client, and location data.
 */
export async function getSessionById(sessionId: string): Promise<any | null> {
	if (!sessionId) return null;

	const { data, error } = await supabase
		.from('sessions')
		.select(`
			id,
			project_id,
			date,
			start_time,
			duration,
			location_id,
			location:locations(address),
			session_rate,
			tip,
			payment_method,
			notes,
			reschedule_count,
			created_at,
			updated_at,
			project:projects(
				id,
				client_id,
				title,
				client:clients(id, full_name)
			)
		`)
		.eq('id', sessionId)
		.single();

	if (error) {
		console.error('Error fetching session by id:', error);
		return null;
	}

	return data ?? null;
}