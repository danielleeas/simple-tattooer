export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun','Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type CalendarDay = {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
};

export const getViewLabel = (date: Date, mode: 'day' | 'week' | 'month') => {
    const format = (d: Date, opts: Intl.DateTimeFormatOptions) =>
        d.toLocaleDateString(undefined, opts);

    // month
    return format(date, { month: 'short', year: 'numeric' });
};

// Format a Date into an ISO-8601-like string using the local timezone offset,
// e.g. "2025-11-21T00:00:00+02:00".
export const toLocalISOString = (date: Date) => {
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    const tzOffsetMinutes = -date.getTimezoneOffset();
    const sign = tzOffsetMinutes >= 0 ? '+' : '-';
    const tzH = pad(Math.floor(Math.abs(tzOffsetMinutes) / 60));
    const tzM = pad(Math.abs(tzOffsetMinutes) % 60);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${tzH}:${tzM}`;
};

// Convenience: return start-of-day (00:00:00 local) string for a given date.
export const startOfDayLocalISOString = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    return toLocalISOString(d);
};

// Return only the local date part as "YYYY-MM-DD".
export const toLocalDateString = (date: Date) => {
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `${year}-${month}-${day}`;
};