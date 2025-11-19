import * as Calendar from 'expo-calendar';

export interface DeviceEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  notes?: string | null;
  calendarId: string;
}

export type MultiDayEventLike = {
  id: string;
  title: string;
  allDay?: boolean;
  startDate: string | Date;
  endDate: string | Date;
  color: string;
  type: 'item' | 'background';
};

export async function ensureCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function hasCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === 'granted';
}

export async function listReadableCalendars() {
  const granted = await ensureCalendarPermissions();
  if (!granted) return [];
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return cals.filter((c: any) => c.source && c.accessLevel !== Calendar.CalendarAccessLevel.NONE);
}

export async function listWritableCalendars() {
  const granted = await ensureCalendarPermissions();
  if (!granted) return [];
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return cals.filter((c: any) => c.allowsModifications === true);
}

export async function listReadableCalendarsSilent() {
  const granted = await hasCalendarPermission();
  if (!granted) return [];
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return cals.filter((c: any) => c.source && c.accessLevel !== Calendar.CalendarAccessLevel.NONE);
}

export async function listWritableCalendarsSilent() {
  const granted = await hasCalendarPermission();
  if (!granted) return [];
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return cals.filter((c: any) => c.allowsModifications === true);
}

export async function getDeviceEventsInRange(
  calendarIds: string[] | undefined,
  start: Date,
  end: Date
): Promise<MultiDayEventLike[]> {
  const granted = await ensureCalendarPermissions();
  if (!granted) return [];

  const calendars = calendarIds && calendarIds.length > 0
    ? calendarIds
    : (await listWritableCalendars()).map((c: any) => c.id);
  if (calendars.length === 0) return [];

  const items = await Calendar.getEventsAsync(calendars, start, end);
  return items.map((ev) => {
    const isAllDay = Boolean(ev.allDay);
    return {
      id: `device:${ev.id}`,
      title: ev.title || 'Untitled',
      allDay: isAllDay,
      startDate: ev.startDate as Date,
      endDate: (ev.endDate as Date) || (ev.startDate as Date),
      color: 'purple',
      type: isAllDay ? 'background' : 'item',
    } as MultiDayEventLike;
  });
}

export async function getDeviceEventsInRangeSilent(
  calendarIds: string[] | undefined,
  start: Date,
  end: Date
): Promise<MultiDayEventLike[]> {
  const granted = await hasCalendarPermission();
  if (!granted) return [];

  const calendars = calendarIds && calendarIds.length > 0
    ? calendarIds
    : (await listWritableCalendarsSilent()).map((c: any) => c.id);
  if (calendars.length === 0) return [];

  const items = await Calendar.getEventsAsync(calendars, start, end);
  return items.map((ev) => {
    const isAllDay = Boolean(ev.allDay);
    return {
      id: `device:${ev.id}`,
      title: ev.title || 'Untitled',
      allDay: isAllDay,
      startDate: ev.startDate as Date,
      endDate: (ev.endDate as Date) || (ev.startDate as Date),
      color: 'purple',
      type: isAllDay ? 'background' : 'item',
    } as MultiDayEventLike;
  });
}

export async function createDeviceEvent(opts: {
  calendarId: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  notes?: string;
}): Promise<string> {
  const granted = await ensureCalendarPermissions();
  if (!granted) throw new Error('Calendar permission not granted');
  const details: Calendar.Event = {
    id: '',
    calendarId: opts.calendarId,
    location: '',
    alarms: [],
    recurrenceRule: null,
    url: '',
    creationDate: undefined,
    lastModifiedDate: undefined,
    endTimeZone: undefined,
    availability: Calendar.Availability.BUSY,
    status: Calendar.EventStatus.CONFIRMED,
    title: opts.title,
    notes: opts.notes ?? '',
    startDate: opts.start,
    endDate: opts.end,
    allDay: Boolean(opts.allDay),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  const id = await Calendar.createEventAsync(opts.calendarId, details);
  return id;
}

export async function updateDeviceEvent(eventId: string, patch: Partial<Calendar.Event>) {
  await Calendar.updateEventAsync(eventId, patch);
}

export async function deleteDeviceEvent(eventId: string) {
  await Calendar.deleteEventAsync(eventId);
}


