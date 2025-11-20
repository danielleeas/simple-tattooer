export interface WorkDayDataProps {
    workDays: string[];
    diffTimeEnabled: boolean;
    startTimes: Record<string, string>;
    endTimes: Record<string, string>;
    consultEnabled: boolean;
    consultInPerson: boolean;
    consultOnline: boolean;
    consultDuration: number;
    consultWorkDays: string[];
    diffConsultTimeEnabled: boolean;
    consultStartTimes: Record<string, string[]>;
    consultMeetingLink: string;
}