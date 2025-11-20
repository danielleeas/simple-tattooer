import { supabase } from '../supabase';

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