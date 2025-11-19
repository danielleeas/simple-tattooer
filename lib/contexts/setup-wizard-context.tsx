import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './auth-context';
import { LocationData } from '@/components/lib/location-modal';

interface SetupWizardContextType {
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  stepNumber: number;
  details: SetupWizardDetails;
  branding: SetupWizardBranding;
  calendar: SetupWizardCalendar;
  deposit: SetupWizardDeposit;
  bookingRules: SetupWizardBookingRules;
  drawingRules: SetupWizardDrawingRules;
  cancellationList: SetupWizardCancellationList;
  paymentMethod: SetupWizardPaymentMethod;
  waiverUpload: SetupWizardWaiverUpload;
  bookingLinkError: string;
  setBookingLinkError: (error: string) => void;
  incrementStepNumber: () => void;
  decrementStepNumber: () => void;
  updateDetails: (updates: Partial<SetupWizardDetails>) => void;
  updateBranding: (updates: Partial<SetupWizardBranding>) => void;
  updateCalendar: (updates: Partial<SetupWizardCalendar>) => void;
  updateDailyStartTime: (day: string, time: Date) => void;
  updateDailyEndTime: (day: string, time: Date) => void;
  updateConsultationDailyStartTimes: (day: string, startTimes: Date[]) => void;
  updateDeposit: (updates: Partial<SetupWizardDeposit>) => void;
  updateBookingRules: (updates: Partial<SetupWizardBookingRules>) => void;
  updateDrawingRules: (updates: Partial<SetupWizardDrawingRules>) => void;
  updateCancellationList: (updates: Partial<SetupWizardCancellationList>) => void;
  updatePaymentMethod: (updates: Partial<SetupWizardPaymentMethod>) => void;
  updateWaiverUpload: (updates: Partial<SetupWizardWaiverUpload>) => void;
}


interface Consultation {
  isOffer: boolean;
  isInPerson: boolean;
  isOnline: boolean;
  duration: number;
  workDays: string[];
  startTimes: Date[];
  isDifferentStartTimes: boolean;
  dailyStartTimes: Record<string, Date[]>;
  meetingLink: string;
}

