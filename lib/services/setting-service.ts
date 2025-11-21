import { supabase } from '../supabase';
import type { BrandingDataProps, ControlDataProps } from '@/components/pages/your-app/type';
import type { WorkDayDataProps, BookingDataProps, DrawingDataProps } from '@/components/pages/your-flow/type';
import type { DepositDataProps, PolicyDataProps, TemplateDataProps } from '@/components/pages/your-rule/type';
import { uploadFileToStorage, detectMimeTypeFromUri, extractNameFromUri } from './storage-service';
import type { Locations } from '@/lib/redux/types';

export const updateBookingQuestions = async (
    artistId: string,
    questions: { questionOne: string; questionTwo: string }
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data: existingRule, error: ruleFetchErr } = await supabase
            .from('rules')
            .select('id')
            .eq('artist_id', artistId)
            .maybeSingle();

        if (ruleFetchErr) {
            throw new Error(ruleFetchErr.message || 'Failed to fetch rules');
        }

        const payload = {
            question_one: questions.questionOne || '',
            question_two: questions.questionTwo || '',
            updated_at: new Date().toISOString(),
        };

        if (existingRule?.id) {
            const { error: updateErr } = await supabase
                .from('rules')
                .update(payload)
                .eq('id', existingRule.id);
            if (updateErr) {
                throw new Error(updateErr.message || 'Failed to update questions');
            }
        } else {
            const { error: insertErr } = await supabase
                .from('rules')
                .insert([{ artist_id: artistId, ...payload, created_at: new Date().toISOString() }]);
            if (insertErr) {
                throw new Error(insertErr.message || 'Failed to create rules with questions');
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating booking questions:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};

export const updatePassword = async (
    oldPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // First, get the current user to verify they're authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        // Verify the old password by attempting to sign in with it
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: oldPassword
        });

        if (verifyError) {
            return {
                success: false,
                error: 'Current password is incorrect'
            };
        }

        // If verification successful, update to new password
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw new Error(`Failed to update password: ${error.message}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating password:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

export async function addTemporaryLocation(
    artistId: string,
    location: {
        address: string;
        place_id: string;
        coordinates: { latitude: number; longitude: number };
        is_main_studio: boolean;
        is_temporary?: boolean;
    }
): Promise<{ success: boolean; location?: Locations; error?: string }> {
    try {
        if (!artistId) {
            return { success: false, error: 'Missing artist id' };
        }
        if (!location?.address || !location?.place_id) {
            return { success: false, error: 'Invalid location' };
        }

        const payload = {
            artist_id: artistId,
            address: location.address,
            place_id: location.place_id,
            coordinates: {
                latitude: location.coordinates?.latitude,
                longitude: location.coordinates?.longitude,
            },
            is_main_studio: !!location.is_main_studio,
            // If your schema does not include this column, Supabase will error.
            // Consumers should ignore the flag if unsupported.
            is_temporary: location.is_temporary ?? true,
        };

        const { data, error } = await supabase
            .from('locations')
            .insert([payload])
            .select('id, address, place_id, coordinates, is_main_studio')
            .single();

        if (error) {
            // Fallback: try to fetch an existing location by address for this artist
            const { data: existing, error: findErr } = await supabase
                .from('locations')
                .select('id, address, place_id, coordinates, is_main_studio')
                .eq('artist_id', artistId)
                .eq('address', location.address)
                .maybeSingle();
            if (findErr || !existing) {
                return { success: false, error: error.message || 'Failed to add temporary location' };
            }
            return { success: true, location: existing as unknown as Locations };
        }

        return { success: true, location: data as unknown as Locations };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

type ProgressFn = (progress: number, label?: string) => void;

export const saveArtistSettings = async (
    artistId: string,
    current: { branding: BrandingDataProps; control: ControlDataProps },
    initial: { branding: BrandingDataProps; control: ControlDataProps },
    onProgress?: ProgressFn
): Promise<{ success: boolean; error?: string }> => {
    try {
        const progress = (p: number, label?: string) => {
            if (onProgress) onProgress(p, label);
        };

        // Compute diffs
        const artistUpdates: Record<string, any> = {};
        if (current.branding.fullName !== initial.branding.fullName) {
            artistUpdates.full_name = current.branding.fullName;
        }
        if (current.branding.studioName !== initial.branding.studioName) {
            artistUpdates.studio_name = current.branding.studioName;
        }
        if (current.branding.bookingLink !== initial.branding.bookingLink) {
            artistUpdates.booking_link = current.branding.bookingLink;
        }
        if (current.branding.socialMediaHandle !== initial.branding.socialMediaHandle) {
            artistUpdates.social_handler = current.branding.socialMediaHandle;
        }
        if (current.branding.profilePhoto !== initial.branding.profilePhoto) {
            if (current.branding.profilePhoto) {
                progress(0.05, 'Uploading profile photo');
                const uri = current.branding.profilePhoto;
                const result = await uploadFileToStorage(
                    {
                        uri,
                        name: extractNameFromUri(uri, 'profile.jpg'),
                        type: detectMimeTypeFromUri(uri),
                        size: 0,
                    },
                    'artist-photos',
                    `${artistId}/profile`
                );
                if (!result.success || !result.url) {
                    throw new Error(result.error || 'Failed to upload profile photo');
                }
                artistUpdates.photo = result.url;
            } else {
                artistUpdates.photo = null;
            }
        }
        if (current.branding.avatar !== initial.branding.avatar) {
            if (current.branding.avatar) {
                progress(0.08, 'Uploading avatar');
                const uri = current.branding.avatar;
                const result = await uploadFileToStorage(
                    {
                        uri,
                        name: extractNameFromUri(uri, 'avatar.jpg'),
                        type: detectMimeTypeFromUri(uri),
                        size: 0,
                    },
                    'artist-photos',
                    `${artistId}/avatar`
                );
                if (!result.success || !result.url) {
                    throw new Error(result.error || 'Failed to upload avatar');
                }
                artistUpdates.avatar = result.url;
            } else {
                artistUpdates.avatar = null;
            }
        }

        const appUpdates: Record<string, any> = {};
        if (current.branding.watermarkImage !== initial.branding.watermarkImage) {
            if (current.branding.watermarkImage) {
                progress(0.1, 'Uploading watermark image');
                const uri = current.branding.watermarkImage;
                const result = await uploadFileToStorage(
                    {
                        uri,
                        name: extractNameFromUri(uri, 'watermark.jpg'),
                        type: detectMimeTypeFromUri(uri),
                        size: 0,
                    },
                    'artist-photos',
                    `${artistId}/watermark`
                );
                if (!result.success || !result.url) {
                    throw new Error(result.error || 'Failed to upload watermark image');
                }
                appUpdates.watermark_image = result.url;
            } else {
                appUpdates.watermark_image = null;
            }
        }
        if (current.branding.watermarkText !== initial.branding.watermarkText) {
            appUpdates.watermark_text = current.branding.watermarkText || null;
        }
        if (current.branding.watermarkPosition !== initial.branding.watermarkPosition) {
            appUpdates.watermark_position = current.branding.watermarkPosition || 'center';
        }
        if (current.branding.watermarkOpacity !== initial.branding.watermarkOpacity) {
            appUpdates.watermark_opacity = current.branding.watermarkOpacity ?? 50;
        }
        if (current.branding.watermarkEnabled !== initial.branding.watermarkEnabled) {
            appUpdates.watermark_enabled = !!current.branding.watermarkEnabled;
        }
        if (current.branding.welcomeScreenEnabled !== initial.branding.welcomeScreenEnabled) {
            appUpdates.welcome_screen_enabled = !!current.branding.welcomeScreenEnabled;
        }
        if (current.control.pushNotifications !== initial.control.pushNotifications) {
            appUpdates.push_notifications = !!current.control.pushNotifications;
        }
        if (current.control.calendarSync !== initial.control.calendarSync) {
            appUpdates.calendar_sync = !!current.control.calendarSync;
        }
        if (current.control.swipeNavigation !== initial.control.swipeNavigation) {
            appUpdates.swipe_navigation = !!current.control.swipeNavigation;
        }

        const locationChanged =
            (!!current.branding.location || !!initial.branding.location) &&
            (
                (!current.branding.location && !!initial.branding.location) ||
                (!!current.branding.location && !initial.branding.location) ||
                (
                    !!current.branding.location && !!initial.branding.location && (
                        current.branding.location.address !== initial.branding.location.address ||
                        current.branding.location.placeId !== initial.branding.location.placeId ||
                        current.branding.location.coordinates.latitude !== initial.branding.location.coordinates.latitude ||
                        current.branding.location.coordinates.longitude !== initial.branding.location.coordinates.longitude ||
                        current.branding.location.isMainStudio !== initial.branding.location.isMainStudio
                    )
                )
            );

        // Determine step count for progress
        let plannedSteps = 0;
        if (Object.keys(artistUpdates).length > 0) plannedSteps += 1;
        if (Object.keys(appUpdates).length > 0) plannedSteps += 1;
        if (locationChanged) plannedSteps += 1;
        if (plannedSteps === 0) {
            progress(1, 'Nothing to save');
            return { success: true };
        }

        let completed = 0;
        const stepDone = (label?: string) => {
            completed += 1;
            const frac = completed / plannedSteps;
            progress(frac, label);
        };

        // 1) Update artists
        if (Object.keys(artistUpdates).length > 0) {
            progress(completed / plannedSteps, 'Updating profile');
            const { error: artistErr } = await supabase
                .from('artists')
                .update(artistUpdates)
                .eq('id', artistId);
            if (artistErr) {
                throw new Error(artistErr.message || 'Failed to update artist profile');
            }
            stepDone('Profile updated');
        }

        // 2) Upsert apps row with updates
        if (Object.keys(appUpdates).length > 0) {
            progress(completed / Math.max(plannedSteps, 1), 'Saving app settings');
            // Ensure apps row exists
            const { data: appRow, error: appSelectErr } = await supabase
                .from('apps')
                .select('id')
                .eq('artist_id', artistId)
                .limit(1)
                .single();

            if (appSelectErr && appSelectErr.code !== 'PGRST116') {
                // PGRST116 typically means no rows found for single()
                throw new Error(appSelectErr.message || 'Failed to load app settings');
            }

            if (appRow?.id) {
                const { error: appUpdateErr } = await supabase
                    .from('apps')
                    .update(appUpdates)
                    .eq('id', appRow.id);
                if (appUpdateErr) {
                    throw new Error(appUpdateErr.message || 'Failed to update app settings');
                }
            } else {
                const { error: appInsertErr } = await supabase
                    .from('apps')
                    .insert([{ artist_id: artistId, ...appUpdates }]);
                if (appInsertErr) {
                    throw new Error(appInsertErr.message || 'Failed to create app settings');
                }
            }
            stepDone('App settings saved');
        }

        // 3) Handle main location
        if (locationChanged) {
            progress(completed / Math.max(plannedSteps, 1), 'Updating location');
            const { data: mainLoc, error: locSelectErr } = await supabase
                .from('locations')
                .select('id')
                .eq('artist_id', artistId)
                .eq('is_main_studio', true)
                .limit(1)
                .single();

            if (locSelectErr && locSelectErr.code !== 'PGRST116') {
                throw new Error(locSelectErr.message || 'Failed to load main location');
            }

            const desired = current.branding.location;
            if (!desired) {
                // Delete existing main location if any
                if (mainLoc?.id) {
                    const { error: delErr } = await supabase
                        .from('locations')
                        .delete()
                        .eq('id', mainLoc.id);
                    if (delErr) {
                        throw new Error(delErr.message || 'Failed to remove location');
                    }
                }
            } else if (mainLoc?.id) {
                const { error: updErr } = await supabase
                    .from('locations')
                    .update({
                        address: desired.address,
                        place_id: desired.placeId,
                        coordinates: {
                            latitude: desired.coordinates.latitude,
                            longitude: desired.coordinates.longitude,
                        },
                        is_main_studio: true,
                    })
                    .eq('id', mainLoc.id);
                if (updErr) {
                    throw new Error(updErr.message || 'Failed to update location');
                }
            } else {
                const { error: insErr } = await supabase
                    .from('locations')
                    .insert([{
                        artist_id: artistId,
                        address: desired.address,
                        place_id: desired.placeId,
                        coordinates: {
                            latitude: desired.coordinates.latitude,
                            longitude: desired.coordinates.longitude,
                        },
                        is_main_studio: true,
                    }]);
                if (insErr) {
                    throw new Error(insErr.message || 'Failed to create location');
                }
            }
            stepDone('Location updated');
        }

        progress(1, 'All changes saved');
        return { success: true };
    } catch (error) {
        console.error('Error saving artist settings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};

export const saveFlowSettings = async (
    artistId: string,
    current: { workDay: WorkDayDataProps; booking: BookingDataProps; drawing: DrawingDataProps },
    initial: { workDay: WorkDayDataProps; booking: BookingDataProps; drawing: DrawingDataProps },
    onProgress?: ProgressFn
): Promise<{ success: boolean; error?: string }> => {
    try {
        const progress = (p: number, label?: string) => {
            if (onProgress) onProgress(p, label);
        };

        if (
            JSON.stringify(current.workDay) === JSON.stringify(initial.workDay) &&
            JSON.stringify(current.booking) === JSON.stringify(initial.booking) &&
            JSON.stringify(current.drawing) === JSON.stringify(initial.drawing)
        ) {
            progress(1, 'Nothing to save');
            return { success: true };
        }

        progress(0.1, 'Preparing flow settings');

        const flowsPayload = {
            artist_id: artistId,
            work_days: current.workDay.workDays,
            diff_time_enabled: !!current.workDay.diffTimeEnabled,
            start_times: current.workDay.startTimes,
            end_times: current.workDay.endTimes,
            consult_enabled: !!current.workDay.consultEnabled,
            consult_in_person: !!current.workDay.consultInPerson,
            consult_online: !!current.workDay.consultOnline,
            consult_duration: Number(current.workDay.consultDuration || 0),
            consult_work_days: current.workDay.consultWorkDays,
            diff_consult_time_enabled: !!current.workDay.diffConsultTimeEnabled,
            consult_start_times: current.workDay.consultStartTimes,
            consult_meeting_url: current.workDay.consultMeetingLink || '',

            multiple_sessions_enabled: !!current.booking.multipleSessionsEnabled,
            sessions_per_day: Number(current.booking.sessionsPerDay || 0),
            session_duration: Number(current.booking.sessionDuration || 0),
            break_time: Number(current.booking.breakTime || 0),
            back_to_back_enabled: !!current.booking.backToBackEnabled,
            max_back_to_back: Number(current.booking.maxBackToBack || 0),
            buffer_between_sessions: Number(current.booking.bufferBetweenSessions || 0),

            send_drawings_in_advance: !!current.drawing.sendDrawingsInAdvance,
            receive_drawing_time: Number(current.drawing.receiveDrawingTime || 0),
            change_policy_time: Number(current.drawing.changePolicyTime || 0),
            final_appointment_remind_time: Number(current.drawing.finalAppointmentRemindTime || 0),
            auto_email: !!current.drawing.autoEmail,
            auto_fill_drawing_enabled: !!current.drawing.autoFillDrawing,
            max_reschedules: Number(current.drawing.maxReschedulesAllowed || 0),
            reschedule_booking_days: Number(current.drawing.rescheduleBookingDays || 0),

            updated_at: new Date().toISOString(),
        };

        progress(0.3, 'Saving flow settings');

        const { data: existingFlow, error: flowFetchErr } = await supabase
            .from('flows')
            .select('id')
            .eq('artist_id', artistId)
            .maybeSingle();

        if (flowFetchErr) {
            throw new Error(flowFetchErr.message || 'Failed to fetch flows');
        }

        if (existingFlow?.id) {
            const { error: flowUpdateErr } = await supabase
                .from('flows')
                .update(flowsPayload)
                .eq('id', existingFlow.id);
            if (flowUpdateErr) {
                throw new Error(flowUpdateErr.message || 'Failed to update flows');
            }
        } else {
            const { error: flowInsertErr } = await supabase
                .from('flows')
                .insert([{ ...flowsPayload, created_at: new Date().toISOString() }]);
            if (flowInsertErr) {
                throw new Error(flowInsertErr.message || 'Failed to create flows');
            }
        }

        progress(1, 'Flow settings saved');
        return { success: true };
    } catch (error) {
        console.error('Error saving flow settings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};

export const saveRuleSettings = async (
    artistId: string,
    current: { deposit: DepositDataProps; policy: PolicyDataProps; template: TemplateDataProps },
    initial: { deposit: DepositDataProps; policy: PolicyDataProps; template: TemplateDataProps },
    onProgress?: ProgressFn
): Promise<{ success: boolean; error?: string; ruleUrls?: { waiver_text?: string; privacy_policy?: string; terms_of_condition?: string } }> => {
    try {
        const progress = (p: number, label?: string) => {
            if (onProgress) onProgress(p, label);
        };

        // Compute diffs for rules table
        const ruleUpdates: Record<string, any> = {};
        // Deposit
        if (current.deposit.depositAmount !== initial.deposit.depositAmount) {
            ruleUpdates.deposit_amount = Number(current.deposit.depositAmount ?? 0);
        }
        if (current.deposit.depositHoldTime !== initial.deposit.depositHoldTime) {
            ruleUpdates.deposit_hold_time = Number(current.deposit.depositHoldTime ?? 0);
        }
        if (current.deposit.depositRemindTime !== initial.deposit.depositRemindTime) {
            ruleUpdates.deposit_remind_time = Number(current.deposit.depositRemindTime ?? 0);
        }
        if (current.deposit.paypalEnabled !== initial.deposit.paypalEnabled) {
            ruleUpdates.paypal_enabled = !!current.deposit.paypalEnabled;
        }
        if (current.deposit.paypalMethod !== initial.deposit.paypalMethod) {
            ruleUpdates.paypal_method = current.deposit.paypalMethod || '';
        }
        if (current.deposit.etransferEnabled !== initial.deposit.etransferEnabled) {
            ruleUpdates.etransfer_enabled = !!current.deposit.etransferEnabled;
        }
        if (current.deposit.etransferMethod !== initial.deposit.etransferMethod) {
            ruleUpdates.etransfer_method = current.deposit.etransferMethod || '';
        }
        if (current.deposit.creditcardEnabled !== initial.deposit.creditcardEnabled) {
            ruleUpdates.creditcard_enabled = !!current.deposit.creditcardEnabled;
        }
        if (current.deposit.creditcardMethod !== initial.deposit.creditcardMethod) {
            ruleUpdates.creditcard_method = current.deposit.creditcardMethod || '';
        }
        if (current.deposit.venmoEnabled !== initial.deposit.venmoEnabled) {
            ruleUpdates.venmo_enabled = !!current.deposit.venmoEnabled;
        }
        if (current.deposit.venmoMethod !== initial.deposit.venmoMethod) {
            ruleUpdates.venmo_method = current.deposit.venmoMethod || '';
        }
        // Policy
        if (current.policy.depositPolicy !== initial.policy.depositPolicy) {
            ruleUpdates.deposit_policy = current.policy.depositPolicy || '';
        }
        if (current.policy.cancellationPolicy !== initial.policy.cancellationPolicy) {
            ruleUpdates.cancellation_policy = current.policy.cancellationPolicy || '';
        }
        if (current.policy.reschedulePolicy !== initial.policy.reschedulePolicy) {
            ruleUpdates.reschedule_policy = current.policy.reschedulePolicy || '';
        }
        if (current.policy.questionOne !== initial.policy.questionOne) {
            ruleUpdates.question_one = current.policy.questionOne || '';
        }
        if (current.policy.questionTwo !== initial.policy.questionTwo) {
            ruleUpdates.question_two = current.policy.questionTwo || '';
        }

        const uploadedUrls: { waiver_text?: string; privacy_policy?: string; terms_of_condition?: string } = {};

        // Upload Waiver file
        if (current.policy.waiverText !== initial.policy.waiverText) {
            if (current.policy.waiverText) {
                progress?.(0.1, 'Uploading waiver');
                const waiverUri = current.policy.waiverText;
                const result = await uploadFileToStorage(
                    {
                        uri: waiverUri,
                        name: extractNameFromUri(waiverUri, 'waiver.pdf'),
                        type: detectMimeTypeFromUri(waiverUri),
                        size: 0,
                    },
                    'artist-waivers',
                    artistId
                );
                if (!result.success || !result.url) {
                    throw new Error(result.error || 'Failed to upload waiver');
                }
                uploadedUrls.waiver_text = result.url;
                ruleUpdates.waiver_text = result.url;
            } else {
                ruleUpdates.waiver_text = '';
            }
        }

        // Upload Privacy Policy file
        if (current.policy.privacyPolicy !== initial.policy.privacyPolicy) {
            if (current.policy.privacyPolicy) {
                progress?.(0.15, 'Uploading privacy policy');
                const privacyUri = current.policy.privacyPolicy;
                const result = await uploadFileToStorage(
                    {
                        uri: privacyUri,
                        name: extractNameFromUri(privacyUri, 'privacy.pdf'),
                        type: detectMimeTypeFromUri(privacyUri),
                        size: 0,
                    },
                    'artist-policies',
                    artistId
                );
                if (!result.success || !result.url) {
                    throw new Error(result.error || 'Failed to upload privacy policy');
                }
                uploadedUrls.privacy_policy = result.url;
                ruleUpdates.privacy_policy = result.url;
            } else {
                ruleUpdates.privacy_policy = '';
            }
        }

        // Upload Terms & Conditions file
        if (current.policy.termsOfCondition !== initial.policy.termsOfCondition) {
            if (current.policy.termsOfCondition) {
                progress?.(0.2, 'Uploading artist policies');
                const termsUri = current.policy.termsOfCondition;
                const result = await uploadFileToStorage(
                    {
                        uri: termsUri,
                        name: extractNameFromUri(termsUri, 'terms.pdf'),
                        type: detectMimeTypeFromUri(termsUri),
                        size: 0,
                    },
                    'artist-terms',
                    artistId
                );
                if (!result.success || !result.url) {
                    throw new Error(result.error || 'Failed to upload artist policies');
                }
                uploadedUrls.terms_of_condition = result.url;
                ruleUpdates.terms_of_condition = result.url;
            } else {
                ruleUpdates.terms_of_condition = '';
            }
        }

        // Compute diffs for templates table
        const templateUpdates: Record<string, any> = {};
        const mapTemplate = (key: keyof TemplateDataProps, column: string) => {
            if (current.template[key] !== initial.template[key]) {
                templateUpdates[column] = current.template[key] || '';
            }
        };
        mapTemplate('newBookingRequestReceivedSubject', 'new_booking_request_received_subject');
        mapTemplate('newBookingRequestReceivedBody', 'new_booking_request_received_body');
        mapTemplate('bookingRequestApprovedAutoSubject', 'booking_request_approved_auto_subject');
        mapTemplate('bookingRequestApprovedAutoBody', 'booking_request_approved_auto_body');
        mapTemplate('bookingRequestApprovedManualSubject', 'booking_request_approved_manual_subject');
        mapTemplate('bookingRequestApprovedManualBody', 'booking_request_approved_manual_body');
        mapTemplate('declinedBookingRequestSubject', 'declined_booking_request_subject');
        mapTemplate('declinedBookingRequestBody', 'declined_booking_request_body');
        mapTemplate('depositPaymentReminderSubject', 'deposit_payment_reminder_subject');
        mapTemplate('depositPaymentReminderBody', 'deposit_payment_reminder_body');
        mapTemplate('depositForfeitSubject', 'deposit_forfeit_subject');
        mapTemplate('depositForfeitBody', 'deposit_forfeit_body');
        mapTemplate('depositKeepSubject', 'deposit_keep_subject');
        mapTemplate('depositKeepBody', 'deposit_keep_body');
        mapTemplate('consultConfirmationSubject', 'consult_confirmation_subject');
        mapTemplate('consultConfirmationBody', 'consult_confirmation_body');
        mapTemplate('consultReminderSubject', 'consult_reminder_subject');
        mapTemplate('consultReminderBody', 'consult_reminder_body');
        mapTemplate('consultDeclinedSubject', 'consult_declined_subject');
        mapTemplate('consultDeclinedBody', 'consult_declined_body');
        mapTemplate('appointmentConfirmationNoProfileSubject', 'appointment_confirmation_no_profile_subject');
        mapTemplate('appointmentConfirmationNoProfileBody', 'appointment_confirmation_no_profile_body');
        mapTemplate('appointmentConfirmationWithProfileSubject', 'appointment_confirmation_with_profile_subject');
        mapTemplate('appointmentConfirmationWithProfileBody', 'appointment_confirmation_with_profile_body');
        mapTemplate('appointmentFinalConfirmationSubject', 'appointment_final_confirmation_subject');
        mapTemplate('appointmentFinalConfirmationBody', 'appointment_final_confirmation_body');
        mapTemplate('waiverReminderSubject', 'waiver_reminder_subject');
        mapTemplate('waiverReminderBody', 'waiver_reminder_body');
        mapTemplate('healingCheckInSubject', 'healing_check_in_subject');
        mapTemplate('healingCheckInBody', 'healing_check_in_body');
        mapTemplate('cancellationNotificationSubject', 'cancellation_notification_subject');
        mapTemplate('cancellationNotificationBody', 'cancellation_notification_body');

        let plannedSteps = 0;
        if (Object.keys(ruleUpdates).length > 0) plannedSteps += 1;
        if (Object.keys(templateUpdates).length > 0) plannedSteps += 1;
        if (plannedSteps === 0) {
            progress(1, 'Nothing to save');
            return { success: true };
        }

        let completed = 0;
        const stepDone = (label?: string) => {
            completed += 1;
            const frac = completed / plannedSteps;
            progress(frac, label);
        };

        // 1) Upsert rules
        if (Object.keys(ruleUpdates).length > 0) {
            progress(completed / Math.max(plannedSteps, 1), 'Saving rules');
            const { data: existingRule, error: ruleFetchErr } = await supabase
                .from('rules')
                .select('id')
                .eq('artist_id', artistId)
                .maybeSingle();

            if (ruleFetchErr) {
                throw new Error(ruleFetchErr.message || 'Failed to fetch rules');
            }

            const payload = { ...ruleUpdates, updated_at: new Date().toISOString() };
            if (existingRule?.id) {
                const { error: ruleUpdateErr } = await supabase
                    .from('rules')
                    .update(payload)
                    .eq('id', existingRule.id);
                if (ruleUpdateErr) {
                    throw new Error(ruleUpdateErr.message || 'Failed to update rules');
                }
            } else {
                const { error: ruleInsertErr } = await supabase
                    .from('rules')
                    .insert([{ artist_id: artistId, ...payload, created_at: new Date().toISOString() }]);
                if (ruleInsertErr) {
                    throw new Error(ruleInsertErr.message || 'Failed to create rules');
                }
            }
            stepDone('Rules saved');
        }

        // 2) Upsert templates
        if (Object.keys(templateUpdates).length > 0) {
            progress(completed / Math.max(plannedSteps, 1), 'Saving templates');
            const { data: existingTemplate, error: templateFetchErr } = await supabase
                .from('templates')
                .select('id')
                .eq('artist_id', artistId)
                .maybeSingle();

            if (templateFetchErr) {
                throw new Error(templateFetchErr.message || 'Failed to fetch templates');
            }

            const payload = { ...templateUpdates, updated_at: new Date().toISOString() };
            if (existingTemplate?.id) {
                const { error: templateUpdateErr } = await supabase
                    .from('templates')
                    .update(payload)
                    .eq('id', existingTemplate.id);
                if (templateUpdateErr) {
                    throw new Error(templateUpdateErr.message || 'Failed to update templates');
                }
            } else {
                const { error: templateInsertErr } = await supabase
                    .from('templates')
                    .insert([{ artist_id: artistId, ...payload, created_at: new Date().toISOString() }]);
                if (templateInsertErr) {
                    throw new Error(templateInsertErr.message || 'Failed to create templates');
                }
            }
            stepDone('Templates saved');
        }

        progress(1, 'All changes saved');
        return { success: true, ruleUrls: uploadedUrls };
    } catch (error) {
        console.error('Error saving rule settings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};

export const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        // Get current user
        // const { data: { user }, error: userError } = await supabase.auth.getUser();

        // if (userError || !user) {
        //     throw new Error('User not authenticated');
        // }

        // const artistId = user.id;

        // // Use a database function to delete all user data in one transaction
        // // This is more reliable than individual deletions
        // const { error: deleteError } = await supabase
        //     .rpc('delete_artist_account', { artist_id: artistId });

        // if (deleteError) {
        //     // If the RPC function doesn't exist, fall back to individual deletions
        //     console.warn('RPC function not available, using individual deletions:', deleteError);

        //     // Delete all related data in the correct order (respecting foreign key constraints)

        //     // 1. Delete artist locations
        //     const { error: locationsError } = await supabase
        //         .from('artist_locations')
        //         .delete()
        //         .eq('artist_id', artistId);

        //     if (locationsError) {
        //         console.warn('Error deleting artist locations:', locationsError);
        //     }

        //     // 2. Delete artist subscriptions
        //     const { error: subscriptionsError } = await supabase
        //         .from('artist_subscriptions')
        //         .delete()
        //         .eq('artist_id', artistId);

        //     if (subscriptionsError) {
        //         console.warn('Error deleting artist subscriptions:', subscriptionsError);
        //     }

        //     // 3. Delete artist settings
        //     const { error: settingsError } = await supabase
        //         .from('artist_settings')
        //         .delete()
        //         .eq('artist_id', artistId);

        //     if (settingsError) {
        //         console.warn('Error deleting artist settings:', settingsError);
        //     }

        //     // 4. Delete artist rules
        //     const { error: rulesError } = await supabase
        //         .from('artist_rules')
        //         .delete()
        //         .eq('artist_id', artistId);

        //     if (rulesError) {
        //         console.warn('Error deleting artist rules:', rulesError);
        //     }

        //     // 5. Delete artist flows
        //     const { error: flowsError } = await supabase
        //         .from('artist_flows')
        //         .delete()
        //         .eq('artist_id', artistId);

        //     if (flowsError) {
        //         console.warn('Error deleting artist flows:', flowsError);
        //     }

        //     // 6. Delete the main artist record
        //     const { error: artistError } = await supabase
        //         .from('artists')
        //         .delete()
        //         .eq('id', artistId);

        //     if (artistError) {
        //         throw new Error(`Failed to delete artist record: ${artistError.message}`);
        //     }
        // }

        // // Finally, sign out the user (the database records are already deleted)
        // const { error: signOutError } = await supabase.auth.signOut();

        // if (signOutError) {
        //     console.warn('Error signing out user:', signOutError);
        //     // Don't throw error here as the main deletion was successful
        // }

        return { success: true };
    } catch (error) {
        console.error('Error deleting account:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};