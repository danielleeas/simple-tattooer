import { Artist, Locations as ArtistLocation } from "../redux/types";
import { supabase } from "../supabase";
import { parseYmdFromDb } from "../utils";
import { getEventsInRange } from "./calendar-service";
import { defaultTemplateData } from "@/components/pages/your-rule/type";

type WeekdayCode = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

type TimeInterval = { startM: number; endM: number }; // [startM, endM)

function toYmd(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseYmd(ymd: string): Date {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function parseHhMmToMinutes(hhmm: string | undefined): number | null {
    if (!hhmm) return null;
    const [hStr, mStr] = hhmm.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
}

function minutesToHhMm(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutesToDisplay(totalMinutes: number): string {
    const h24 = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h24 < 12 ? 'AM' : 'PM';
    const h12 = ((h24 + 11) % 12) + 1;
    return `${String(h12)}:${String(m).padStart(2, '0')} ${period}`;
}

export const getMonthRange = (year: number, monthZeroBased: number) => {
    const start = new Date(year, monthZeroBased, 1);
    const end = new Date(year, monthZeroBased + 1, 0);
    const toYmd = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
    };
    return { start: toYmd(start), end: toYmd(end) };
};

function clampRange(startYmd?: string, endYmd?: string): { start: string; end: string } {
    const today = new Date();
    const start = startYmd ? toYmd(parseYmd(startYmd)) : toYmd(today);
    const end = endYmd
        ? toYmd(parseYmd(endYmd))
        : toYmd(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 90));
    return { start, end };
}

function eachDateInclusive(startYmd: string, endYmd: string): string[] {
    const start = parseYmd(startYmd);
    const end = parseYmd(endYmd);
    const cursor = new Date(start.getTime());
    const out: string[] = [];
    while (cursor <= end) {
        out.push(toYmd(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return out;
}

function weekdayCodeOf(ymd: string): WeekdayCode {
    const d = parseYmd(ymd);
    const idx = d.getDay(); // 0..6 (Sun..Sat)
    return (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][idx] as WeekdayCode);
}

export const getAvailableDates = async (
    artist: Artist,
    clientId: string | undefined,
    startDate: string,
    endDate: string
): Promise<string[]> => {
    if (!artist?.id) throw new Error('artist is required');

    const { start, end } = clampRange(startDate, endDate);
    const todayYmd = toYmd(new Date());

    const start_date_Ymd = parseYmdFromDb(start);
    const end_date_Ymd = parseYmdFromDb(end);
    const start_date = new Date(start_date_Ymd.getFullYear(), start_date_Ymd.getMonth(), start_date_Ymd.getDate(), 0, 0, 0, 0);
    const end_date = new Date(end_date_Ymd.getFullYear(), end_date_Ymd.getMonth(), end_date_Ymd.getDate(), 23, 59, 59, 999);

    const flows = (artist.flow || {}) as {
        work_days?: string[];
        different_time_enabled: boolean;
        start_times: Record<string, string>;
        end_times: Record<string, string>;
    };

    const eventsRes = await getEventsInRange({ artistId: artist.id, start: start_date, end: end_date })
    const events = eventsRes.success ? eventsRes.events || [] : [];

    let candidateDates: string[];

    const flowWorkDays = new Set<WeekdayCode>((flows.work_days || []) as WeekdayCode[]);
    const flowCandidates: string[] = [];
    if (flowWorkDays.size > 0) {
        for (const d of eachDateInclusive(start, end)) {
            if (d < todayYmd) continue;
            const w = weekdayCodeOf(d);
            if (flowWorkDays.has(w)) flowCandidates.push(d);
        }
    }
    candidateDates = flowCandidates;

    const result = Array.from(candidateDates);
    result.sort();
    // const filtered = candidateDates.filter((d) => !offDaySet.has(d));

    return result;
};

export interface StartTimeOption {
    value: string; // 'HH:mm'
    label: string; // 'h:mm AM/PM'
}

export const getAvailableTimes = async (
    artist: Artist,
    dateYmd: string,
    duration: number,
    interval: number
): Promise<StartTimeOption[]> => {
    if (!artist.id) throw new Error('artist is required');
    const dayYmd = toYmd(parseYmd(dateYmd));
    const todayYmd = toYmd(new Date());
    if (dayYmd < todayYmd) return [];
    const weekday = weekdayCodeOf(dayYmd);

    const flows = (artist.flow || {}) as {
        work_days?: string[];
        different_time_enabled: boolean;
        start_times: Record<string, string>;
        end_times: Record<string, string>;
    };
    const flowWork = new Set<string>(flows.work_days || []);
    let dayStartStr: string | undefined;
    let dayEndStr: string | undefined;

    if (!flowWork.has(weekday)) return [];
    dayStartStr = flows.start_times?.[weekday];
    dayEndStr = flows.end_times?.[weekday];

    const dayStartM = parseHhMmToMinutes(dayStartStr);
    const dayEndM = parseHhMmToMinutes(dayEndStr);
    if (dayStartM == null || dayEndM == null || dayEndM <= dayStartM) return [];

    let available: TimeInterval[] = [{ startM: dayStartM, endM: dayEndM }];

    if (dayYmd === todayYmd) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        available = available
            .map((iv) => ({
                startM: Math.max(iv.startM, nowMinutes),
                endM: iv.endM,
            }))
            .filter((iv) => iv.endM > iv.startM);
    }

    if (available.length === 0) return [];

    const out: StartTimeOption[] = [];
    for (const iv of available) {
        // Align the start to the nearest minute interval
        let cursor = iv.startM;
        if (cursor % interval !== 0) {
            cursor = cursor + (interval - (cursor % interval));
        }
        while (cursor + duration <= iv.endM) {
            const value = minutesToHhMm(cursor);
            out.push({ value, label: minutesToDisplay(cursor) });
            cursor += interval;
        }
    }

    return out;
}

function parseDisplayTimeToHhMm(display: string): string {
    // Expected formats like "1:30 PM" or "10:00 AM"
    const match = display.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return display; // fallback, store as-is
    let hours = Number(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === 'AM') {
        if (hours === 12) hours = 0;
    } else {
        if (hours !== 12) hours += 12;
    }
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${minutes}`;
}

export interface CreateManualBookingInput {
    artistId: string;
    clientId: string;
    title: string;
    sessionLengthMinutes: number;
    locationId: string;
    date: Date;
    startTimeDisplay: string; // e.g. "1:30 PM"
    depositAmount: number;
    sessionRate: number;
    notes?: string;
    waiverSigned?: boolean;
    source?: string;
    sourceId?: string;
}

export interface CreateManualBookingResult {
    success: boolean;
    projectId?: string;
    sessionId?: string;
    error?: string;
}

export async function createManualBooking(input: CreateManualBookingInput): Promise<CreateManualBookingResult> {
    try {
        if (!input.artistId) return { success: false, error: 'Missing artist' };
        if (!input.clientId) return { success: false, error: 'Missing client' };
        if (!input.title?.trim()) return { success: false, error: 'Missing project title' };
        if (!input.sessionLengthMinutes || input.sessionLengthMinutes <= 0) return { success: false, error: 'Invalid session length' };
        if (!input.locationId) return { success: false, error: 'Missing location' };
        if (!input.date) return { success: false, error: 'Missing date' };
        if (!input.startTimeDisplay?.trim()) return { success: false, error: 'Missing start time' };
        if (Number.isNaN(input.depositAmount)) return { success: false, error: 'Invalid deposit amount' };
        if (Number.isNaN(input.sessionRate)) return { success: false, error: 'Invalid session rate' };

        const dateYmd = toYmd(input.date); // YYYY-MM-DD
        const startTimeHhMm = parseDisplayTimeToHhMm(input.startTimeDisplay); // HH:mm

        // 1) Create project
        const { data: projectRows, error: projectError } = await supabase
            .from('projects')
            .insert([{
                artist_id: input.artistId,
                client_id: input.clientId,
                title: input.title.trim(),
                deposit_amount: input.depositAmount,
                waiver_signed: input.waiverSigned || false,
                notes: input.notes ?? null,
            }])
            .select('id')
            .single();

        if (projectError || !projectRows?.id) {
            return { success: false, error: projectError?.message || 'Failed to create project' };
        }

        const projectId = projectRows.id as string;

        // 2) Create session
        const { data: sessionRows, error: sessionError } = await supabase
            .from('sessions')
            .insert([{
                project_id: projectId,
                date: dateYmd,
                start_time: startTimeHhMm,
                duration: input.sessionLengthMinutes,
                location_id: input.locationId,
                session_rate: input.sessionRate,
                notes: input.notes ?? null,
                source: input.source || 'manual',
                source_id: input.sourceId || null,
            }])
            .select('id')
            .single();

        if (sessionError || !sessionRows?.id) {
            // Rollback: delete created project to avoid orphaned rows
            await supabase.from('projects').delete().eq('id', projectId);
            return { success: false, error: sessionError?.message || 'Failed to create session' };
        }

        // 3) Update link status to "need_deposit"
        const { error: linkError } = await supabase
            .from('links')
            .update({ status: 'need_deposit', updated_at: new Date().toISOString() })
            .eq('artist_id', input.artistId)
            .eq('client_id', input.clientId);
        if (linkError) {
            console.warn('Failed to update link status to need_deposit', linkError);
        }

        return { success: true, projectId, sessionId: sessionRows.id as string };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error creating booking' };
    }
}

export interface CreateProjectSessionInput {
    projectId: string;
    date: Date;
    startTimeDisplay: string; // e.g. "1:30 PM"
    sessionLengthMinutes: number;
    locationId: string;
    sessionRate?: number; // optional; fallback to last session's rate or 0
    notes?: string;
}

export interface CreateProjectSessionResult {
    success: boolean;
    sessionId?: string;
    error?: string;
}

export async function createProjectSession(input: CreateProjectSessionInput): Promise<CreateProjectSessionResult> {
    try {
        if (!input.projectId) return { success: false, error: 'Missing project' };
        if (!input.date) return { success: false, error: 'Missing date' };
        if (!input.startTimeDisplay?.trim()) return { success: false, error: 'Missing start time' };
        if (!input.sessionLengthMinutes || input.sessionLengthMinutes <= 0) return { success: false, error: 'Invalid session length' };
        if (!input.locationId) return { success: false, error: 'Missing location' };

        const dateYmd = toYmd(input.date); // YYYY-MM-DD
        const startTimeHhMm = parseDisplayTimeToHhMm(input.startTimeDisplay); // HH:mm

        // Determine session rate: prefer provided; otherwise fallback to last session's rate or 0
        let sessionRate = Number(input.sessionRate ?? NaN);
        if (!Number.isFinite(sessionRate)) {
            const { data: lastSession, error: lastErr } = await supabase
                .from('sessions')
                .select('session_rate')
                .eq('project_id', input.projectId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (lastErr) {
                console.warn('Failed to fetch last session for rate fallback:', lastErr);
            }
            sessionRate = Number(lastSession?.session_rate ?? 0);
            if (!Number.isFinite(sessionRate)) sessionRate = 0;
        }

        const { data: sessionRow, error: sessionErr } = await supabase
            .from('sessions')
            .insert([{
                project_id: input.projectId,
                date: dateYmd,
                start_time: startTimeHhMm,
                duration: input.sessionLengthMinutes,
                location_id: input.locationId,
                session_rate: sessionRate,
                notes: input.notes ?? null,
            }])
            .select('id')
            .single();

        if (sessionErr || !sessionRow?.id) {
            return { success: false, error: sessionErr?.message || 'Failed to create session' };
        }

        // Create corresponding calendar event for this session
        // 1) Fetch project to decide whether to create an event (requires deposit_paid) and get artist_id/title
        const { data: project, error: projectErr } = await supabase
            .from('projects')
            .select('artist_id,title,deposit_paid')
            .eq('id', input.projectId)
            .single();
        if (projectErr) {
            console.warn('Failed to fetch project for event creation, skipping event:', projectErr);
            return { success: true, sessionId: sessionRow.id as string };
        }
        // Only create event when deposit has been paid
        if (!project?.deposit_paid) {
            return { success: true, sessionId: sessionRow.id as string };
        }
        if (!project?.artist_id) {
            console.warn('Project missing artist_id, skipping event creation for session:', input.projectId);
            return { success: true, sessionId: sessionRow.id as string };
        }

        // 2) Build start/end ISO datetimes from date + start_time + duration
        const hhmm = (startTimeHhMm || '00:00').padStart(5, '0');
        // Build fixed timestamp strings without timezone (follow calendar-service style)
        const toFixedDateTime = (d: string, t: string) => `${d}T${t.padStart(5, '0')}:00.000`;
        const addDaysToYmd = (ymd: string, days: number) => {
            if (!days) return ymd;
            const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
            if (!m) return ymd;
            const y = parseInt(m[1], 10);
            const mo = parseInt(m[2], 10) - 1;
            const da = parseInt(m[3], 10);
            const d0 = new Date(y, mo, da);
            d0.setDate(d0.getDate() + days);
            const yy = d0.getFullYear();
            const mm = String(d0.getMonth() + 1).padStart(2, '0');
            const dd = String(d0.getDate()).padStart(2, '0');
            return `${yy}-${mm}-${dd}`;
        };
        const addMinutesToTime = (t: string, minutesToAdd: number): { ymdOffset: number; hhmm: string } => {
            const parts = t.split(':');
            const h = parseInt(parts[0] || '0', 10);
            const m = parseInt(parts[1] || '0', 10);
            const total = h * 60 + m + Number(minutesToAdd || 0);
            const ymdOffset = Math.floor(total / 1440);
            const inDay = ((total % 1440) + 1440) % 1440;
            const eh = Math.floor(inDay / 60);
            const em = inDay % 60;
            return { ymdOffset, hhmm: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}` };
        };
        const startIso = toFixedDateTime(dateYmd, hhmm);
        const endCalc = addMinutesToTime(hhmm, Number(input.sessionLengthMinutes || 0));
        const endDateYmd = addDaysToYmd(dateYmd, endCalc.ymdOffset);
        const endIso = toFixedDateTime(endDateYmd, endCalc.hhmm);

        // 3) Insert event row
        const { error: eventErr } = await supabase
            .from('events')
            .insert([{
                artist_id: project.artist_id,
                title: (project.title || 'Session') as string,
                start_date: startIso,
                end_date: endIso,
                color: 'purple',
                type: 'item',
                source: 'session',
                source_id: sessionRow.id as string,
                updated_at: new Date().toISOString(),
            }]);

        if (eventErr) {
            console.error('Failed to create calendar event for session, session kept:', eventErr);
            // Do not rollback session; events for sessions can be created later if needed
        }

        return { success: true, sessionId: sessionRow.id as string };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error creating session' };
    }
}

