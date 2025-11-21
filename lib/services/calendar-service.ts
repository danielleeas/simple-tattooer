import { supabase } from '@/lib/supabase';
import { uuidv4 } from '@/lib/utils';
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

export interface CreateOffDaysParams {
	artistId: string;
	title: string;
	startDate: string; // "YYYY-MM-DD"
	endDate: string;   // "YYYY-MM-DD"
	isRepeat?: boolean;
	repeatType?: 'daily' | 'weekly' | 'monthly';
	repeatDuration?: number;
	repeatDurationUnit?: 'weeks' | 'months' | 'years';
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
		const resolvedUnit: 'weeks' | 'months' | 'years' =
			params.repeatDurationUnit ?? (resolvedRepeatType === 'monthly' ? 'months' : 'weeks');
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
			} else {
				// monthly
				let cursorStart = new Date(baseStart);
				while (windowEndExclusive && cursorStart < windowEndExclusive) {
					const occStart = new Date(cursorStart);
					const occEnd = addDays(occStart, spanDays - 1);
					occurrences.push({ start: occStart, end: occEnd });
					cursorStart = addMonths(cursorStart, 1);
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

// Create Event/Block Time (single-day time range, optional future enhancements for repeats/off-booking)
export interface CreateEventBlockTimeParams {
	artistId: string;
	date: string; // "YYYY-MM-DD"
	title: string;
	startTime?: string; // "HH:mm"
	endTime?: string;   // "HH:mm"
	repeatable?: boolean;
	repeatType?: 'daily' | 'weekly' | 'monthly';
	repeatDuration?: number;
	repeatDurationUnit?: 'weeks' | 'months' | 'years';
	notes?: string;
	offBookingEnabled?: boolean;
	offBookingRepeatable?: boolean;
	offBookingRepeatType?: 'daily' | 'weekly' | 'monthly';
	offBookingRepeatDuration?: number;
	offBookingRepeatDurationUnit?: 'weeks' | 'months' | 'years';
	offBookingNotes?: string;
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
		const resolvedRepeatType: 'daily' | 'weekly' | 'monthly' = params.repeatType ?? 'daily';
		const resolvedUnit: 'weeks' | 'months' | 'years' =
			params.repeatDurationUnit ?? (resolvedRepeatType === 'monthly' ? 'months' : 'weeks');
		const resolvedDuration = params.repeatDuration ?? 1;

		const offEnabled = !!params.offBookingEnabled;
		const offRepeatable = offEnabled && !!params.offBookingRepeatable;
		const offRepeatType: 'daily' | 'weekly' | 'monthly' =
			(params.offBookingRepeatType ?? 'daily');
		const offUnit: 'weeks' | 'months' | 'years' =
			(params.offBookingRepeatDurationUnit ?? (offRepeatType === 'monthly' ? 'months' : 'weeks'));
		const offDuration = params.offBookingRepeatDuration ?? 1;

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
			off_booking_enabled: offEnabled,
			off_booking_repeatable: offRepeatable,
			off_booking_repeat_type: offRepeatType,
			off_booking_repeat_duration: offDuration,
			off_booking_repeat_duration_unit: offUnit,
			off_booking_notes: params.offBookingNotes?.trim() || null,
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
			} else {
				let cursor = new Date(base);
				while (windowEndExclusive && cursor < windowEndExclusive) {
					occurrences.push(new Date(cursor));
					cursor = addMonths(cursor, 1);
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

