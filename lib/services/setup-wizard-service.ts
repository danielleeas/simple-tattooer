import { supabase } from '@/lib/supabase';
import { uploadFileToStorage, FileUpload } from '@/lib/services/storage-service';
import { BASE_URL } from '@/lib/constants';
import { buildBookingLink } from '@/lib/utils';

type OnProgress = (progress: number, label?: string) => void;

const toTimeString = (date: Date): string => {
  try {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '00:00';
  }
};

const guessMimeFromUri = (uri: string): string => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
};

const getNameFromUri = (uri: string): string => {
  try {
    const parts = uri.split(/[\\/]/);
    return parts[parts.length - 1] || 'file.bin';
  } catch {
    return 'file.bin';
  }
};

export interface WizardStatePayload {
  details: any;
  branding: any;
  calendar: any;
  deposit: any;
  bookingRules: any;
  drawingRules: any;
  cancellationList: any;
  paymentMethod: any;
  waiverUpload: any;
}

export async function saveSetupWizard(
  artistId: string,
  state: WizardStatePayload,
  onProgress?: OnProgress
): Promise<void> {
  const progress = (p: number, label?: string) => onProgress?.(Math.max(0, Math.min(1, p)), label);

  progress(0.02, 'Preparing setup data');

  // 1) Upload assets (avatar photo and waiver document)
  let avatarUrl: string | undefined;
  if (state.branding?.photo) {
    progress(0.08, 'Uploading profile photo');
    const fileUpload: FileUpload = {
      uri: state.branding.photo,
      name: getNameFromUri(state.branding.photo),
      type: guessMimeFromUri(state.branding.photo),
      size: 0,
    };
    const uploaded = await uploadFileToStorage(fileUpload, 'artist-photos', artistId);
    if (!uploaded.success || !uploaded.url) {
      throw new Error(uploaded.error || 'Failed to upload artist photo');
    }
    avatarUrl = uploaded.url;
  }

  let waiverUrl: string | undefined;
  const waiverDoc = state.waiverUpload?.waiverDocument;
  if (waiverDoc?.uri) {
    progress(0.12, 'Uploading waiver document');
    const uploaded = await uploadFileToStorage(
      {
        uri: waiverDoc.uri,
        name: waiverDoc.name || getNameFromUri(waiverDoc.uri),
        type: waiverDoc.type || guessMimeFromUri(waiverDoc.uri),
        size: waiverDoc.size || 0,
      },
      'artist-waivers',
      artistId
    );
    if (!uploaded.success || !uploaded.url) {
      throw new Error(uploaded.error || 'Failed to upload waiver');
    }
    waiverUrl = uploaded.url;
  }

  // 2) Update artist profile
  progress(0.22, 'Saving profile');
  const bookingLinkSuffix: string | undefined = state.details?.bookingLinkSuffix;
  const updateArtist: Record<string, any> = {
    full_name: state.details?.name || undefined,
    studio_name: state.details?.studioName || undefined,
    social_handler: state.details?.socialHandler || undefined,
    updated_at: new Date().toISOString(),
  };
  if (avatarUrl) {
    updateArtist.photo = avatarUrl;
    updateArtist.avatar = avatarUrl;
  }
  if (bookingLinkSuffix && bookingLinkSuffix.trim().length > 0) {
    updateArtist.booking_link = buildBookingLink(BASE_URL, bookingLinkSuffix);
  }

  const { error: artistError } = await supabase
    .from('artists')
    .update(updateArtist)
    .eq('id', artistId);
  if (artistError) {
    throw new Error(`Failed to update artist: ${artistError.message}`);
  }

  // 3) Replace locations with current selections
  progress(0.35, 'Saving locations');
  const { error: delLocError } = await supabase
    .from('locations')
    .delete()
    .eq('artist_id', artistId);
  if (delLocError) {
    throw new Error(`Failed to reset locations: ${delLocError.message}`);
  }

  const locations = Array.isArray(state.details?.locations) ? state.details.locations : [];
  if (locations.length > 0) {
    const mappedLocations = locations.map((loc: any) => ({
      artist_id: artistId,
      address: loc.address,
      place_id: loc.placeId,
      coordinates: {
        latitude: loc.coordinates?.latitude,
        longitude: loc.coordinates?.longitude,
      },
      is_main_studio: !!loc.isMainStudio,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insLocError } = await supabase
      .from('locations')
      .insert(mappedLocations);
    if (insLocError) {
      throw new Error(`Failed to save locations: ${insLocError.message}`);
    }
  }

  // 4) Upsert apps
  progress(0.5, 'Configuring app settings');
  const { data: existingApp, error: appFetchErr } = await supabase
    .from('apps')
    .select('id')
    .eq('artist_id', artistId)
    .maybeSingle();
  if (appFetchErr) {
    throw new Error(`Failed to fetch app config: ${appFetchErr.message}`);
  }
  const appPayload = {
    artist_id: artistId,
    watermark_image: null,
    watermark_text: '',
    watermark_position: 'center',
    watermark_opacity: 50,
    watermark_enabled: false,
    welcome_screen_enabled: !!state.branding?.welcomeScreen,
    swipe_navigation: true,
    calendar_sync: false,
    push_notifications: true,
    updated_at: new Date().toISOString(),
  };
  if (existingApp?.id) {
    const { error: appUpdateErr } = await supabase
      .from('apps')
      .update(appPayload)
      .eq('id', existingApp.id);
    if (appUpdateErr) {
      throw new Error(`Failed to update app config: ${appUpdateErr.message}`);
    }
  } else {
    const { error: appInsertErr } = await supabase
      .from('apps')
      .insert({ ...appPayload, created_at: new Date().toISOString() });
    if (appInsertErr) {
      throw new Error(`Failed to create app config: ${appInsertErr.message}`);
    }
  }

  // 5) Upsert rules
  progress(0.65, 'Applying booking rules');
  const { data: existingRule, error: ruleFetchErr } = await supabase
    .from('rules')
    .select('id')
    .eq('artist_id', artistId)
    .maybeSingle();
  if (ruleFetchErr) {
    throw new Error(`Failed to fetch rules: ${ruleFetchErr.message}`);
  }
  const rulesPayload = {
    artist_id: artistId,
    deposit_amount: Number(state.deposit?.amount ?? 0),
    deposit_hold_time: Number(state.deposit?.holdTime ?? 0),
    deposit_remind_time: Number(state.deposit?.remindTime ?? 0),
    paypal_enabled: !!state.paymentMethod?.paypal?.isPayPal,
    paypal_method: state.paymentMethod?.paypal?.email || '',
    etransfer_enabled: !!state.paymentMethod?.eTransfer?.isETransfer,
    etransfer_method: state.paymentMethod?.eTransfer?.emailOrPhone || '',
    creditcard_enabled: !!state.paymentMethod?.creditCard?.isCreditCard,
    creditcard_method: state.paymentMethod?.creditCard?.cardLink || '',
    venmo_enabled: !!state.paymentMethod?.venmo?.isVenmo,
    venmo_method: state.paymentMethod?.venmo?.emailOrPhone || '',
    deposit_policy: state.deposit?.policy || '',
    cancellation_policy: state.deposit?.cancellationPolicy || '',
    reschedule_policy: '', // Not captured explicitly in UI, reserved
    question_one: '',
    question_two: '',
    waiver_text: waiverUrl || null,
    privacy_policy: null,
    terms_of_condition: null,
    updated_at: new Date().toISOString(),
  };
  if (existingRule?.id) {
    const { error: ruleUpdateErr } = await supabase
      .from('rules')
      .update(rulesPayload)
      .eq('id', existingRule.id);
    if (ruleUpdateErr) {
      throw new Error(`Failed to update rules: ${ruleUpdateErr.message}`);
    }
  } else {
    const { error: ruleInsertErr } = await supabase
      .from('rules')
      .insert({ ...rulesPayload, created_at: new Date().toISOString() });
    if (ruleInsertErr) {
      throw new Error(`Failed to create rules: ${ruleInsertErr.message}`);
    }
  }

  // 6) Upsert flows (calendar and scheduling config)
  progress(0.8, 'Finalizing availability');
  const { data: existingFlow, error: flowFetchErr } = await supabase
    .from('flows')
    .select('id')
    .eq('artist_id', artistId)
    .maybeSingle();
  if (flowFetchErr) {
    throw new Error(`Failed to fetch flow config: ${flowFetchErr.message}`);
  }

  const workDays: string[] = Array.isArray(state.calendar?.workDays) ? state.calendar.workDays : [];
  const isDifferentHours: boolean = !!state.calendar?.isDifferentHours;
  const dailyStartTimes: Record<string, Date> = state.calendar?.dailyStartTimes || {};
  const dailyEndTimes: Record<string, Date> = state.calendar?.dailyEndTimes || {};

  const startTimesObj: Record<string, string> = {};
  const endTimesObj: Record<string, string> = {};
  if (isDifferentHours) {
    workDays.forEach((d) => {
      startTimesObj[d] = toTimeString(dailyStartTimes[d] || state.calendar?.startTime || new Date(0));
      endTimesObj[d] = toTimeString(dailyEndTimes[d] || state.calendar?.endTime || new Date(0));
    });
  } else {
    const start = toTimeString(state.calendar?.startTime || new Date(0));
    const end = toTimeString(state.calendar?.endTime || new Date(0));
    workDays.forEach((d) => {
      startTimesObj[d] = start;
      endTimesObj[d] = end;
    });
  }

  const consult = state.calendar?.consultation || {};
  const consultWorkDays: string[] = Array.isArray(consult.workDays) ? consult.workDays : [];
  const diffConsult: boolean = !!consult.isDifferentStartTimes;
  const consultStartTimesObj: Record<string, string[]> = {};
  if (diffConsult) {
    const daily: Record<string, Date[]> = consult.dailyStartTimes || {};
    consultWorkDays.forEach((d) => {
      const arr = Array.isArray(daily[d]) ? daily[d] : [];
      consultStartTimesObj[d] = arr.map((t) => toTimeString(t));
    });
  } else {
    const baseArr: Date[] = Array.isArray(consult.startTimes) ? consult.startTimes : [];
    const asStrings = baseArr.map((t) => toTimeString(t));
    consultWorkDays.forEach((d) => {
      consultStartTimesObj[d] = asStrings;
    });
  }

  const flowsPayload = {
    artist_id: artistId,
    work_days: workDays,
    diff_time_enabled: isDifferentHours,
    start_times: startTimesObj,
    end_times: endTimesObj,
    consult_enabled: !!consult.isOffer,
    consult_in_person: !!consult.isInPerson,
    consult_online: !!consult.isOnline,
    consult_duration: Number(consult.duration || 0),
    consult_work_days: consultWorkDays,
    diff_consult_time_enabled: diffConsult,
    consult_start_times: consultStartTimesObj,
    consult_meeting_url: consult.meetingLink || '',
    multiple_sessions_enabled: !!state.bookingRules?.moreThanOne?.isMoreOne,
    sessions_per_day: Number(state.bookingRules?.moreThanOne?.sessionCount || 0),
    session_duration: Number(state.bookingRules?.moreThanOne?.sessionDuration || 0),
    break_time: Number(state.bookingRules?.moreThanOne?.breakTime || 0),
    back_to_back_enabled: !!state.bookingRules?.backToBack?.isBackToBack,
    max_back_to_back: Number(state.bookingRules?.backToBack?.maxSessions || 0),
    buffer_between_sessions: Number(state.bookingRules?.bufferSession || 0),
    send_drawings_in_advance: !!state.drawingRules?.isDrawingAdvance,
    receive_drawing_time: Number(state.drawingRules?.reviewAdvanceTime || 0),
    change_policy_time: Number(state.drawingRules?.changePolicyTime || 0),
    final_appointment_remind_time: Number(state.drawingRules?.finalAppointmentRemindTime || 0),
    auto_email: !!state.cancellationList?.isAutoEmail,
    auto_fill_drawing_enabled: !!state.cancellationList?.isAutoFillDrawing,
    max_reschedules: Number(state.cancellationList?.maxReschedulesAllowed || 0),
    reschedule_booking_days: Number(state.cancellationList?.rescheduleTime || 0),
    updated_at: new Date().toISOString(),
  };
  if (existingFlow?.id) {
    const { error: flowUpdateErr } = await supabase
      .from('flows')
      .update(flowsPayload)
      .eq('id', existingFlow.id);
    if (flowUpdateErr) {
      throw new Error(`Failed to update flows: ${flowUpdateErr.message}`);
    }
  } else {
    const { error: flowInsertErr } = await supabase
      .from('flows')
      .insert({ ...flowsPayload, created_at: new Date().toISOString() });
    if (flowInsertErr) {
      throw new Error(`Failed to create flows: ${flowInsertErr.message}`);
    }
  }

  progress(0.98, 'Wrapping up');
  progress(1, 'Done');
}


