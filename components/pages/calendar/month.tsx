import { useMemo, useState } from "react";
import { Pressable, View, ViewStyle } from "react-native";
import { Text } from "@/components/ui/text";
import { CalendarDay, dayNames, toLocalDateString, getEventColorClass } from "./utils";
import { toYmd, parseYmdFromDb } from "@/lib/utils";
import { type CalendarEvent } from "@/lib/services/calendar-service";
import { router } from "expo-router";

type MonthViewProps = {
    currentDate: Date;
    onDatePress: (dateString: string) => void;
    events: Record<string, CalendarEvent[]>;
};

export const MonthView = ({ currentDate, onDatePress, events }: MonthViewProps) => {
    const [weekRowWidths, setWeekRowWidths] = useState<number[]>([0, 0, 0, 0, 0, 0]);

    const isSameDay = (a: Date, b: Date) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear();

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const handleEventClick = (source: string, source_id: string) => {
        console.log("source", source)
        console.log("source_id", source_id)
        if (source === 'block_time') {
            router.push({
                pathname: '/artist/calendar/event-block-time/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'spot_convention') {
            router.push({
                pathname: '/artist/calendar/spot-convention/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'temp_change') {
            router.push({
                pathname: '/artist/calendar/temp-change/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'book_off') {
            router.push({
                pathname: '/artist/calendar/off-days/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'quick_appointment') {
            router.push({
                pathname: '/artist/calendar/quick-appointment/[id]',
                params: { id: source_id }
            });
        }
        else if (source === 'session') {
            router.push({
                pathname: '/artist/booking/session/detail-session',
                params: { client_id: null, project_id: null, session_id: source_id }
            });
        }
        else if (source === 'mark_unavailable') {
            router.push({
                pathname: '/artist/calendar/unavailable',
                params: { id: source_id }
            });
        }
    }

    const calendarDays: CalendarDay[] = useMemo(() => {
        const today = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstOfMonth = new Date(year, month, 1);
        const startDate = new Date(firstOfMonth);
        startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay()); // start on Sunday

        const days: CalendarDay[] = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const inMonth = date.getMonth() === month;
            days.push({
                date,
                isCurrentMonth: inMonth,
                isToday: isSameDay(date, today),
            });
        }
        return days;
    }, [currentDate]);

    // Build consolidated background spans per week so each multi-day event renders only once per week
    const backgroundSpansByWeek = useMemo(() => {
        type Span = { id: string; source: string; source_id: string; title: string; color: string; startIdx: number; endIdx: number };
        const byWeek: Span[][] = [];
        for (let w = 0; w < 6; w++) {
            const weekDays = calendarDays.slice(w * 7, (w + 1) * 7);
            const dayKeys = weekDays.map(d => toYmd(d.date));
            const merged = new Map<string, Span>();
            for (let di = 0; di < 7; di++) {
                const key = dayKeys[di];
                const bgs = (events[key] || []).filter(ev => ev.type === 'background');
                for (const ev of bgs) {
                    const existing = merged.get(ev.id);
                    if (!existing) {
                        merged.set(ev.id, {
                            id: ev.id,
                            source: ev.source,
                            source_id: ev.source_id,
                            title: ev.title,
                            color: ev.color,
                            startIdx: di,
                            endIdx: di
                        });
                    } else {
                        if (di < existing.startIdx) existing.startIdx = di;
                        if (di > existing.endIdx) existing.endIdx = di;
                    }
                }
            }
            byWeek.push(Array.from(merged.values()));
        }
        return byWeek;
    }, [calendarDays, events]);

    return (
        <View className="flex-1 gap-0">
            <View className="flex-row border border-border-secondary">
                {dayNames.map((name, idx) => (
                    <View
                        key={name}
                        className="flex-1 h-10 justify-center items-center py-2 border-r border-border-secondary"
                        style={idx === 6 ? { borderRightWidth: 0 } : {}}
                    >
                        <Text variant="p" className="text-xs text-text-secondary uppercase" style={{ letterSpacing: 1.5 }}>
                            {name}
                        </Text>
                    </View>
                ))}
            </View>

            <View className="flex-1">
                {Array.from({ length: 6 }, (_, weekIndex) => (
                    <View
                        key={weekIndex}
                        className="flex-row flex-1 border-border-secondary relative"
                        style={{ borderLeftWidth: 1 }}
                        onLayout={(e) => {
                            const w = e.nativeEvent.layout.width;
                            setWeekRowWidths(prev => {
                                if (prev[weekIndex] === w) return prev;
                                const next = [...prev];
                                next[weekIndex] = w;
                                return next;
                            });
                        }}
                    >
                        {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                            const showToday = day.isToday;
                            const bubbleClasses = showToday ? "border border-primary" : "";

                            return (
                                <View
                                    key={`${weekIndex}-${dayIndex}`}
                                    className="flex-1 items-center pt-4 justify-start border-border-secondary border-r border-b relative"
                                >

                                    <View className={`rounded-full relative items-center justify-center ${bubbleClasses}`} style={{ width: 24, height: 24 }}>
                                        <Text
                                            className={`text-xs ${showToday ? 'text-primary' : 'text-foreground'}`}
                                            style={!day.isCurrentMonth ? { opacity: 0.5 } : {}}
                                        >
                                            {day.date.getDate()}
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={() => onDatePress(toLocalDateString(day.date))}
                                        className="absolute top-0 left-0 right-0 bottom-0 w-full items-center justify-center py-2" />

                                    {/* Background per-day shading removed in favor of a single week-level span */}

                                    {/* Single-day timed items (show a few pills) */}
                                    <View className="w-full px-1 mt-1 gap-1">
                                        {(() => {
                                            const dStart = startOfDay(day.date);
                                            const dEnd = endOfDay(day.date);
                                            const key = toYmd(day.date);
                                            const singles = (events[key] || []).filter(e => {
                                                if (e.type !== 'item' || e.allday) return false;
                                                const evStart = parseYmdFromDb(e.start_date);
                                                return evStart >= dStart && evStart <= dEnd;
                                            });
                                            const visibleSingles = singles.slice(0, 2);
                                            const hasMoreSingles = singles.length > 2;
                                            return (
                                                <>
                                                    {visibleSingles.map((e, i) => (
                                                        <Pressable key={`sd-${weekIndex}-${dayIndex}-${i}`} onPress={() => handleEventClick(e.source, e.source_id)} className={`w-full h-4 rounded px-1 justify-center ${getEventColorClass(e.color)}`}>
                                                            <Text className="text-[9px] text-foreground" numberOfLines={1}>{e.title}</Text>
                                                        </Pressable>
                                                    ))}
                                                    {hasMoreSingles && (
                                                        <View className="w-full h-4 rounded px-1 justify-center border border-border-secondary">
                                                            <Text className="text-[9px] text-text-secondary" numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5}>+{singles.length - 2} more</Text>
                                                        </View>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </View>
                                </View>
                            );
                        })}

                        {/* Week-level background bars (one per multi-day event in this week) */}
                        {(() => {
                            const spans = backgroundSpansByWeek[weekIndex] || [];
                            const rowWidth = weekRowWidths[weekIndex] || 0;
                            const cellWidth = rowWidth > 0 ? (rowWidth / 7) : 0;
                            if (rowWidth <= 0 || spans.length === 0) return null;
                            return (
                                <View style={{ position: 'absolute', top: 1, left: 0, right: 0, height: 16 }}>
                                    {spans.map((span, i) => {
                                        const left = span.startIdx * cellWidth;
                                        const width = (span.endIdx - span.startIdx + 1) * cellWidth;
                                        return (
                                            <Pressable
                                                key={`wk-bg-${weekIndex}-${span.id}-${i}`}
                                                onPress={() => handleEventClick(span.source, span.source_id)}
                                                className={`absolute ${getEventColorClass(span.color)}`}
                                                style={{
                                                    left,
                                                    width,
                                                    height: 16,
                                                    opacity: 0.7,
                                                    justifyContent: 'center',
                                                    paddingHorizontal: 4,
                                                } as ViewStyle}
                                            >
                                                <Text className="text-[9px] text-foreground" numberOfLines={1}>{span.title}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            );
                        })()}
                    </View>
                ))}
            </View>
        </View>
    );
};