interface FileProps {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface SetupWizardDetails {
  name: string;
  studioName: string;
  bookingLinkSuffix: string;
  locations: LocationData[];
  socialHandler: string;
}

interface SetupWizardBranding {
  photo: string;
  welcomeScreen: boolean;
}

interface SetupWizardCalendar {
  workDays: string[];
  isDifferentHours: boolean;
  startTime: Date;
  endTime: Date;
  // Per-day start and end times when different hours are enabled
  dailyStartTimes: Record<string, Date>;
  dailyEndTimes: Record<string, Date>;
  consultation: Consultation;
}

interface SetupWizardDeposit {
  amount: number;
  holdTime: string;
  remindTime: string;
  policy: string;
  cancellationPolicy: string;
}

interface MoreThanOne {
  isMoreOne: boolean;
  sessionStartTime: Date;
  sessionCount: number;
  sessionDuration: number;
  breakTime: number;
}

interface BackToBack {
  isBackToBack: boolean;
  maxSessions: number;
}

interface SetupWizardBookingRules {
  moreThanOne: MoreThanOne;
  backToBack: BackToBack;
  bufferSession: number;
}

interface SetupWizardDrawingRules {
  isDrawingAdvance: boolean;
  reviewAdvanceTime: string;
  changePolicyTime: string;
  finalAppointmentRemindTime: string;
}

interface SetupWizardCancellationList {
  isAutoEmail: boolean;
  isAutoFillDrawing: boolean;
  rescheduleTime: string;
  maxReschedulesAllowed: string;
}

interface SetupWizardPaymentMethod {
  paypal: {isPayPal: boolean; email: string;};
  eTransfer: {isETransfer: boolean; emailOrPhone: string;};
  creditCard: {isCreditCard: boolean; cardLink: string;};
  venmo: {isVenmo: boolean; emailOrPhone: string;};
}

interface SetupWizardWaiverUpload {
  waiverDocument: FileProps | null;
}

const defaultDetails: SetupWizardDetails = {
  name: '',
  studioName: '',
  bookingLinkSuffix: '',
  locations: [],
  socialHandler: '',
};

const defaultBranding: SetupWizardBranding = {
  photo: '',
  welcomeScreen: true,
};

const defaultCalendar: SetupWizardCalendar = {
  workDays: [],
  isDifferentHours: false,
  startTime: new Date(2024, 0, 1, 9, 0), // 9:00 AM
  endTime: new Date(2024, 0, 1, 17, 0), // 5:00 PM
  dailyStartTimes: {},
  dailyEndTimes: {},
  consultation: {
    isOffer: false,
    isInPerson: false,
    isOnline: false,
    duration: 0,
    workDays: [],
    startTimes: [new Date(2024, 0, 1, 9, 0)], // Initialize with at least one default time
    isDifferentStartTimes: false,
    dailyStartTimes: {},
    meetingLink: '',
  },
};

const defaultDeposit: SetupWizardDeposit = {
  amount: 100,
  holdTime: '12',
  remindTime: '12',
  policy: 'Here is Deposit Policy',
  cancellationPolicy: 'Here is Cancellation Policy',
};

const defaultBookingRules: SetupWizardBookingRules = {
  moreThanOne: {
    isMoreOne: false,
    sessionStartTime: new Date(),
    sessionCount: 0,
    sessionDuration: 0,
    breakTime: 0,
  },
  backToBack: {
    isBackToBack: false,
    maxSessions: 0,
  },
  bufferSession: 0,
};

const defaultDrawingRules: SetupWizardDrawingRules = {
  isDrawingAdvance: false,
  reviewAdvanceTime: '24',
  changePolicyTime: '24',
  finalAppointmentRemindTime: '24',
};

const defaultCancellationList: SetupWizardCancellationList = {
  isAutoEmail: false,
  isAutoFillDrawing: false,
  rescheduleTime: '24',
  maxReschedulesAllowed: '0',
};

const defaultPaymentMethod: SetupWizardPaymentMethod = {
  paypal: {isPayPal: false, email: ''},
  eTransfer: {isETransfer: false, emailOrPhone: ''},
  creditCard: {isCreditCard: false, cardLink: ''},
  venmo: {isVenmo: false, emailOrPhone: ''},
};

const defaultWaiverUpload: SetupWizardWaiverUpload = {
  waiverDocument: null,
};

const SetupWizardContext = createContext<SetupWizardContextType | undefined>(undefined);

const SetupWizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { artist } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [stepNumber, setStepNumber] = useState(0);
  const [details, setDetails] = useState<SetupWizardDetails>(defaultDetails);
  const [branding, setBranding] = useState<SetupWizardBranding>(defaultBranding);
  const [calendar, setCalendar] = useState<SetupWizardCalendar>(defaultCalendar);
  const [deposit, setDeposit] = useState<SetupWizardDeposit>(defaultDeposit);
  const [bookingRules, setBookingRules] = useState<SetupWizardBookingRules>(defaultBookingRules);
  const [drawingRules, setDrawingRules] = useState<SetupWizardDrawingRules>(defaultDrawingRules);
  const [cancellationList, setCancellationList] = useState<SetupWizardCancellationList>(defaultCancellationList);
  const [paymentMethod, setPaymentMethod] = useState<SetupWizardPaymentMethod>(defaultPaymentMethod);
  const [waiverUpload, setWaiverUpload] = useState<SetupWizardWaiverUpload>(defaultWaiverUpload);
  const [bookingLinkError, setBookingLinkError] = useState<string>('');

  // Initialize details.name with artist's full_name when available
  useEffect(() => {
    if (artist?.full_name && details.name === '') {
      setDetails(prev => ({ ...prev, name: artist.full_name }));
    }
    if (artist?.booking_link && details.bookingLinkSuffix === '') {
      setDetails(prev => ({ ...prev, bookingLinkSuffix: artist.booking_link.split('/').slice(-1)[0] || '' }));
    }
  }, [artist?.full_name, details.name]);

  const incrementStepNumber = () => {
    setStepNumber(prev => Math.min(prev + 1, 9));
  };
  const decrementStepNumber = () => {
    setStepNumber(prev => Math.max(prev - 1, 0));
  };

  const updateDetails = (updates: Partial<SetupWizardDetails>) => {
    setDetails(prev => ({ ...prev, ...updates }));
  };

  const updateBranding = (updates: Partial<SetupWizardBranding>) => {
    setBranding(prev => ({ ...prev, ...updates }));
  };