export async function deleteSessionById(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!sessionId) return { success: false, error: 'Missing session id' };

        // Best-effort: remove any calendar events created for this session
        await supabase
            .from('events')
            .delete()
            .eq('source', 'session')
            .eq('source_id', sessionId);

        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            return { success: false, error: error.message || 'Failed to delete session' };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error deleting session' };
    }
}

export interface SessionRecordMinimal {
    id: string;
    project_id: string;
    date: string;          // YYYY-MM-DD
    start_time: string;    // HH:mm
    duration: number;
    location_id: string;
    session_rate?: number | null;
    notes?: string | null;
}

export async function getSessionById(sessionId: string): Promise<{ success: boolean; data?: SessionRecordMinimal; error?: string }> {
    try {
        if (!sessionId) return { success: false, error: 'Missing session id' };
        const { data, error } = await supabase
            .from('sessions')
            .select('id,project_id,date,start_time,duration,location_id,session_rate,notes')
            .eq('id', sessionId)
            .maybeSingle();
        if (error) {
            return { success: false, error: error.message };
        }
        if (!data) {
            return { success: false, error: 'Session not found' };
        }
        return { success: true, data: data as SessionRecordMinimal };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error fetching session' };
    }
}

export interface UpdateProjectSessionInput {
    sessionId: string;
    date: Date;
    startTimeDisplay: string; // e.g. "1:30 PM"
    sessionLengthMinutes: number;
    locationId: string;
    sessionRate?: number;
    notes?: string;
}

