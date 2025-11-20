import { supabase } from '../supabase';
import type { BrandingDataProps, ControlDataProps } from '@/components/pages/your-app/type';

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
            artistUpdates.photo = current.branding.profilePhoto;
        }
        if (current.branding.avatar !== initial.branding.avatar) {
            artistUpdates.avatar = current.branding.avatar;
        }

        const appUpdates: Record<string, any> = {};
        if (current.branding.watermarkImage !== initial.branding.watermarkImage) {
            appUpdates.watermark_image = current.branding.watermarkImage || null;
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