  const updateCalendar = (updates: Partial<SetupWizardCalendar>) => {
    setCalendar(prev => {
      const newCalendar = { ...prev };

      // Handle nested consultation updates
      if (updates.consultation) {
        newCalendar.consultation = { ...prev.consultation, ...updates.consultation };
        
        // Initialize daily start times when isDifferentStartTimes is enabled and work days are added
        if (updates.consultation.isDifferentStartTimes === true && newCalendar.consultation.workDays.length > 0) {
          newCalendar.consultation.workDays.forEach(day => {
            if (!newCalendar.consultation.dailyStartTimes[day]) {
              // Use existing startTimes as default, or create a default if none exist
              newCalendar.consultation.dailyStartTimes[day] = newCalendar.consultation.startTimes.length > 0 
                ? [...newCalendar.consultation.startTimes] 
                : [new Date(2024, 0, 1, 9, 0)];
            }
          });
        }
        
        // Also initialize daily times when work days are added and isDifferentStartTimes is already enabled
        if (updates.consultation.workDays && newCalendar.consultation.isDifferentStartTimes) {
          updates.consultation.workDays.forEach(day => {
            if (!newCalendar.consultation.dailyStartTimes[day]) {
              newCalendar.consultation.dailyStartTimes[day] = newCalendar.consultation.startTimes.length > 0 
                ? [...newCalendar.consultation.startTimes] 
                : [new Date(2024, 0, 1, 9, 0)];
            }
          });
        }
      }

      // Handle other updates
      Object.keys(updates).forEach(key => {
        if (key !== 'consultation') {
          (newCalendar as any)[key] = (updates as any)[key];
        }
      });

      // Initialize daily times with default values when isDifferentHours is enabled
      if (updates.isDifferentHours === true && newCalendar.workDays.length > 0) {
        newCalendar.workDays.forEach(day => {
          if (!newCalendar.dailyStartTimes[day]) {
            newCalendar.dailyStartTimes[day] = newCalendar.startTime;
          }
          if (!newCalendar.dailyEndTimes[day]) {
            newCalendar.dailyEndTimes[day] = newCalendar.endTime;
          }
        });
      }

      // Also initialize daily times when work days are added and isDifferentHours is already enabled
      if (updates.workDays && newCalendar.isDifferentHours) {
        updates.workDays.forEach(day => {
          if (!newCalendar.dailyStartTimes[day]) {
            newCalendar.dailyStartTimes[day] = newCalendar.startTime;
          }
          if (!newCalendar.dailyEndTimes[day]) {
            newCalendar.dailyEndTimes[day] = newCalendar.endTime;
          }
        });
      }

      return newCalendar;
    });
  };

  const updateDailyStartTime = (day: string, time: Date) => {
    setCalendar(prev => ({
      ...prev,
      dailyStartTimes: {
        ...prev.dailyStartTimes,
        [day]: time
      }
    }));
  };

  const updateDailyEndTime = (day: string, time: Date) => {
    setCalendar(prev => ({
      ...prev,
      dailyEndTimes: {
        ...prev.dailyEndTimes,
        [day]: time
      }
    }));
  };

  const updateConsultationDailyStartTimes = (day: string, startTimes: Date[]) => {
    setCalendar(prev => ({
      ...prev,
      consultation: {
        ...prev.consultation,
        dailyStartTimes: {
          ...prev.consultation.dailyStartTimes,
          [day]: startTimes
        }
      }
    }));
  };

  const updateDeposit = (updates: Partial<SetupWizardDeposit>) => {
    setDeposit(prev => ({ ...prev, ...updates }));
  };

  const updateBookingRules = (updates: Partial<SetupWizardBookingRules>) => {
    setBookingRules(prev => ({ ...prev, ...updates }));
  };

  const updateDrawingRules = (updates: Partial<SetupWizardDrawingRules>) => {
    setDrawingRules(prev => ({ ...prev, ...updates }));
  };

  const updateCancellationList = (updates: Partial<SetupWizardCancellationList>) => {
    setCancellationList(prev => ({ ...prev, ...updates }));
  };

  const updatePaymentMethod = (updates: Partial<SetupWizardPaymentMethod>) => {
    setPaymentMethod(prev => ({ ...prev, ...updates }));
  };

  const updateWaiverUpload = (updates: Partial<SetupWizardWaiverUpload>) => {
    setWaiverUpload(prev => ({ ...prev, ...updates }));
  };

  return (
    <SetupWizardContext.Provider
      value={{
        isSaving,
        stepNumber,
        details,
        branding,
        calendar,
        deposit,
        bookingRules,
        drawingRules,
        cancellationList,
        paymentMethod,
        waiverUpload,
        bookingLinkError,
        setBookingLinkError,
        setIsSaving,
        incrementStepNumber,
        decrementStepNumber,
        updateDetails,
        updateBranding,
        updateCalendar,
        updateDailyStartTime,
        updateDailyEndTime,
        updateConsultationDailyStartTimes,
        updateDeposit,
        updateBookingRules,
        updateDrawingRules,
        updateCancellationList,
        updatePaymentMethod,
        updateWaiverUpload,
      }}>
      {children}
    </SetupWizardContext.Provider>
  );
};

export default SetupWizardProvider;
export { SetupWizardProvider };

export const useSetupWizard = () => {
  const context = useContext(SetupWizardContext);
  if (context === undefined) {
    throw new Error('useSetupWizard must be used within a SetupWizardProvider');
  }
  return context;
};