export interface UpdateProjectSessionResult {
    success: boolean;
    error?: string;
}

export async function updateProjectSession(input: UpdateProjectSessionInput): Promise<UpdateProjectSessionResult> {
    try {
        if (!input.sessionId) return { success: false, error: 'Missing session id' };
        if (!input.date) return { success: false, error: 'Missing date' };
        if (!input.startTimeDisplay?.trim()) return { success: false, error: 'Missing start time' };
        if (!input.sessionLengthMinutes || input.sessionLengthMinutes <= 0) return { success: false, error: 'Invalid session length' };
        if (!input.locationId) return { success: false, error: 'Missing location' };

        const dateYmd = toYmd(input.date);
        const startTimeHhMm = parseDisplayTimeToHhMm(input.startTimeDisplay);

        const payload: Record<string, any> = {
            date: dateYmd,
            start_time: startTimeHhMm,
            duration: input.sessionLengthMinutes,
            location_id: input.locationId,
            updated_at: new Date().toISOString(),
        };
        if (typeof input.sessionRate === 'number') {
            payload.session_rate = input.sessionRate;
        }
        if (typeof input.notes === 'string') {
            payload.notes = input.notes;
        }

        const { error } = await supabase
            .from('sessions')
            .update(payload)
            .eq('id', input.sessionId);

        if (error) {
            return { success: false, error: error.message || 'Failed to update session' };
        }

        // If project deposit is paid, update or create corresponding calendar event
        try {
            // Fetch project id from session and then project details
            const { data: sessionProject, error: sessionProjectErr } = await supabase
                .from('sessions')
                .select('project_id')
                .eq('id', input.sessionId)
                .single();
            if (sessionProjectErr || !sessionProject?.project_id) {
                console.warn('Unable to resolve project for session when updating event, skipping:', sessionProjectErr);
                return { success: true };
            }
            const projectId = sessionProject.project_id as string;

            const { data: project, error: projectErr } = await supabase
                .from('projects')
                .select('artist_id,title,deposit_paid')
                .eq('id', projectId)
                .single();
            if (projectErr) {
                console.warn('Failed to fetch project for session event update, skipping:', projectErr);
                return { success: true };
            }
            if (!project?.deposit_paid) {
                // Deposit not paid; do not create/update calendar event
                return { success: true };
            }
            if (!project?.artist_id) {
                console.warn('Project missing artist_id; skipping session event update.');
                return { success: true };
            }

            // Build fixed timestamp strings without timezone (follow calendar-service style)
            const hhmm = (startTimeHhMm || '00:00').padStart(5, '0');
            const toFixedDateTime = (d: string, t: string) => `${d}T${t.padStart(5, '0')}:00.000`;
            const addDaysToYmd = (ymd: string, days: number) => {
                if (!days) return ymd;
                const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
                if (!m) return ymd;
                const y = parseInt(m[1], 10);
                const mo = parseInt(m[2], 10) - 1;
                const da = parseInt(m[3], 10);
                const d0 = new Date(y, mo, da);
                d0.setDate(d0.getDate() + days);
                const yy = d0.getFullYear();
                const mm = String(d0.getMonth() + 1).padStart(2, '0');
                const dd = String(d0.getDate()).padStart(2, '0');
                return `${yy}-${mm}-${dd}`;
            };
            const addMinutesToTime = (t: string, minutesToAdd: number): { ymdOffset: number; hhmm: string } => {
                const parts = t.split(':');
                const h = parseInt(parts[0] || '0', 10);
                const m = parseInt(parts[1] || '0', 10);
                const total = h * 60 + m + Number(minutesToAdd || 0);
                const ymdOffset = Math.floor(total / 1440);
                const inDay = ((total % 1440) + 1440) % 1440;
                const eh = Math.floor(inDay / 60);
                const em = inDay % 60;
                return { ymdOffset, hhmm: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}` };
            };
            const startIso = toFixedDateTime(dateYmd, hhmm);
            const endCalc = addMinutesToTime(hhmm, Number(input.sessionLengthMinutes || 0));
            const endDateYmd = addDaysToYmd(dateYmd, endCalc.ymdOffset);
            const endIso = toFixedDateTime(endDateYmd, endCalc.hhmm);

            // Try update existing event for this session; if none, insert
            const { data: existingEvent, error: existingErr } = await supabase
                .from('events')
                .select('id')
                .eq('source', 'session')
                .eq('source_id', input.sessionId)
                .maybeSingle();
            if (existingErr) {
                console.warn('Failed checking existing event for session, will attempt insert:', existingErr);
            }

            const nowIso = new Date().toISOString();
            if (existingEvent?.id) {
                const { error: updateEventErr } = await supabase
                    .from('events')
                    .update({
                        artist_id: project.artist_id,
                        title: (project.title || 'Session') as string,
                        start_date: startIso,
                        end_date: endIso,
                        updated_at: nowIso,
                    })
                    .eq('id', existingEvent.id);
                if (updateEventErr) {
                    console.error('Error updating session calendar event:', updateEventErr);
                }
            } else {
                const { error: insertEventErr } = await supabase
                    .from('events')
                    .insert([{
                        artist_id: project.artist_id,
                        title: (project.title || 'Session') as string,
                        start_date: startIso,
                        end_date: endIso,
                        color: 'purple',
                        type: 'item',
                        source: 'session',
                        source_id: input.sessionId,
                        updated_at: nowIso,
                    }]);
                if (insertEventErr) {
                    console.error('Error inserting session calendar event:', insertEventErr);
                }
            }
        } catch (eventErr: any) {
            console.error('Unexpected error handling session event update:', eventErr);
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error updating session' };
    }
}

export interface ManualBookingEmailInput {
    artist: Artist;
    clientId: string;
    form: {
        title: string;
        date: Date;
        startTime: string;
        sessionLength: number;
        notes?: string;
        locationId: string;
        depositAmount: number;
        sessionRate: number;
    };
}

export async function sendManualBookingRequestEmail(input: ManualBookingEmailInput): Promise<void> {
    try {
        const { artist, clientId, form } = input;

        // Fetch client to get real email and name
        const { data: clientRow, error: clientErr } = await supabase
            .from('clients')
            .select('full_name,email')
            .eq('id', clientId)
            .maybeSingle();

        if (clientErr) {
            console.warn('Failed to fetch client for email:', clientErr);
            return;
        }
        if (!clientRow?.email) {
            console.warn('No client email found, skipping manual booking email.');
            return;
        }

        const to = String(clientRow.email);
        const firstName = (clientRow.full_name || '').trim().split(' ')[0] || '';

        // Resolve selected location address from artist.locations
        const selectedLocation = (artist?.locations || []).find(
            (loc: ArtistLocation) => String(loc.id) === String(form.locationId)
        );
        const locationAddress = selectedLocation?.address || '';

        // Formatters
        const formatCurrency = (n: number) => {
            const v = Number(n || 0);
            return isNaN(v) ? '' : `$${v.toLocaleString('en-US')}`;
        };
        const formatDateLong = (d?: Date) => {
            if (!d) return '';
            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        };
        const formatDuration = (minutes?: number) => {
            if (!minutes || minutes <= 0) return '';
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            if (h && m) return `${h} hour${h > 1 ? 's' : ''} ${m} minute${m > 1 ? 's' : ''}`;
            if (h) return `${h} hour${h > 1 ? 's' : ''}`;
            return `${m} minute${m > 1 ? 's' : ''}`;
        };

        // Email template from artist rules with fallback to defaults
        const templateSubject =
            (artist?.rule as any)?.booking_request_approved_manual_subject ||
            defaultTemplateData.bookingRequestApprovedManualSubject;
        const templateBody =
            (artist?.rule as any)?.booking_request_approved_manual_body ||
            defaultTemplateData.bookingRequestApprovedManualBody;

        // Artist avatar/photo
        const avatar_url = (artist as any)?.avatar || (artist as any)?.photo || '';

        // Payment links from artist rules
        const rules = (artist as any)?.rule || {};
        const payment_links: Record<string, string> = {};
        if (rules.creditcard_enabled && rules.creditcard_method) {
            payment_links['Credit Card'] = String(rules.creditcard_method);
        }
        if (rules.paypal_enabled && rules.paypal_method) {
            payment_links['Paypal'] = String(rules.paypal_method);
        }
        if (rules.etransfer_enabled && rules.etransfer_method) {
            payment_links['E-Transfer (Canada Only)'] = String(rules.etransfer_method);
        }
        if (rules.venmo_enabled && rules.venmo_method) {
            payment_links['Venmo'] = String(rules.venmo_method);
        }

        const variables: Record<string, string> = {
            'Client First Name': firstName,
            'auto-fill-title': form.title || '',
            'auto-fill-location': locationAddress,
            'auto-fill-date': formatDateLong(form.date),
            'auto-fill-session-rate': formatCurrency(form.sessionRate),
            'auto-fill-start-time': form.startTime || '',
            'auto-fill-session-length': formatDuration(form.sessionLength),
            'auto-fill-notes': form.notes || '',
            'auto-fill-deposit-required': formatCurrency(form.depositAmount),
            'auto-fill-deposit-policy': rules.deposit_policy || '',
            'auto-fill-cancellation-policy': rules.cancellation_policy || '',
            'Your Name': (artist as any)?.full_name || '',
            'Studio Name': (artist as any)?.studio_name || '',
        };

        await supabase.functions
            .invoke('manual-booking-request-email', {
                body: {
                    to,
                    email_templates: {
                        subject: templateSubject,
                        body: templateBody,
                    },
                    avatar_url,
                    variables,
                    payment_links,
                },
            })
            .catch((err) => console.warn('Failed to send manual booking email:', err));
    } catch (err) {
        console.warn('Manual booking email trigger error:', err);
    }
}

export interface ClientPortalEmailInput {
    artist: Artist;
    clientId: string;
    projectId: string;
}

export async function sendClientPortalEmail(input: ClientPortalEmailInput): Promise<void> {
    try {
        const { artist, clientId, projectId } = input;

        // Fetch client to get real email and name
        const { data: clientRow, error: clientErr } = await supabase
            .from('clients')
            .select('full_name,email')
            .eq('id', clientId)
            .maybeSingle();

        if (clientErr) {
            console.warn('Failed to fetch client for email:', clientErr);
            return;
        }
        if (!clientRow?.email) {
            console.warn('No client email found, skipping client portal email.');
            return;
        }

        const to = String(clientRow.email);
        const firstName = (clientRow.full_name || '').trim().split(' ')[0] || '';

        // Artist avatar/photo and rules
        const avatar_url = (artist as any)?.avatar || (artist as any)?.photo || '';
        const rules = (artist as any)?.rules || {};

        // Prefer artist rule templates; fallback to defaults
        const templateSubject =
            (rules as any)?.appointment_confirmation_no_profile_subject ||
            defaultTemplateData.appointmentConfirmationNoProfileSubject;
        const templateBody =
            (rules as any)?.appointment_confirmation_no_profile_body ||
            defaultTemplateData.appointmentConfirmationNoProfileBody;

        // Sessions for date/time/location lines
        const { data: sessions, error: sessionsErr } = await supabase
            .from('sessions')
            .select('date,start_time,location:artist_locations(address)')
            .eq('project_id', projectId)
            .order('date', { ascending: true });

        if (sessionsErr) {
            console.warn('Failed to fetch sessions for portal email:', sessionsErr);
        }

        const to12h = (hhmm?: string): string => {
            if (!hhmm) return '';
            const [hStr, mStr] = hhmm.split(':');
            let h = Number(hStr);
            const m = Number(mStr);
            if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
            const period = h < 12 ? 'AM' : 'PM';
            const h12 = ((h + 11) % 12) + 1;
            return `${h12}:${String(m).padStart(2, '0')} ${period}`;
        };
        const formatDate = (ymd?: string): string => {
            if (!ymd) return '';
            const d = new Date(`${ymd}T00:00:00`);
            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        };

        const dateTimeLocation: string[] = (Array.isArray(sessions) ? sessions : [])
            .map((s: any) => {
                const dateStr = formatDate(s?.date);
                const timeStr = to12h(s?.start_time);
                const address = s?.location?.address || '';
                if (!dateStr && !timeStr && !address) return null;
                return `${dateStr} — ${timeStr}${address ? `, ${address}` : ''}`.trim();
            })
            .filter(Boolean) as string[];

        const startHere = `https://simpletattooer.com/client-portal?id=${clientId}`;

        // Compose variables
        const variables: Record<string, any> = {
            'Client First Name': firstName,
            'Date, Time, location': dateTimeLocation,
            'Your Name': (artist as any)?.full_name || '',
            'Studio Name': (artist as any)?.studio_name || '',
            'Start Here': startHere,
        };

        // Invoke Edge Function
        await supabase.functions
            .invoke('client-new-email', {
                body: {
                    to,
                    email_templates: {
                        subject: templateSubject,
                        body: templateBody,
                    },
                    avatar_url,
                    variables,
                    action_links: {
                        'Start Here': startHere,
                    },
                },
            })
            .catch((err) => console.warn('Failed to send client portal email:', err));
    } catch (err) {
        console.warn('Client portal email trigger error:', err);
    }
}