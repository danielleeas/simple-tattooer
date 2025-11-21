import { supabase } from '@/lib/supabase';

export interface DrawingListItem {
	id: string;
	name: string;
	date: Date;
}

export interface CreateDrawingInput {
	project_id: string;
	image_url: string;
	artist_notes?: string | null;
}

export interface CreateDrawingResult<T = any> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface DrawingRow {
	id: string;
	project_id: string;
	image_url: string;
	artist_notes: string | null;
	is_approved: boolean;
	client_notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface UpdateDrawingInput {
	image_url?: string;
	artist_notes?: string | null;
}

/**
 * Returns recent projects with deposit paid, including the next session date (or first session if none upcoming).
 */
export async function getRecentDepositPaidProjects(artistId: string, limit: number = 20): Promise<DrawingListItem[]> {
	if (!artistId) return [];

	const { data, error } = await supabase
		.from('projects')
		.select(`
			id,
			artist_id,
			client:clients(full_name),
			sessions(date,start_time)
		`)
		.eq('artist_id', artistId)
		.eq('deposit_paid', true)
		.order('updated_at', { ascending: false })
		.order('date', { foreignTable: 'sessions', ascending: true })
		.limit(limit);

	if (error) {
		console.warn('getRecentDepositPaidProjects error', error);
		return [];
	}

	const today = new Date();
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const parseYmd = (ymd?: string) => (ymd ? new Date(`${ymd}T00:00:00`) : null);

	return (Array.isArray(data) ? data : []).map((row: any) => {
		const sessions = Array.isArray(row?.sessions) ? row.sessions : [];
		const next = sessions.find((s: any) => {
			const d = parseYmd(s?.date);
			return d && d >= startOfToday;
		}) || sessions[0];
		const d = parseYmd(next?.date) || startOfToday;
		return {
			id: String(row.id),
			name: String(row?.client?.full_name || 'Unnamed Client'),
			date: d,
		};
	});
}

/**
 * Insert a drawing row for a project
 */
export async function createDrawing(input: CreateDrawingInput): Promise<CreateDrawingResult> {
	try {
		const { data, error } = await supabase
			.from('drawings')
			.insert({
				project_id: input.project_id,
				image_url: input.image_url,
				artist_notes: input.artist_notes ?? null,
			})
			.select()
			.single();

		if (error) {
			return { success: false, error: error.message || 'Failed to save drawing' };
		}

		// Update the related project's status to reflect that a drawing was uploaded
		const { error: projectError } = await supabase
			.from('projects')
			.update({
				status: 'drawing_uploaded',
				updated_at: new Date().toISOString(),
			})
			.eq('id', input.project_id);

		if (projectError) {
			return { success: false, error: projectError.message || 'Failed to update project status' };
		}

		return { success: true, data };
	} catch (e: any) {
		return { success: false, error: e?.message || 'Unexpected error saving drawing' };
	}
}

/**
 * Get the latest drawing for a project (by created_at desc)
 */
export async function getLatestDrawingForProject(projectId: string): Promise<CreateDrawingResult<DrawingRow | null>> {
	try {
		const { data, error } = await supabase
			.from('drawings')
			.select('*')
			.eq('project_id', projectId)
			.order('created_at', { ascending: false })
			.limit(1);

		if (error) {
			return { success: false, error: error.message || 'Failed to load drawing' };
		}

		const row = Array.isArray(data) && data.length > 0 ? (data[0] as DrawingRow) : null;
		return { success: true, data: row };
	} catch (e: any) {
		return { success: false, error: e?.message || 'Unexpected error loading drawing' };
	}
}

/**
 * Delete a drawing row by id
 */
export async function deleteDrawing(drawingId: string): Promise<CreateDrawingResult> {
	try {
		const { error } = await supabase
			.from('drawings')
			.delete()
			.eq('id', drawingId);

		if (error) {
			return { success: false, error: error.message || 'Failed to delete drawing' };
		}

		return { success: true };
	} catch (e: any) {
		return { success: false, error: e?.message || 'Unexpected error deleting drawing' };
	}
}

/**
 * Update a drawing row by id
 */
export async function updateDrawing(drawingId: string, updates: UpdateDrawingInput): Promise<CreateDrawingResult<DrawingRow>> {
	try {
		const payload: any = {
			updated_at: new Date().toISOString(),
		};
		if (typeof updates.image_url === 'string') payload.image_url = updates.image_url;
		if (updates.artist_notes !== undefined) payload.artist_notes = updates.artist_notes;

		const { data, error } = await supabase
			.from('drawings')
			.update(payload)
			.eq('id', drawingId)
			.select()
			.single();

		if (error) {
			return { success: false, error: error.message || 'Failed to update drawing' };
		}

		return { success: true, data: data as DrawingRow };
	} catch (e: any) {
		return { success: false, error: e?.message || 'Unexpected error updating drawing' };
	}
}


