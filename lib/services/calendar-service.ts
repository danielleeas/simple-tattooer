import { supabase } from '@/lib/supabase';
import type { Locations } from '@/lib/redux/types';

export interface CalendarEvent {
	id: string;
	artist_id: string;
	title: string;
	allday: boolean;
	start_date: string; // "YYYY-MM-DD HH:mm"
	end_date: string;   // "YYYY-MM-DD HH:mm"
	color: string;
	type: string;
	source: string;
	source_id: string;
}

export interface CreateSpotConventionParams {
	artistId: string;
	title: string;
	dates: string[];
	diffTimeEnabled: boolean;
	startTimes: Record<string, string>;
	endTimes: Record<string, string>;
	location: Locations | (Partial<Locations> & {
		placeId?: string;
		isMainStudio?: boolean;
	});
	notes?: string;
}

export interface CreateSpotConventionResult {
	success: boolean;
	id?: string;
	error?: string;
}

export interface CreateTempChangeParams {
	artistId: string;
	startDate: string; // "YYYY-MM-DD"
	endDate: string;   // "YYYY-MM-DD"
	workDays: string[];
	diffTimeEnabled: boolean;
	startTimes: Record<string, string>;
	endTimes: Record<string, string>;
	location: Locations | (Partial<Locations> & {
		placeId?: string;
		isMainStudio?: boolean;
	});
	notes?: string;
}

export interface CreateTempChangeResult {
	success: boolean;
	id?: string;
	error?: string;
}

export interface CreateEventParams {
	artistId: string;
	title: string;
	startDate: string;
	endDate: string;
	allDay?: boolean;
	color?: string;
	type?: string;
	source: string;
	sourceId: string;
}

export interface CreateEventResult {
	success: boolean;
	id?: string;
	error?: string;
}

function composeDateTime(dateKey: string, timeHHMM: string | undefined, fallback: string): string {
	const time = (timeHHMM && typeof timeHHMM === 'string' && timeHHMM.length >= 4) ? timeHHMM : fallback;
	// Store as "YYYY-MM-DD HH:mm" (space, not 'T')
	return `${dateKey} ${time}`;
}

function normalizeDbDateTime(value: string): string {
	// Ensure "YYYY-MM-DD HH:mm" format by converting a possible 'T' separator to space.
	return (value || '').replace('T', ' ').trim();
}

