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