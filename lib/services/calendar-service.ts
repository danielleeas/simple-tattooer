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
	location?: Locations;
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
	location?: Locations;
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

export interface CreateOffDaysParams {
	artistId: string;
	title: string;
	startDate: string; // "YYYY-MM-DD"
	endDate: string;   // "YYYY-MM-DD"
	isRepeat?: boolean;
	repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	repeatDuration?: number;
	repeatDurationUnit?: 'days' | 'weeks' | 'months' | 'years';
	notes?: string;
}

export interface CreateOffDaysResult {
	success: boolean;
	id?: string;
	error?: string;
}

export async function createOffDays(params: CreateOffDaysParams): Promise<CreateOffDaysResult> {
	try {
		if (!params.artistId) {
			return { success: false, error: 'Missing artist id' };
		}
		if (!params.title?.trim()) {
			return { success: false, error: 'Title is required' };
		}
		if (!params.startDate || !params.endDate) {
			return { success: false, error: 'Start and end dates are required' };
		}
		if (params.endDate < params.startDate) {
			return { success: false, error: 'End date must be after start date' };
		}

		// Insert an off_days record to track the pattern
		const isRepeat = !!params.isRepeat;
		const resolvedRepeatType = params.repeatType ?? 'daily';
		const resolvedUnit: 'days' | 'weeks' | 'months' | 'years' =
			params.repeatDurationUnit ?? (resolvedRepeatType === 'monthly' ? 'months' : resolvedRepeatType === 'yearly' ? 'years' : 'weeks');
		const resolvedDuration = params.repeatDuration ?? 1;

		const offDaysPayload = {
			artist_id: params.artistId,
			title: params.title.trim(),
			start_date: params.startDate,
			end_date: params.endDate,
			is_repeat: isRepeat,
			repeat_type: resolvedRepeatType,
			repeat_duration: resolvedDuration,
			repeat_duration_unit: resolvedUnit,
			notes: params.notes?.trim() || null,
		};

		const { data: offDaysRow, error: offDaysErr } = await supabase
			.from('off_days')
			.insert([offDaysPayload])
			.select('id')
			.single();

		if (offDaysErr) {
			return { success: false, error: offDaysErr.message || 'Failed to create off_days record' };
		}

		// Helpers for date math
		function parseYmd(ymd: string): Date {
			// Treat as local date at noon to avoid DST issues, then normalize when formatting
			return new Date(`${ymd}T12:00:00`);
		}
		function addDays(d: Date, days: number): Date {
			const nd = new Date(d);
			nd.setDate(nd.getDate() + days);
			return nd;
		}
		function addWeeks(d: Date, weeks: number): Date {
			return addDays(d, weeks * 7);
		}
		function addMonths(d: Date, months: number): Date {
			const nd = new Date(d);
			const m = nd.getMonth() + months;
			nd.setMonth(m);
			return nd;
		}
		function addYears(d: Date, years: number): Date {
			const nd = new Date(d);
			nd.setFullYear(nd.getFullYear() + years);
			return nd;
		}
		function formatYmd(d: Date): string {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${y}-${m}-${day}`;
		}

		// Build occurrences
		const baseStart = parseYmd(params.startDate);
		const baseEnd = parseYmd(params.endDate);
		const spanDays = Math.max(1, Math.round((+baseEnd - +baseStart) / (24 * 60 * 60 * 1000)) + 1);

		// Determine repeat window end (exclusive), ANCHORED TO baseStart.
		// This ensures "2 weeks" means exactly two weekly occurrences including the current one.
		let windowEndExclusive: Date | null = null;
		if (isRepeat) {
			if (resolvedUnit === 'weeks') {
				windowEndExclusive = addWeeks(baseStart, resolvedDuration);
			} else if (resolvedUnit === 'months') {
				windowEndExclusive = addMonths(baseStart, resolvedDuration);
			} else {
				windowEndExclusive = addYears(baseStart, resolvedDuration);
			}
		}

		type Occurrence = { start: Date; end: Date };
		const occurrences: Occurrence[] = [];

		if (!isRepeat) {
			occurrences.push({ start: baseStart, end: baseEnd });
		} else {
			if (resolvedRepeatType === 'daily') {
				// Create one event per day from baseStart up to windowEndExclusive (exclusive)
				let cursor = new Date(baseStart);
				while (windowEndExclusive && cursor < windowEndExclusive) {
					const occStart = new Date(cursor);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursor = addDays(cursor, 1);
				}
			} else if (resolvedRepeatType === 'weekly') {
				// Repeat the same span each week
				let cursorStart = new Date(baseStart);
				while (windowEndExclusive && cursorStart < windowEndExclusive) {
					const occStart = new Date(cursorStart);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursorStart = addWeeks(cursorStart, 1);
				}
			} else if (resolvedRepeatType === 'monthly') {
				// Repeat the same span each month
				let cursorStart = new Date(baseStart);
				while (windowEndExclusive && cursorStart < windowEndExclusive) {
					const occStart = new Date(cursorStart);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursorStart = addMonths(cursorStart, 1);
				}
			} else {
				// yearly - repeat the same span each year on the same date
				let cursorStart = new Date(baseStart);
				while (windowEndExclusive && cursorStart < windowEndExclusive) {
					const occStart = new Date(cursorStart);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursorStart = addYears(cursorStart, 1);
				}
			}
		}

		// Create events for each occurrence, with normalized times
		for (const occ of occurrences) {
			const startStr = `${formatYmd(occ.start)} 00:00`;
			const endStr = `${formatYmd(occ.end)} 23:59`;
			const ev = await createEvent({
				artistId: params.artistId,
				title: params.title.trim(),
				allDay: false,
				startDate: startStr,
				endDate: endStr,
				color: 'blue',
				type: 'background',
				source: 'book_off',
				sourceId: offDaysRow?.id as string,
			});
			if (!ev.success) {
				return { success: false, error: ev.error || 'Failed to create one of the off-days events' };
			}
		}

		return { success: true, id: offDaysRow?.id as string | undefined };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

export type OffDayRecord = {
	id: string;
	artist_id: string;
	title: string;
	start_date: string; // "YYYY-MM-DD"
	end_date: string;   // "YYYY-MM-DD"
	is_repeat: boolean;
	repeat_type?: 'daily' | 'weekly' | 'monthly' | null;
	repeat_duration?: number | null;
	repeat_duration_unit?: 'weeks' | 'months' | 'years' | null;
	notes?: string | null;
};

export async function getOffDayById(id: string): Promise<{ success: boolean; data?: OffDayRecord; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };
		const { data, error } = await supabase
			.from('off_days')
			.select('id, artist_id, title, start_date, end_date, is_repeat, repeat_type, repeat_duration, repeat_duration_unit, notes')
			.eq('id', id)
			.single();
		if (error) {
			return { success: false, error: error.message || 'Failed to load off day' };
		}
		return { success: true, data: data as OffDayRecord };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export async function deleteOffDay(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };
		const { error } = await supabase
			.from('off_days')
			.delete()
			.eq('id', id);
		if (error) {
			return { success: false, error: error.message || 'Failed to delete off day' };
		}
		// Cleanup any events created for this off day
		await supabase
			.from('events')
			.delete()
			.eq('source', 'book_off')
			.eq('source_id', id);
		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

// Update Off Day and reconcile generated events
export type UpdateOffDayInput = {
	title?: string;
	start_date?: string; // "YYYY-MM-DD"
	end_date?: string;   // "YYYY-MM-DD"
	is_repeat?: boolean;
	repeat_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	repeat_duration?: number;
	repeat_duration_unit?: 'days' | 'weeks' | 'months' | 'years';
	notes?: string | null;
};

export async function updateOffDay(
	id: string,
	input: UpdateOffDayInput
): Promise<{ success: boolean; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		// If both dates provided, validate ordering
		if (input.start_date && input.end_date && input.end_date < input.start_date) {
			return { success: false, error: 'End date must be after start date' };
		}

		// Normalize repeat fields
		const isRepeat = !!input.is_repeat;
		const resolvedRepeatType: 'daily' | 'weekly' | 'monthly' | 'yearly' = input.repeat_type ?? 'daily';
		const resolvedRepeatUnit: 'days' | 'weeks' | 'months' | 'years' =
			input.repeat_duration_unit ?? (resolvedRepeatType === 'monthly' ? 'months' : 'weeks');
		const resolvedRepeatDuration: number = input.repeat_duration ?? 1;

		const payload = {
			title: input.title?.trim(),
			start_date: input.start_date,
			end_date: input.end_date,
			is_repeat: isRepeat,
			repeat_type: resolvedRepeatType,
			repeat_duration: resolvedRepeatDuration,
			repeat_duration_unit: resolvedRepeatUnit,
			notes: (input.notes === undefined ? undefined : (input.notes ?? null)),
		};

		const { error: updateError } = await supabase
			.from('off_days')
			.update(payload)
			.eq('id', id);

		if (updateError) {
			return { success: false, error: updateError.message || 'Failed to update off day' };
		}

		// Fetch the updated row to derive occurrences and artist
		const { data: row, error: fetchErr } = await supabase
			.from('off_days')
			.select('artist_id, title, start_date, end_date, is_repeat, repeat_type, repeat_duration, repeat_duration_unit')
			.eq('id', id)
			.single();

		if (fetchErr || !row) {
			return { success: false, error: fetchErr?.message || 'Failed to read updated off day' };
		}

		// Remove prior generated events for this off day
		await supabase
			.from('events')
			.delete()
			.eq('source', 'book_off')
			.eq('source_id', id);

		// Helpers for date math
		function parseYmd(ymd: string): Date {
			return new Date(`${ymd}T12:00:00`);
		}
		function addDays(d: Date, days: number): Date {
			const nd = new Date(d);
			nd.setDate(nd.getDate() + days);
			return nd;
		}
		function addWeeks(d: Date, weeks: number): Date {
			return addDays(d, weeks * 7);
		}
		function addMonths(d: Date, months: number): Date {
			const nd = new Date(d);
			const m = nd.getMonth() + months;
			nd.setMonth(m);
			return nd;
		}
		function addYears(d: Date, years: number): Date {
			const nd = new Date(d);
			nd.setFullYear(nd.getFullYear() + years);
			return nd;
		}
		function formatYmd(d: Date): string {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${y}-${m}-${day}`;
		}

		// Build occurrences from updated row
		const baseStart = parseYmd(row.start_date);
		const baseEnd = parseYmd(row.end_date);
		const spanDays = Math.max(1, Math.round((+baseEnd - +baseStart) / (24 * 60 * 60 * 1000)) + 1);

		let windowEndExclusive: Date | null = null;
		if (row.is_repeat) {
			const unit = (row.repeat_duration_unit ?? (row.repeat_type === 'monthly' ? 'months' : 'weeks')) as 'weeks' | 'months' | 'years';
			const duration = row.repeat_duration ?? 1;
			if (unit === 'weeks') windowEndExclusive = addWeeks(baseStart, duration);
			else if (unit === 'months') windowEndExclusive = addMonths(baseStart, duration);
			else windowEndExclusive = addYears(baseStart, duration);
		}

		type Occurrence = { start: Date; end: Date };
		const occurrences: Occurrence[] = [];
		if (!row.is_repeat) {
			occurrences.push({ start: baseStart, end: baseEnd });
		} else {
			const rType = (row.repeat_type ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly';
			if (rType === 'daily') {
				let cursor = new Date(baseStart);
				while (windowEndExclusive && cursor < windowEndExclusive) {
					const occStart = new Date(cursor);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursor = addDays(cursor, 1);
				}
			} else if (rType === 'weekly') {
				let cursorStart = new Date(baseStart);
				while (windowEndExclusive && cursorStart < windowEndExclusive) {
					const occStart = new Date(cursorStart);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursorStart = addWeeks(cursorStart, 1);
				}
			} else if (rType === 'monthly') {
				let cursorStart = new Date(baseStart);
				while (windowEndExclusive && cursorStart < windowEndExclusive) {
					const occStart = new Date(cursorStart);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursorStart = addMonths(cursorStart, 1);
				}
			} else {
				// yearly - repeat the same span each year on the same date
				let cursorStart = new Date(baseStart);
				while (windowEndExclusive && cursorStart < windowEndExclusive) {
					const occStart = new Date(cursorStart);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursorStart = addYears(cursorStart, 1);
				}
			}
		}

		// Recreate events
		const artistId = (row as { artist_id?: string }).artist_id;
		const title = (row as { title?: string }).title?.trim() || 'Off Day';
		for (const occ of occurrences) {
			const startStr = `${formatYmd(occ.start)} 00:00`;
			const endStr = `${formatYmd(occ.end)} 23:59`;
			const ev = await createEvent({
				artistId: artistId!,
				title,
				allDay: false,
				startDate: startStr,
				endDate: endStr,
				color: 'blue',
				type: 'background',
				source: 'book_off',
				sourceId: id,
			});
			if (!ev.success) {
				return { success: false, error: ev.error || 'Failed to (re)create one of the off-days events' };
			}
		}

		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
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
		start_at: (loc as any).start_at,
		end_at: (loc as any).end_at,
	};
}

const getNewStartAt = (locationStartAt: string | undefined, existingStartAt: string | undefined): string | null => {
	if (!locationStartAt && !existingStartAt) return null;
	if (locationStartAt && !existingStartAt) return locationStartAt;
	if (!locationStartAt && existingStartAt) return existingStartAt;
	if (locationStartAt && existingStartAt) {
		const locationStartAtDate = new Date(locationStartAt);
		const existingStartAtDate = new Date(existingStartAt);
		if (locationStartAtDate < existingStartAtDate) {
			return locationStartAt;
		}
		return existingStartAt;
	}
	return null;
}

const getNewEndAt = (locationEndAt: string | undefined, existingEndAt: string | undefined): string | null => {
	if (!locationEndAt && !existingEndAt) return null;
	if (locationEndAt && !existingEndAt) return locationEndAt;
	if (!locationEndAt && existingEndAt) return existingEndAt;
	if (locationEndAt && existingEndAt) {
		const locationEndAtDate = new Date(locationEndAt);
		const existingEndAtDate = new Date(existingEndAt);
		if (locationEndAtDate > existingEndAtDate) {
			return locationEndAt;
		}
		return existingEndAt;
	}
	return null;
}

async function resolveLocationId(artistId: string, location: CreateSpotConventionParams['location']): Promise<{ id: string; location?: Locations }> {
	const address = (location as any)?.address;
	if (artistId && address) {
		const { data: existingByAddress, error: findErr } = await supabase
			.from('locations')
			.select('id, address, place_id, coordinates, is_main_studio, start_at, end_at')
			.eq('artist_id', artistId)
			.eq('address', address)
			.maybeSingle();

		if (!findErr && existingByAddress?.id) {
			if (!location.is_main_studio) {
				const newStartAt = getNewStartAt(location.start_at, existingByAddress.start_at);
				const newEndAt = getNewEndAt(location.end_at, existingByAddress.end_at);

				if (newStartAt || newEndAt) {
					const { data: updated, error: updateErr } = await supabase
						.from('locations')
						.update({ start_at: newStartAt, end_at: newEndAt })
						.eq('id', existingByAddress.id)
						.select('id, address, place_id, coordinates, is_main_studio, start_at, end_at')
						.single();
					if (updateErr) {
						throw new Error(updateErr.message || 'Failed to update location');
					}
					return { id: updated.id as string, location: updated as unknown as Locations };
				}
			}
			return { id: existingByAddress.id };
		}
	}

	const payload = normalizeLocationForInsert(artistId, location);
	const { data: created, error: insErr } = await supabase
		.from('locations')
		.insert([payload])
		.select('id, address, place_id, coordinates, is_main_studio, start_at, end_at')
		.single();
	if (insErr) {
		throw new Error(insErr.message || 'Failed to create location');
	}
	return { id: created.id as string, location: created as unknown as Locations };
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

		const sortedDates = [...params.dates].sort();
		const firstDate = sortedDates[0];
		const lastDate = sortedDates[sortedDates.length - 1];
		const startAt = "00:00";
		const endAt = "23:59";

		// Avoid mutating a potentially frozen Redux object
		const locationWithTimes: any = { ...(params.location as any) };

		if (startAt) {
			const startAtDate = composeDateTime(firstDate, startAt, '00:00');
			locationWithTimes.start_at = startAtDate;
		}
		if (endAt) {
			const endAtDate = composeDateTime(lastDate, endAt, '23:59');
			locationWithTimes.end_at = endAtDate;
		}

		const { id: locationId, location: newLocation } = await resolveLocationId(params.artistId, locationWithTimes);

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

		return { success: true, id: spotConventionId, location: newLocation };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

export type SpotConventionRecord = {
	id: string;
	artist_id: string;
	title: string;
	dates: string[];
	diff_time_enabled: boolean;
	start_times: Record<string, string>;
	end_times: Record<string, string>;
	location_id: string;
	notes?: string | null;
	location?: {
		id: string;
		address?: string | null;
		place_id?: string | null;
	};
};

export async function getSpotConventionById(id: string): Promise<{ success: boolean; data?: SpotConventionRecord; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		const { data: row, error } = await supabase
			.from('spot_conventions')
			.select('id, artist_id, title, dates, diff_time_enabled, start_times, end_times, location_id, notes')
			.eq('id', id)
			.single();

		if (error) {
			return { success: false, error: error.message || 'Failed to load spot convention' };
		}

		let location: SpotConventionRecord['location'] | undefined = undefined;
		const locationId = (row as any)?.location_id as string | undefined;
		if (locationId) {
			const { data: locRow } = await supabase
				.from('locations')
				.select('id, address, place_id')
				.eq('id', locationId)
				.maybeSingle();
			if (locRow) {
				location = {
					id: (locRow as any).id as string,
					address: (locRow as any).address ?? null,
					place_id: (locRow as any).place_id ?? null,
				};
			}
		}

		const record: SpotConventionRecord = {
			id: (row as any).id,
			artist_id: (row as any).artist_id,
			title: (row as any).title,
			dates: ((row as any).dates ?? []) as string[],
			diff_time_enabled: !!(row as any).diff_time_enabled,
			start_times: ((row as any).start_times ?? {}) as Record<string, string>,
			end_times: ((row as any).end_times ?? {}) as Record<string, string>,
			location_id: (row as any).location_id,
			notes: (row as any).notes ?? null,
			location,
		};

		return { success: true, data: record };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

const removeLocation = async (id: string): Promise<{ success: boolean; error?: string }> => {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		// Load the location so we can respect flags like is_main_studio
		const { data: location, error: locationErr } = await supabase
			.from('locations')
			.select('id, is_main_studio')
			.eq('id', id)
			.maybeSingle();

		if (locationErr) {
			return { success: false, error: locationErr.message || 'Failed to load location' };
		}

		// Nothing to remove
		if (!location) {
			return { success: true };
		}

		// Do not auto-remove main studio locations
		if ((location as any).is_main_studio) {
			return { success: true };
		}

		// Check if any spot conventions still reference this location
		const { count: spotCount, error: spotErr } = await supabase
			.from('spot_conventions')
			.select('id', { count: 'exact', head: true })
			.eq('location_id', id);

		if (spotErr) {
			return { success: false, error: spotErr.message || 'Failed to check spot conventions for location' };
		}
		if ((spotCount ?? 0) > 0) {
			// Location is still in use by a spot convention – do not delete
			return { success: true };
		}

		// Check if any temp changes still reference this location
		const { count: tempCount, error: tempErr } = await supabase
			.from('temp_changes')
			.select('id', { count: 'exact', head: true })
			.eq('location_id', id);

		if (tempErr) {
			return { success: false, error: tempErr.message || 'Failed to check temp changes for location' };
		}
		if ((tempCount ?? 0) > 0) {
			// Location is still in use by a temp change – do not delete
			return { success: true };
		}

		// Safe to delete – no spot conventions or temp changes use this location
		const { error: deleteErr } = await supabase
			.from('locations')
			.delete()
			.eq('id', id);

		if (deleteErr) {
			return { success: false, error: deleteErr.message || 'Failed to remove location' };
		}

		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export type UpdateSpotConventionInput = {
	title: string;
	dates: string[];
	diffTimeEnabled: boolean;
	startTimes: Record<string, string>;
	endTimes: Record<string, string>;
	location: CreateSpotConventionParams['location'];
	notes: string;
};

export async function updateSpotConvention(
	id: string,
	input: UpdateSpotConventionInput
): Promise<{ success: boolean; error?: string; location?: Locations }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };
		if (!input.title?.trim()) return { success: false, error: 'Title is required' };
		if (!Array.isArray(input.dates) || input.dates.length === 0) return { success: false, error: 'At least one date is required' };
		if (!input.location) return { success: false, error: 'Location is required' };
		if (typeof input.diffTimeEnabled !== 'boolean') return { success: false, error: 'Diff time enabled must be a boolean' };
		if (typeof input.startTimes !== 'object') return { success: false, error: 'Start times must be an object' };
		if (typeof input.endTimes !== 'object') return { success: false, error: 'End times must be an object' };
		if (typeof input.notes !== 'string') return { success: false, error: 'Notes must be a string' };

		// Fetch current row so we have artist_id (needed for resolving location)
		// and a baseline snapshot for calendar event recreation.
		const { data: row, error: fetchErr } = await supabase
			.from('spot_conventions')
			.select('artist_id, title, dates, diff_time_enabled, start_times, end_times, location_id, notes')
			.eq('id', id)
			.single();

		if (fetchErr || !row) {
			return { success: false, error: fetchErr?.message || 'Spot convention not found' };
		}

		const artistId = (row as any)?.artist_id as string | undefined;
		if (!artistId) {
			return { success: false, error: 'Missing artist id' };
		}

		// Build payload with only provided fields
		const payload: Record<string, unknown> = {};
		if (typeof input.title === 'string') payload.title = input.title.trim();
		if (Array.isArray(input.dates)) payload.dates = input.dates;
		if (typeof input.diffTimeEnabled === 'boolean') payload.diff_time_enabled = input.diffTimeEnabled;
		if (input.startTimes) payload.start_times = input.startTimes;
		if (input.endTimes) payload.end_times = input.endTimes;

		const oldLocationId = (row as any)?.location_id as string | undefined;
		const sortedDates = [...input.dates].sort();
		const firstDate = sortedDates[0];
		const lastDate = sortedDates[sortedDates.length - 1];
		const startAt = "00:00";
		const endAt = "23:59";

		const locationWithTimes: any = { ...(input.location as any) };
		if (startAt) {
			const startAtDate = composeDateTime(firstDate, startAt, '00:00');
			locationWithTimes.start_at = startAtDate;
		}
		if (endAt) {
			const endAtDate = composeDateTime(lastDate, endAt, '23:59');
			locationWithTimes.end_at = endAtDate;
		}
		console.log('locationWithTimes', locationWithTimes);
		const { id: resolvedId, location: newLocation } = await resolveLocationId(artistId, locationWithTimes);
		payload.location_id = resolvedId;

		if (typeof input.notes !== 'undefined') payload.notes = input.notes?.trim() || null;

		const { error } = await supabase
			.from('spot_conventions')
			.update(payload)
			.eq('id', id);

		if (error) {
			return { success: false, error: error.message || 'Failed to update spot convention' };
		}

		// Fire-and-forget cleanup of the old location; do not block the main flow.
		if (oldLocationId && oldLocationId !== resolvedId) {
			await removeLocation(oldLocationId);
		}

		// Recreate background calendar event for this spot convention
		// 1) Use current values (artist_id, dates, start_times, end_times, title)
		const currentTitle: string = (typeof input.title === 'string' ? input.title : ((row as any)?.title ?? '')) || 'Guest Spot/Convention';
		const currentDates: string[] = Array.isArray(input.dates) ? input.dates : (((row as any)?.dates ?? []) as string[]);
		const currentStartTimes: Record<string, string> = input.startTimes ?? (((row as any)?.start_times ?? {}) as Record<string, string>);
		const currentEndTimes: Record<string, string> = input.endTimes ?? (((row as any)?.end_times ?? {}) as Record<string, string>);

		// 2) Remove prior events for this spot convention
		await supabase
			.from('events')
			.delete()
			.eq('source', 'spot_convention')
			.eq('source_id', id);

		// 3) Create a new spanning event if we have sufficient data
		if (artistId && currentDates.length > 0) {

			const start = composeDateTime(firstDate, currentStartTimes?.[firstDate], '09:00');
			const end = composeDateTime(lastDate, currentEndTimes?.[lastDate], '17:00');

			const ev = await createEvent({
				artistId,
				title: currentTitle.trim(),
				allDay: false,
				startDate: start,
				endDate: end,
				color: 'orange',
				type: 'background',
				source: 'spot_convention',
				sourceId: id,
			});

			if (!ev.success) {
				return { success: false, error: ev.error || 'Failed to (re)create calendar event for spot convention' };
			}
		}

		return { success: true, location: newLocation };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export async function deleteSpotConvention(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		const { error } = await supabase
			.from('spot_conventions')
			.delete()
			.eq('id', id);

		if (error) {
			return { success: false, error: error.message || 'Failed to delete spot convention' };
		}

		// Best-effort cleanup of calendar events created for this record
		await supabase
			.from('events')
			.delete()
			.eq('source', 'spot_convention')
			.eq('source_id', id);

		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
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

		const startAt = "00:00";
		const endAt = "23:59";

		// Avoid mutating a potentially frozen Redux object
		const locationWithTimes: any = { ...(params.location as any) };

		if (startAt) {
			const startAtDate = composeDateTime(params.startDate, startAt, '00:00');
			locationWithTimes.start_at = startAtDate;
		}
		if (endAt) {
			const endAtDate = composeDateTime(params.endDate, endAt, '23:59');
			locationWithTimes.end_at = endAtDate;
		}

		const { id: locationId, location: newLocation } = await resolveLocationId(params.artistId, locationWithTimes);

		// Normalize to requested times: start at 00:00, end at 23:59

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

		return { success: true, id: tempChangeId, location: newLocation };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

export type TempChangeRecord = {
	id: string;
	artist_id: string;
	start_date: string; // "YYYY-MM-DD"
	end_date: string;   // "YYYY-MM-DD"
	work_days: string[];
	different_time_enabled: boolean;
	start_times: Record<string, string>;
	end_times: Record<string, string>;
	location_id: string;
	notes?: string | null;
	location?: {
		id: string;
		address?: string | null;
		place_id?: string | null;
	};
};

export async function getTempChangeById(id: string): Promise<{ success: boolean; data?: TempChangeRecord; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		const { data: row, error } = await supabase
			.from('temp_changes')
			.select(`
				id,
				artist_id,
				start_date,
				end_date,
				work_days,
				different_time_enabled,
				start_times,
				end_times,
				location_id,
				notes,
				location:locations (
					id,
					address,
					place_id
				)
			`)
			.eq('id', id)
			.single();

		if (error) {
			return { success: false, error: error.message || 'Failed to load temp change' };
		}

		let location: TempChangeRecord['location'] | undefined = undefined;
		const loc = (row as any)?.location as { id: string; address?: string | null; place_id?: string | null } | null | undefined;
		if (loc) {
			location = {
				id: loc.id,
				address: (loc as any).address ?? null,
				place_id: (loc as any).place_id ?? null,
			};
		}

		const record: TempChangeRecord = {
			id: (row as any).id,
			artist_id: (row as any).artist_id,
			start_date: (row as any).start_date,
			end_date: (row as any).end_date,
			work_days: ((row as any).work_days ?? []) as string[],
			different_time_enabled: !!(row as any).different_time_enabled,
			start_times: ((row as any).start_times ?? {}) as Record<string, string>,
			end_times: ((row as any).end_times ?? {}) as Record<string, string>,
			location_id: (row as any).location_id,
			notes: (row as any).notes ?? null,
			location,
		};

		return { success: true, data: record };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export type UpdateTempChangeInput = {
	start_date?: string | null;
	end_date?: string | null;
	work_days?: string[];
	different_time_enabled?: boolean;
	start_times?: Record<string, string>;
	end_times?: Record<string, string>;
	location?: CreateTempChangeParams['location'];
	notes?: string | null;
};

export async function updateTempChange(
	id: string,
	input: UpdateTempChangeInput
): Promise<{ success: boolean; error?: string; location?: Locations }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		// Fetch current row so we have artist_id (needed for resolving location)
		const { data: row, error: fetchErr } = await supabase
			.from('temp_changes')
			.select('artist_id, start_date, end_date, location_id')
			.eq('id', id)
			.single();

		if (fetchErr || !row) {
			return { success: false, error: fetchErr?.message || 'Temp change not found' };
		}

		const artistId = (row as any)?.artist_id as string | undefined;
		if (!artistId) {
			return { success: false, error: 'Missing artist id' };
		}

		const payload: Record<string, unknown> = {};
		if (typeof input.start_date === 'string' || input.start_date === null) payload.start_date = input.start_date;
		if (typeof input.end_date === 'string' || input.end_date === null) payload.end_date = input.end_date;
		if (Array.isArray(input.work_days)) payload.work_days = input.work_days;
		if (typeof input.different_time_enabled === 'boolean') payload.different_time_enabled = input.different_time_enabled;
		if (input.start_times) payload.start_times = input.start_times;
		if (input.end_times) payload.end_times = input.end_times;

		const oldLocationId = (row as any)?.location_id as string | undefined;
		let newLocation: Locations | undefined;

		// Handle location if provided
		if (input.location) {
			const startDate = input.start_date ?? ((row as any)?.start_date as string);
			const endDate = input.end_date ?? ((row as any)?.end_date as string);
			const startAt = "00:00";
			const endAt = "23:59";

			const locationWithTimes: any = { ...(input.location as any) };
			if (startAt && startDate) {
				const startAtDate = composeDateTime(startDate, startAt, '00:00');
				locationWithTimes.start_at = startAtDate;
			}
			if (endAt && endDate) {
				const endAtDate = composeDateTime(endDate, endAt, '23:59');
				locationWithTimes.end_at = endAtDate;
			}

			const { id: resolvedId, location } = await resolveLocationId(artistId, locationWithTimes);
			payload.location_id = resolvedId;
			newLocation = location;
		}

		if (typeof input.notes !== 'undefined') payload.notes = input.notes ?? null;

		const { error } = await supabase
			.from('temp_changes')
			.update(payload)
			.eq('id', id);

		if (error) {
			return { success: false, error: error.message || 'Failed to update temp change' };
		}

		// Fire-and-forget cleanup of the old location; do not block the main flow.
		if (oldLocationId && payload.location_id && oldLocationId !== payload.location_id) {
			await removeLocation(oldLocationId);
		}

		// Recreate background event for this temp change
		// 1) Use current values (artistId already fetched, and start_date, end_date)
		const startDate = (typeof input.start_date === 'string' ? input.start_date : ((row as any)?.start_date as string | undefined));
		const endDate = (typeof input.end_date === 'string' ? input.end_date : ((row as any)?.end_date as string | undefined));

		// 2) Remove prior events for this temp change
		await supabase
			.from('events')
			.delete()
			.eq('source', 'temp_change')
			.eq('source_id', id);

		// 3) Create a new spanning event if we have sufficient data
		if (artistId && startDate && endDate) {
			const normalizedStart = `${startDate} 00:00`;
			const normalizedEnd = `${endDate} 23:00`;
			const ev = await createEvent({
				artistId,
				title: 'Temporary Change of Work Days',
				allDay: false,
				startDate: normalizedStart,
				endDate: normalizedEnd,
				color: 'purple',
				type: 'background',
				source: 'temp_change',
				sourceId: id,
			});

			if (!ev.success) {
				return { success: false, error: ev.error || 'Failed to (re)create calendar event for temp change' };
			}
		}

		return { success: true, location: newLocation };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export async function deleteTempChange(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		const { error } = await supabase
			.from('temp_changes')
			.delete()
			.eq('id', id);

		if (error) {
			return { success: false, error: error.message || 'Failed to delete temp change' };
		}

		// Best-effort cleanup of calendar events created for this record
		await supabase
			.from('events')
			.delete()
			.eq('source', 'temp_change')
			.eq('source_id', id);

		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

// Create Event/Block Time (single-day time range, optional future enhancements for repeats/off-booking)
export interface CheckEventOverlapParams {
	artistId: string;
	date: string; // "YYYY-MM-DD"
	startTime: string; // "HH:mm"
	endTime: string;   // "HH:mm"
	break_time?: number; // Break time in minutes (from artist.flow.buffer_between_sessions)
	source?: string; // Source of the event being created ('block_time', 'session', 'quick_appointment', etc.)
}

export interface CheckEventOverlapResult {
	success: boolean;
	hasOverlap?: boolean;
	overlappingEvent?: CalendarEvent;
	error?: string;
}

// Check if a time range overlaps with existing events of type 'item' on a specific date
export async function checkEventOverlap(params: CheckEventOverlapParams): Promise<CheckEventOverlapResult> {
	try {
		if (!params.artistId) {
			return { success: false, error: 'Missing artist id' };
		}
		if (!params.date || !params.startTime || !params.endTime) {
			return { success: false, error: 'Missing required parameters' };
		}

		console.log("times", params.startTime, params.endTime)

		// Query events for the specific date where type = 'item'
		// Events are stored as "YYYY-MM-DD HH:mm", so we check events that overlap with this date
		const dateStart = `${params.date} 00:00`;
		const dateEnd = `${params.date} 23:59`;

		const { data, error } = await supabase
			.from('events')
			.select('id, artist_id, title, allday, start_date, end_date, color, type, source, source_id')
			.eq('artist_id', params.artistId)
			.eq('type', 'item')
			.lte('start_date', dateEnd)
			.gte('end_date', dateStart)
			.order('start_date', { ascending: true });

		if (error) {
			return { success: false, error: error.message || 'Failed to check for overlapping events' };
		}

		const events = (data ?? []) as CalendarEvent[];

		// Convert new event times to minutes for comparison
		const [newSh, newSm] = params.startTime.split(':').map(n => parseInt(n, 10));
		const [newEh, newEm] = params.endTime.split(':').map(n => parseInt(n, 10));
		const newStartMinutes = newSh * 60 + newSm;
		const newEndMinutes = newEh * 60 + newEm;

		// Get break time buffer (default to 0 if not provided)
		const breakTime = params.break_time || 0;

		// Check for overlaps based on event source type
		for (const event of events) {
			// Skip all-day events
			if (event.allday) continue;

			// Extract date and time from event's start_date and end_date
			// Format is "YYYY-MM-DD HH:mm"
			const eventStartDateTime = normalizeDbDateTime(event.start_date);
			const eventEndDateTime = normalizeDbDateTime(event.end_date);

			// Extract date and time parts
			const eventStartDate = eventStartDateTime.split(' ')[0];
			const eventEndDate = eventEndDateTime.split(' ')[0];
			const eventStartTime = eventStartDateTime.split(' ')[1] || '00:00';
			const eventEndTime = eventEndDateTime.split(' ')[1] || '23:59';

			// Only check events that are on the same date
			if (eventStartDate !== params.date && eventEndDate !== params.date) {
				continue;
			}

			// For events on the same date, check time overlap
			let evStartMinutes: number;
			let evEndMinutes: number;

			if (eventStartDate === params.date && eventEndDate === params.date) {
				// Same day event - use the event's times directly
				const [evSh, evSm] = eventStartTime.split(':').map(n => parseInt(n, 10));
				const [evEh, evEm] = eventEndTime.split(':').map(n => parseInt(n, 10));
				evStartMinutes = evSh * 60 + evSm;
				evEndMinutes = evEh * 60 + evEm;
			} else if (eventStartDate === params.date) {
				// Event starts on this date but ends later - use event start time and end of day
				const [evSh, evSm] = eventStartTime.split(':').map(n => parseInt(n, 10));
				evStartMinutes = evSh * 60 + evSm;
				evEndMinutes = 24 * 60; // End of day (1440 minutes)
			} else {
				// Event ends on this date but started earlier - use start of day and event end time
				evStartMinutes = 0; // Start of day
				const [evEh, evEm] = eventEndTime.split(':').map(n => parseInt(n, 10));
				evEndMinutes = evEh * 60 + evEm;
			}

			// Check overlap based on both the new event source and existing event source
			const newEventSource = params.source;
			const existingEventSource = event.source;
			let hasConflict = false;

			// If creating a block_time event, always use simple overlap check (no break time required)
			if (newEventSource === 'block_time') {
				// Simple overlap check: newStart < evEnd AND newEnd > evStart
				hasConflict = newStartMinutes < evEndMinutes && newEndMinutes > evStartMinutes;
			} else if (newEventSource === 'session' || newEventSource === 'quick_appointment') {
				// If creating a session/quick_appointment event
				if (existingEventSource === 'session' || existingEventSource === 'quick_appointment') {
					// Both are appointment events - require break time buffer
					// A new event conflicts if it doesn't have enough break time before OR after the existing appointment
					// It's allowed if:
					//   newEndMinutes <= evStartMinutes - breakTime  (enough break before the appointment)
					//   OR
					//   newStartMinutes >= evEndMinutes + breakTime  (enough break after the appointment)
					const latestAllowedEndBeforeAppt = evStartMinutes - breakTime;
					const earliestAllowedStartAfterAppt = evEndMinutes + breakTime;

					const hasEnoughBreakBefore = newEndMinutes <= latestAllowedEndBeforeAppt;
					const hasEnoughBreakAfter = newStartMinutes >= earliestAllowedStartAfterAppt;

					// Conflict if there's not enough break before AND not enough break after
					hasConflict = !hasEnoughBreakBefore && !hasEnoughBreakAfter;
				} else {
					// Existing event is not a session/quick_appointment (e.g., block_time) - simple overlap check
					hasConflict = newStartMinutes < evEndMinutes && newEndMinutes > evStartMinutes;
				}
			} else {
				// For other event types or when source is not specified, use simple overlap check
				hasConflict = newStartMinutes < evEndMinutes && newEndMinutes > evStartMinutes;
			}

			if (hasConflict) {
				return { success: true, hasOverlap: true, overlappingEvent: event };
			}
		}

		return { success: true, hasOverlap: false };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

export interface CreateEventBlockTimeParams {
	artistId: string;
	date: string; // "YYYY-MM-DD"
	title: string;
	startTime?: string; // "HH:mm"
	endTime?: string;   // "HH:mm"
	repeatable?: boolean;
	repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	repeatDuration?: number;
	repeatDurationUnit?: 'days' | 'weeks' | 'months' | 'years';
	notes?: string;
	location?: string;
}

export interface CreateEventBlockTimeResult {
	success: boolean;
	id?: string;
	error?: string;
}

export async function createEventBlockTime(params: CreateEventBlockTimeParams): Promise<CreateEventBlockTimeResult> {
	try {
		if (!params.artistId) {
			return { success: false, error: 'Missing artist id' };
		}
		if (!params.title?.trim()) {
			return { success: false, error: 'Title is required' };
		}
		if (!params.date) {
			return { success: false, error: 'Date is required' };
		}

		// Validate times if provided: end must be after start
		const startTimeStr = params.startTime ?? '09:00';
		const endTimeStr = params.endTime ?? '17:00';
		if (startTimeStr && endTimeStr) {
			const [sh, sm] = startTimeStr.split(':').map(n => parseInt(n, 10));
			const [eh, em] = endTimeStr.split(':').map(n => parseInt(n, 10));
			if ((eh * 60 + em) <= (sh * 60 + sm)) {
				return { success: false, error: 'End time must be after start time' };
			}
		}

		// Insert primary block-time record
		const isRepeat = !!params.repeatable;
		const resolvedRepeatType: 'daily' | 'weekly' | 'monthly' | 'yearly' = params.repeatType ?? 'daily';
		const resolvedUnit: 'days' | 'weeks' | 'months' | 'years' =
			params.repeatDurationUnit ?? (resolvedRepeatType === 'monthly' ? 'months' : 'weeks');
		const resolvedDuration = params.repeatDuration ?? 1;

		const insertPayload = {
			artist_id: params.artistId,
			title: params.title.trim(),
			date: params.date,
			start_time: startTimeStr,
			end_time: endTimeStr,
			repeatable: isRepeat,
			repeat_type: resolvedRepeatType,
			repeat_duration: resolvedDuration,
			repeat_duration_unit: resolvedUnit,
			notes: params.notes?.trim() || null,
			location: params.location?.trim() || null,
		};

		const { data: blockRow, error: blockErr } = await supabase
			.from('event_block_times')
			.insert([insertPayload])
			.select('id, date')
			.single();

		if (blockErr) {
			return { success: false, error: blockErr.message || 'Failed to create event block time' };
		}

		// Helpers for date math
		function parseYmd(ymd: string): Date {
			return new Date(`${ymd}T12:00:00`);
		}
		function addDays(d: Date, days: number): Date {
			const nd = new Date(d);
			nd.setDate(nd.getDate() + days);
			return nd;
		}
		function addWeeks(d: Date, weeks: number): Date {
			return addDays(d, weeks * 7);
		}
		function addMonths(d: Date, months: number): Date {
			const nd = new Date(d);
			const m = nd.getMonth() + months;
			nd.setMonth(m);
			return nd;
		}
		function addYears(d: Date, years: number): Date {
			const nd = new Date(d);
			nd.setFullYear(nd.getFullYear() + years);
			return nd;
		}
		function formatYmd(d: Date): string {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${y}-${m}-${day}`;
		}

		// Build occurrences based on repeat settings
		const base = parseYmd(params.date);
		let windowEndExclusive: Date | null = null;
		if (isRepeat) {
			if (resolvedUnit === 'weeks') {
				windowEndExclusive = addWeeks(base, resolvedDuration);
			} else if (resolvedUnit === 'months') {
				windowEndExclusive = addMonths(base, resolvedDuration);
			} else {
				windowEndExclusive = addYears(base, resolvedDuration);
			}
		}

		const occurrences: Date[] = [];
		if (!isRepeat) {
			occurrences.push(base);
		} else {
			if (resolvedRepeatType === 'daily') {
				let cursor = new Date(base);
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addDays(cursor, 1);
				}
			} else if (resolvedRepeatType === 'weekly') {
				let cursor = new Date(base);
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addWeeks(cursor, 1);
				}
			} else if (resolvedRepeatType === 'monthly') {
				let cursor = new Date(base);
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addMonths(cursor, 1);
				}
			} else {
				// yearly - repeat on the same date each year
				let cursor = new Date(base);
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addYears(cursor, 1);
				}
			}
		}

		// Create calendar events for each occurrence
		for (const occ of occurrences) {
			const ymd = formatYmd(occ);
			const start = composeDateTime(ymd, startTimeStr, '09:00');
			const end = composeDateTime(ymd, endTimeStr, '17:00');

			const ev = await createEvent({
				artistId: params.artistId,
				title: params.title.trim(),
				allDay: false,
				startDate: start,
				endDate: end,
				color: 'green',
				type: 'item',
				source: 'block_time',
				sourceId: blockRow?.id as string,
			});
			if (!ev.success) {
				return { success: false, error: ev.error || 'Failed to create one of the block-time events' };
			}
		}

		return { success: true, id: blockRow?.id as string | undefined };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

// Read helpers for Event/Block Time
export interface EventBlockTimeRecord {
	id: string;
	artist_id: string;
	title: string;
	date: string;
	start_time: string;
	end_time: string;
	repeatable: boolean;
	repeat_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
	repeat_duration?: number | null;
	repeat_duration_unit?: 'days' | 'weeks' | 'months' | 'years' | null;
	notes?: string | null;
	location?: string | null;
}

export async function getEventBlockTimeById(id: string): Promise<{ success: boolean; data?: EventBlockTimeRecord; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };
		const { data, error } = await supabase
			.from('event_block_times')
			.select('*')
			.eq('id', id)
			.single();
		if (error) {
			return { success: false, error: error.message || 'Failed to load event' };
		}
		return { success: true, data: data as EventBlockTimeRecord };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export async function deleteEventBlockTime(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };
		const { error } = await supabase
			.from('event_block_times')
			.delete()
			.eq('id', id);
		if (error) {
			return { success: false, error: error.message || 'Failed to delete event' };
		}
		// Optional: also delete related calendar events created from this block time
		await supabase
			.from('events')
			.delete()
			.eq('source', 'block_time')
			.eq('source_id', id);
		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

// Update helpers for Event/Block Time
export type UpdateEventBlockTimeInput = Pick<
	EventBlockTimeRecord,
	| 'title'
	| 'date'
	| 'start_time'
	| 'end_time'
	| 'repeatable'
	| 'repeat_type'
	| 'repeat_duration'
	| 'repeat_duration_unit'
	| 'notes'
	| 'location'
> & {
	// Allow passthrough to avoid excess property errors from callers spreading an existing record
	id?: string;
	artist_id?: string;
};

export async function updateEventBlockTime(
	id: string,
	input: UpdateEventBlockTimeInput
): Promise<{ success: boolean; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		// Validate times if provided
		if (input.start_time && input.end_time) {
			const [sh, sm] = String(input.start_time).split(':').map(n => parseInt(n, 10));
			const [eh, em] = String(input.end_time).split(':').map(n => parseInt(n, 10));
			if ((eh * 60 + em) <= (sh * 60 + sm)) {
				return { success: false, error: 'End time must be after start time' };
			}
		}

		// Resolve repeat fields (never write nulls to NOT NULL columns)
		const isRepeat = !!input.repeatable;
		const resolvedRepeatType: 'daily' | 'weekly' | 'monthly' | 'yearly' =
			input.repeat_type ?? 'daily';
		const resolvedRepeatUnit: 'days' | 'weeks' | 'months' | 'years' =
			input.repeat_duration_unit ?? ((resolvedRepeatType === 'monthly') ? 'months' : (resolvedRepeatType === 'yearly') ? 'years' : 'weeks');
		const resolvedRepeatDuration: number =
			input.repeat_duration ?? 1;

		const payload = {
			title: input.title?.trim(),
			date: input.date,
			start_time: input.start_time,
			end_time: input.end_time,
			repeatable: isRepeat,
			repeat_type: resolvedRepeatType,
			repeat_duration: resolvedRepeatDuration,
			repeat_duration_unit: resolvedRepeatUnit,
			notes: input.notes?.trim() ?? null,
			location: input.location?.trim() ?? null,
		};

		const { error } = await supabase
			.from('event_block_times')
			.update(payload)
			.eq('id', id);

		if (error) {
			return { success: false, error: error.message || 'Failed to update event' };
		}

		// Reconcile existing calendar events created from this block-time:
		// Strategy: delete prior generated events for this block and recreate based on new settings.
		// Fetch artist id if not provided in input
		let artistId = input.artist_id;
		if (!artistId) {
			const { data: row } = await supabase
				.from('event_block_times')
				.select('artist_id')
				.eq('id', id)
				.single();
			artistId = (row as { artist_id?: string } | null)?.artist_id;
		}

		if (artistId) {
			// Remove prior events for this block
			await supabase
				.from('events')
				.delete()
				.eq('source', 'block_time')
				.eq('source_id', id);

			// Helpers for date math
			function parseYmd(ymd: string): Date {
				return new Date(`${ymd}T12:00:00`);
			}
			function addDays(d: Date, days: number): Date {
				const nd = new Date(d);
				nd.setDate(nd.getDate() + days);
				return nd;
			}
			function addWeeks(d: Date, weeks: number): Date {
				return addDays(d, weeks * 7);
			}
			function addMonths(d: Date, months: number): Date {
				const nd = new Date(d);
				const m = nd.getMonth() + months;
				nd.setMonth(m);
				return nd;
			}
			function addYears(d: Date, years: number): Date {
				const nd = new Date(d);
				nd.setFullYear(nd.getFullYear() + years);
				return nd;
			}
			function formatYmd(d: Date): string {
				const y = d.getFullYear();
				const m = String(d.getMonth() + 1).padStart(2, '0');
				const day = String(d.getDate()).padStart(2, '0');
				return `${y}-${m}-${day}`;
			}

			const startTimeStr = input.start_time ?? '09:00';
			const endTimeStr = input.end_time ?? '17:00';

			// Build occurrences based on repeat settings
			const baseDate = input.date || undefined;
			if (baseDate) {
				const base = parseYmd(baseDate);
				const isRepeatOcc = !!input.repeatable;

				let windowEndExclusive: Date | null = null;
				if (isRepeatOcc) {
					const resolvedRepeatType: 'daily' | 'weekly' | 'monthly' | 'yearly' = (input.repeat_type ?? 'daily');
					const resolvedUnit: 'days' | 'weeks' | 'months' | 'years' =
						(input.repeat_duration_unit ?? (resolvedRepeatType === 'monthly' ? 'months' : 'weeks'));
					const resolvedDuration = input.repeat_duration ?? 1;
					if (resolvedUnit === 'weeks') {
						windowEndExclusive = addWeeks(base, resolvedDuration);
					} else if (resolvedUnit === 'months') {
						windowEndExclusive = addMonths(base, resolvedDuration);
					} else {
						windowEndExclusive = addYears(base, resolvedDuration);
					}
				}

				const occurrences: Date[] = [];
				if (!isRepeatOcc) {
					occurrences.push(base);
				} else {
					const repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly' = (input.repeat_type ?? 'daily');
					if (repeatType === 'daily') {
						let cursor = new Date(base);
						while (windowEndExclusive && cursor < windowEndExclusive) {
							occurrences.push(new Date(cursor));
							cursor = addDays(cursor, 1);
						}
					} else if (repeatType === 'weekly') {
						let cursor = new Date(base);
						while (windowEndExclusive && cursor < windowEndExclusive) {
							occurrences.push(new Date(cursor));
							cursor = addWeeks(cursor, 1);
						}
					} else if (repeatType === 'monthly') {
						let cursor = new Date(base);
						while (windowEndExclusive && cursor < windowEndExclusive) {
							occurrences.push(new Date(cursor));
							cursor = addMonths(cursor, 1);
						}
					} else {
						// yearly - repeat on the same date each year
						let cursor = new Date(base);
						while (windowEndExclusive && cursor < windowEndExclusive) {
							occurrences.push(new Date(cursor));
							cursor = addYears(cursor, 1);
						}
					}
				}

				for (const occ of occurrences) {
					const ymd = formatYmd(occ);
					const start = composeDateTime(ymd, startTimeStr, '09:00');
					const end = composeDateTime(ymd, endTimeStr, '17:00');
					const titleForEvents = (input.title ?? '').trim() || 'Event';

					const ev = await createEvent({
						artistId,
						title: titleForEvents,
						allDay: false,
						startDate: start,
						endDate: end,
						color: 'green',
						type: 'item',
						source: 'block_time',
						sourceId: id,
					});
					if (!ev.success) {
						return { success: false, error: ev.error || 'Failed to (re)create one of the block-time events' };
					}
				}
			}
		}

		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Mark Unavailable
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateMarkUnavailableParams {
	artistId: string;
	date: string;
	repeatable?: boolean;
	repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	repeatDuration?: number;
	repeatDurationUnit?: 'days' | 'weeks' | 'months' | 'years';
	notes?: string;
}

export interface CreateMarkUnavailableResult {
	success: boolean;
	error?: string;
}

export async function createMarkUnavailable(params: CreateMarkUnavailableParams): Promise<CreateMarkUnavailableResult> {
	try {
		if (!params.artistId) {
			return { success: false, error: 'Missing artist id' };
		}
		if (!params.date) {
			return { success: false, error: 'Date is required' };
		}

		const isRepeat = !!params.repeatable;
		const resolvedRepeatType: 'daily' | 'weekly' | 'monthly' | 'yearly' = params.repeatType ?? 'daily';
		const resolvedUnit: 'days' | 'weeks' | 'months' | 'years' =
			params.repeatDurationUnit ?? (resolvedRepeatType === 'monthly' ? 'months' : 'weeks');
		const resolvedDuration = params.repeatDuration ?? 1;

		const insertPayload = {
			artist_id: params.artistId,
			date: params.date,
			repeatable: isRepeat,
			repeat_type: resolvedRepeatType,
			repeat_duration: resolvedDuration,
			repeat_duration_unit: resolvedUnit,
			notes: params.notes?.trim() || null,
		};

		const { data: row, error: insertErr } = await supabase
			.from('mark_unavailables')
			.insert([insertPayload])
			.select('id')
			.single();

		if (insertErr) {
			return { success: false, error: insertErr.message || 'Failed to mark unavailable' };
		}

		// Helpers for date math
		function parseYmd(ymd: string): Date {
			return new Date(`${ymd}T12:00:00`);
		}
		function addDays(d: Date, days: number): Date {
			const nd = new Date(d);
			nd.setDate(nd.getDate() + days);
			return nd;
		}
		function addWeeks(d: Date, weeks: number): Date {
			return addDays(d, weeks * 7);
		}
		function addMonths(d: Date, months: number): Date {
			const nd = new Date(d);
			nd.setMonth(nd.getMonth() + months);
			return nd;
		}
		function addYears(d: Date, years: number): Date {
			const nd = new Date(d);
			nd.setFullYear(nd.getFullYear() + years);
			return nd;
		}
		function formatYmd(d: Date): string {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${y}-${m}-${day}`;
		}

		// Build occurrences
		const baseDate = parseYmd(params.date);
		let windowEndExclusive: Date | null = null;
		if (isRepeat) {
			if (resolvedUnit === 'days') {
				windowEndExclusive = addDays(baseDate, resolvedDuration);
			} else if (resolvedUnit === 'weeks') {
				windowEndExclusive = addWeeks(baseDate, resolvedDuration);
			} else if (resolvedUnit === 'months') {
				windowEndExclusive = addMonths(baseDate, resolvedDuration);
			} else {
				windowEndExclusive = addYears(baseDate, resolvedDuration);
			}
		}

		const occurrences: Date[] = [];

		if (!isRepeat) {
			occurrences.push(baseDate);
		} else {
			let cursor = new Date(baseDate);
			if (resolvedRepeatType === 'daily') {
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addDays(cursor, 1);
				}
			} else if (resolvedRepeatType === 'weekly') {
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addWeeks(cursor, 1);
				}
			} else if (resolvedRepeatType === 'monthly') {
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addMonths(cursor, 1);
				}
			} else {
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addYears(cursor, 1);
				}
			}
		}

		// Create all-day events for each occurrence
		for (const occ of occurrences) {
			const dateStr = formatYmd(occ);
			await createEvent({
				artistId: params.artistId,
				title: 'Unavailable',
				startDate: `${dateStr} 00:00`,
				endDate: `${dateStr} 23:59`,
				allDay: true,
				color: 'blue',
				type: 'background',
				source: 'mark_unavailable',
				sourceId: row.id,
			});
		}

		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export interface MarkUnavailableRecord {
	id: string;
	artist_id: string;
	date: string;
	repeatable: boolean;
	repeat_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
	repeat_duration: number;
	repeat_duration_unit: 'days' | 'weeks' | 'months' | 'years';
	notes: string | null;
}

export async function getMarkUnavailableById(id: string): Promise<{ success: boolean; data?: MarkUnavailableRecord; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };
		const { data, error } = await supabase
			.from('mark_unavailables')
			.select('*')
			.eq('id', id)
			.single();
		if (error) {
			return { success: false, error: error.message || 'Failed to load mark unavailable' };
		}
		return { success: true, data: data as MarkUnavailableRecord };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export async function updateMarkUnavailable(id: string, params: Partial<CreateMarkUnavailableParams>): Promise<CreateMarkUnavailableResult> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		const { data: existing, error: fetchErr } = await supabase
			.from('mark_unavailables')
			.select('*')
			.eq('id', id)
			.single();

		if (fetchErr || !existing) {
			return { success: false, error: fetchErr?.message || 'Record not found' };
		}

		const isRepeat = params.repeatable ?? existing.repeatable;
		const resolvedRepeatType = params.repeatType ?? existing.repeat_type;
		const resolvedUnit = params.repeatDurationUnit ?? existing.repeat_duration_unit;
		const resolvedDuration = params.repeatDuration ?? existing.repeat_duration;
		const dateStr = params.date ?? existing.date;
		const artistId = params.artistId ?? existing.artist_id;

		const updatePayload = {
			date: dateStr,
			repeatable: isRepeat,
			repeat_type: resolvedRepeatType,
			repeat_duration: resolvedDuration,
			repeat_duration_unit: resolvedUnit,
			notes: params.notes?.trim() || null,
		};

		const { error: updateErr } = await supabase
			.from('mark_unavailables')
			.update(updatePayload)
			.eq('id', id);

		if (updateErr) {
			return { success: false, error: updateErr.message || 'Failed to update' };
		}

		// Delete old events and recreate
		await supabase
			.from('events')
			.delete()
			.eq('source', 'mark_unavailable')
			.eq('source_id', id);

		// Helpers for date math
		function parseYmd(ymd: string): Date {
			return new Date(`${ymd}T12:00:00`);
		}
		function addDays(d: Date, days: number): Date {
			const nd = new Date(d);
			nd.setDate(nd.getDate() + days);
			return nd;
		}
		function addWeeks(d: Date, weeks: number): Date {
			return addDays(d, weeks * 7);
		}
		function addMonths(d: Date, months: number): Date {
			const nd = new Date(d);
			nd.setMonth(nd.getMonth() + months);
			return nd;
		}
		function addYears(d: Date, years: number): Date {
			const nd = new Date(d);
			nd.setFullYear(nd.getFullYear() + years);
			return nd;
		}
		function formatYmd(d: Date): string {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${y}-${m}-${day}`;
		}

		const baseDate = parseYmd(dateStr);
		let windowEndExclusive: Date | null = null;
		if (isRepeat) {
			if (resolvedUnit === 'days') {
				windowEndExclusive = addDays(baseDate, resolvedDuration);
			} else if (resolvedUnit === 'weeks') {
				windowEndExclusive = addWeeks(baseDate, resolvedDuration);
			} else if (resolvedUnit === 'months') {
				windowEndExclusive = addMonths(baseDate, resolvedDuration);
			} else {
				windowEndExclusive = addYears(baseDate, resolvedDuration);
			}
		}

		const occurrences: Date[] = [];
		if (!isRepeat) {
			occurrences.push(baseDate);
		} else {
			let cursor = new Date(baseDate);
			if (resolvedRepeatType === 'daily') {
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addDays(cursor, 1);
				}
			} else if (resolvedRepeatType === 'weekly') {
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addWeeks(cursor, 1);
				}
			} else if (resolvedRepeatType === 'monthly') {
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addMonths(cursor, 1);
				}
			} else {
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addYears(cursor, 1);
				}
			}
		}

		for (const occ of occurrences) {
			const occDateStr = formatYmd(occ);
			await createEvent({
				artistId,
				title: 'Unavailable',
				startDate: `${occDateStr} 00:00`,
				endDate: `${occDateStr} 23:59`,
				allDay: true,
				color: 'blue',
				type: 'background',
				source: 'mark_unavailable',
				sourceId: id,
			});
		}

		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export async function deleteMarkUnavailable(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		if (!id) return { success: false, error: 'Missing id' };

		const { error } = await supabase
			.from('mark_unavailables')
			.delete()
			.eq('id', id);

		if (error) {
			return { success: false, error: error.message || 'Failed to delete' };
		}

		await supabase
			.from('events')
			.delete()
			.eq('source', 'mark_unavailable')
			.eq('source_id', id);

		return { success: true };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}