function toYmd(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function startOfDayString(date: Date): string {
	return `${toYmd(date)} 00:00`;
}

function endOfDayString(date: Date): string {
	return `${toYmd(date)} 23:59`;
}

export interface GetEventsInRangeParams {
	artistId: string;
	start: Date;
	end: Date;
}

export interface GetEventsInRangeResult {
	success: boolean;
	events?: CalendarEvent[];
	error?: string;
}

// Fetch events that overlap with the [start, end] window (inclusive).
// Overlap logic: (start_date <= end) AND (end_date >= start)
export async function getEventsInRange(params: GetEventsInRangeParams): Promise<GetEventsInRangeResult> {
	try {
		if (!params.artistId) {
			return { success: false, error: 'Missing artist id' };
		}
		const startStr = startOfDayString(params.start);
		const endStr = endOfDayString(params.end);

		const { data, error } = await supabase
			.from('events')
			.select('id, artist_id, title, allday, start_date, end_date, color, type, source, source_id')
			.eq('artist_id', params.artistId)
			.lte('start_date', endStr)
			.gte('end_date', startStr)
			.order('start_date', { ascending: true });

		if (error) {
			return { success: false, error: error.message || 'Failed to fetch events' };
		}
		return { success: true, events: (data ?? []) as CalendarEvent[] };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

export async function createEvent(params: CreateEventParams): Promise<CreateEventResult> {
	try {
		const payload = {
			artist_id: params.artistId,
			title: params.title,
			allday: !!params.allDay,
			start_date: normalizeDbDateTime(params.startDate),
			end_date: normalizeDbDateTime(params.endDate),
			color: params.color ?? 'blue',
			type: params.type ?? 'item',
			source: params.source,
			source_id: params.sourceId,
		};

		const { data, error } = await supabase
			.from('events')
			.insert([payload])
			.select('id')
			.single();

		if (error) {
			return { success: false, error: error.message || 'Failed to create event' };
		}

		return { success: true, id: data?.id as string | undefined };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

function toBoolean(value: unknown, defaultValue = false): boolean {
	if (typeof value === 'boolean') return value;
	return defaultValue;
}

function normalizeLocationForInsert(artistId: string, loc: CreateSpotConventionParams['location']) {
	const address = (loc as any).address;
	const place_id = (loc as any).place_id ?? (loc as any).placeId ?? '';
	const coordinates = (loc as any).coordinates ?? {};
	const is_main_studio = toBoolean((loc as any).is_main_studio ?? (loc as any).isMainStudio, false);
	return {
		artist_id: artistId,
		address,
		place_id,
		coordinates: {
			latitude: (coordinates as any)?.latitude,
			longitude: (coordinates as any)?.longitude,
		},
		is_main_studio,
	};
}

async function resolveLocationId(artistId: string, location: CreateSpotConventionParams['location']): Promise<string> {
	const maybeId = (location as any)?.id as string | undefined;
	if (maybeId && typeof maybeId === 'string') {
		return maybeId;
	}

	const address = (location as any)?.address;
	if (artistId && address) {
		const { data: existingByAddress, error: findErr } = await supabase
			.from('locations')
			.select('id')
			.eq('artist_id', artistId)
			.eq('address', address)
			.maybeSingle();
		if (!findErr && existingByAddress?.id) {
			return existingByAddress.id;
		}
	}

	const payload = normalizeLocationForInsert(artistId, location);
	const { data: created, error: insErr } = await supabase
		.from('locations')
		.insert([payload])
		.select('id')
		.single();
	if (insErr) {
		throw new Error(insErr.message || 'Failed to create location');
	}
	return created.id as string;
}

export async function createSpotConvention(params: CreateSpotConventionParams): Promise<CreateSpotConventionResult> {
	try {
		if (!params.artistId) {
			return { success: false, error: 'Missing artist id' };
		}
		if (!params.title?.trim()) {
			return { success: false, error: 'Title is required' };
		}
		if (!Array.isArray(params.dates) || params.dates.length === 0) {
			return { success: false, error: 'At least one date is required' };
		}
		if (!params.location) {
			return { success: false, error: 'Location is required' };
		}

		const locationId = await resolveLocationId(params.artistId, params.location);

		const insertPayload = {
			artist_id: params.artistId,
			title: params.title.trim(),
			dates: params.dates,
			diff_time_enabled: !!params.diffTimeEnabled,
			start_times: params.startTimes ?? {},
			end_times: params.endTimes ?? {},
			location_id: locationId,
			notes: params.notes?.trim() || null,
		};

		const { data, error } = await supabase
			.from('spot_conventions')
			.insert([insertPayload])
			.select('id')
			.single();

		if (error) {
			return { success: false, error: error.message || 'Failed to create spot convention' };
		}

		const spotConventionId = data?.id as string | undefined;

		// Best-effort: create a single multi-day event spanning the selected range
		if (spotConventionId && params.dates.length > 0) {
			const sortedDates = [...params.dates].sort();
			const firstDate = sortedDates[0];
			const lastDate = sortedDates[sortedDates.length - 1];

			const start = composeDateTime(firstDate, params.startTimes?.[firstDate], '09:00');
			const end = composeDateTime(lastDate, params.endTimes?.[lastDate], '17:00');

			const ev = await createEvent({
				artistId: params.artistId,
				title: params.title.trim(),
				allDay: false,
				startDate: start,
				endDate: end,
				color: 'orange',
				type: 'background',
				source: 'spot_convention',
				sourceId: spotConventionId,
			});
			if (!ev.success) {
				// Do not fail the main action; log for diagnostics
				console.error('Failed to create multi-day event for spot convention:', ev.error);
			}
		}

		return { success: true, id: spotConventionId };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}



export async function createTempChange(params: CreateTempChangeParams): Promise<CreateTempChangeResult> {
	try {
		if (!params.artistId) {
			return { success: false, error: 'Missing artist id' };
		}
		if (!params.startDate || !params.endDate) {
		 return { success: false, error: 'Start and end dates are required' };
		}
		if (params.endDate < params.startDate) {
			return { success: false, error: 'End date must be after start date' };
		}
		if (!Array.isArray(params.workDays) || params.workDays.length === 0) {
			return { success: false, error: 'At least one work day is required' };
		}
		if (!params.location) {
			return { success: false, error: 'Location is required' };
		}

		const locationId = await resolveLocationId(params.artistId, params.location);

		// Normalize to requested times: start at 00:00, end at 23:00

		const insertPayload = {
			artist_id: params.artistId,
			start_date: params.startDate,
			end_date: params.endDate,
			work_days: params.workDays,
			different_time_enabled: !!params.diffTimeEnabled,
			start_times: params.startTimes ?? {},
			end_times: params.endTimes ?? {},
			location_id: locationId,
			notes: params.notes?.trim() || null,
		};

		const { data, error } = await supabase
			.from('temp_changes')
			.insert([insertPayload])
			.select('id')
			.single();

		if (error) {
			return { success: false, error: error.message || 'Failed to create temp change' };
		}

		const tempChangeId = data?.id as string | undefined;

		// Create a spanning background event for the range
		if (tempChangeId) {

			const normalizedStart = `${params.startDate} 00:00`;
			const normalizedEnd = `${params.endDate} 23:00`;
			const ev = await createEvent({
				artistId: params.artistId,
				title: 'Temporary Change of Work Days',
				allDay: false,
				startDate: normalizedStart,
				endDate: normalizedEnd,
				color: 'purple',
				type: 'background',
				source: 'temp_change',
				sourceId: tempChangeId,
			});
			if (!ev.success) {
				console.error('Failed to create event for temp change:', ev.error);
			}
		}

		return { success: true, id: tempChangeId };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

