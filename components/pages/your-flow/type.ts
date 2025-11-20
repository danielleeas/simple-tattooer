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

export interface BookingDataProps {
    multipleSessionsEnabled: boolean;
    sessionsPerDay: number;
    sessionDuration: number;
    breakTime: number;
    backToBackEnabled: boolean;
    maxBackToBack: number;
    bufferBetweenSessions: number;
}

export interface DrawingDataProps {
    sendDrawingsInAdvance: boolean;
    receiveDrawingTime: number;
    changePolicyTime: number;
    finalAppointmentRemindTime: number;
    autoEmail: boolean;
    autoFillDrawing: boolean;
    maxReschedulesAllowed: number;
    rescheduleBookingDays: number;
}

export const reviewAdvanceTimeChunks = [
    [{ value: '2', label: 'Morning of' }, { value: '4', label: '4 Hours' }],
    [{ value: '8', label: '8 Hours' }, { value: '12', label: '12 Hours' }],
    [{ value: '24', label: '24 Hours' }, { value: '48', label: '48 Hours' }],
    [{ value: '72', label: '3 Days' }, { value: '96', label: '7 Days' }],
]

export const timesChunks = [
    [{ value: '12', label: '12 Hours' }, { value: '24', label: '24 Hours' }],
    [{ value: '48', label: '48 Hours' }, { value: '72', label: '72 Hours' }],
]

export const dayChunks = [
    [{ value: '14', label: '14 Days' }, { value: '30', label: '30 Days' }],
    [{ value: '45', label: '45 Days' }, { value: '60', label: '60 Days' }],
]