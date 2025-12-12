import { supabase } from '@/lib/supabase';
import { SignupData, Artist, Subscriptions, Client, Locations } from '@/lib/redux/types';
import { withRetryAndTimeout, safeAsync, buildFullBookingLink } from '@/lib/utils';
import { BASE_URL } from '@/lib/constants';

// Check if artist already exists by email
export const checkArtistExists = async (email: string): Promise<{ exists: boolean; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error checking artist existence:', error);
      return { exists: false, error };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error('Error checking artist existence:', error);
    return { exists: false, error };
  }
};

// Sign up user with Supabase Auth
export const signUpUser = async (signupData: SignupData): Promise<{ user: any; session: any; error: any }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: {
          full_name: signupData.name,
        }
      }
    });
    return { user: data.user, session: data.session, error };
  } catch (error) {
    console.error('Signup error:', error);
    return { user: null, session: null, error };
  }
};

// Sign in user with email/password
export const signInUser = async (
  email: string,
  password: string
): Promise<{ user: any; session: any; error: any }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, session: data.session, error };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, session: null, error };
  }
};

export const generateBookingLink = async (fullName: string) => {
  const baseName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');

  let bookingLink = baseName;
  let counter = 1;

  // Check if the booking link already exists
  while (true) {
    const { data, error } = await supabase
      .from('artists')
      .select('booking_link')
      .eq('booking_link', buildFullBookingLink(BASE_URL, bookingLink))
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found, meaning the booking link is unique
      break;
    } else if (error) {
      console.error('Error checking booking link uniqueness:', error);
      throw new Error(`Failed to check booking link uniqueness: ${error.message}`);
    }

    // If we found a row, the booking link exists, so we need to try a different one
    bookingLink = `${baseName}${counter}`;
    counter++;
  }

  return bookingLink;
}

// Create user profile in custom users table
export const createArtistProfile = async (userId: string, artistData: { full_name: string; email: string; temp: string }): Promise<Artist | null> => {
  try {
    const bookingLinkString = await generateBookingLink(artistData.full_name);
    const booking_link = buildFullBookingLink(BASE_URL, bookingLinkString);

    const artistProfileData = {
      id: userId,
      email: artistData.email,
      full_name: artistData.full_name,
      booking_link: booking_link,
      subscription_active: false, // Will be updated when subscription is saved
      created_at: new Date().toISOString(),
      temp: artistData.temp,
    };

    const { data, error } = await supabase
      .from('artists')
      .insert(artistProfileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Update artist subscription status
export const updateSubscriptionStatus = async (
  artistId: string,
  subscriptionType: string | null,
  isActive: boolean = true
): Promise<void> => {
  try {
    const updateData: any = {
      subscription_active: isActive,
      updated_at: new Date().toISOString(),
    };

    // Only update subscription_type if it's not null
    if (subscriptionType !== null) {
      updateData.subscription_type = subscriptionType;
    }

    const { error } = await supabase
      .from('artists')
      .update(updateData)
      .eq('id', artistId);

    if (error) {
      throw new Error(`Failed to update subscription status: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
};

// Get artist profile with subscription details - optimized with retry and caching
export const getArtistProfile = async (artistId: string): Promise<Artist | null> => {
  const { data: artistData, error: artistError } = await supabase
    .rpc('get_artist_full_data', { artist_uuid: artistId });

  if (artistError) {
    console.error('Error fetching artist profile:', artistError);
    console.error('Error details:', {
      code: artistError.code,
      message: artistError.message,
      details: artistError.details,
      hint: artistError.hint
    });

    // Check if it's a "no rows returned" error (PGRST116)
    if (artistError.code === 'PGRST116') {
      return null;
    }

    // Check if it's an RLS policy issue (42501) or permission denied (PGRST301)
    if (artistError.code === '42501' || artistError.code === 'PGRST301') {
      console.error('Permission denied - artist may not have access to this data yet. This can happen immediately after signup.');
      return null;
    }

    throw new Error(`Failed to get artist profile: ${artistError.message}`);
  }

  if (!artistData || artistData.length === 0) {
    return null;
  }

  const artist = artistData[0];

  // Transform the data to match the Artist interface
  return {
    id: artist.artist_id,
    email: artist.email,
    full_name: artist.full_name,
    photo: artist.photo,
    avatar: artist.avatar,
    booking_link: artist.booking_link,
    qr_code_url: artist.qr_code_url,
    temp: artist.temp,
    studio_name: artist.studio_name,
    social_handler: artist.social_handler,
    subscription_active: artist.subscription_active,
    subscription_type: artist.subscription_type,
    subscription: artist.subscription || undefined,
    app: artist.app || undefined,
    rule: artist.rule || undefined,
    flow: artist.flow || undefined,
    template: artist.template || undefined,
    locations: artist.locations || undefined
  };
};

export const getClientProfile = async (clientId: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, full_name, email, phone_number, location, links!inner(artist_id, status, artist:artists(*))')
      .eq('id', clientId)
      .single();

    if (!data) {
      return null;
    }

    if (error) {
      console.error('Error getting client profile:', error);
      return null;
    }

    return data as unknown as Client;
  } catch (error) {
    console.error('Error getting client profile:', error);
    return null;
  }
}

// Get artist subscription details
export const getSubscription = async (artistId: string): Promise<Subscriptions | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('artist_id', artistId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw new Error(`Failed to get artist subscription: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting artist subscription:', error);
    return null;
  }
};

// Sign out user
export const signOutArtist = async (): Promise<{ error: any }> => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

// Get current artist
export const getCurrentArtist = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return {
      user: data?.session?.user || null,
      session: data?.session || null,
      error
    };
  } catch (error) {
    console.error('Get current artist error:', error);
    return { user: null, session: null, error };
  }
};

// Check if artist's subscription is still valid (not expired)
export const checkSubscriptionExpiry = async (artistId: string): Promise<boolean> => {
  try {

    const { data, error } = await supabase
      .from('subscriptions')
      .select('expiry_date, is_active')
      .eq('artist_id', artistId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();


    if (error) {
      console.error('Error checking subscription expiry:', error);
      return false;
    }

    if (!data) {
      // No active subscription found
      return false;
    }

    const expiryDate = new Date(data.expiry_date);
    const now = new Date();
    const isValid = now <= expiryDate && data.is_active;


    if (!isValid) {
      // Subscription expired, update artist's subscription status
      await updateSubscriptionStatus(artistId, null, false);
    }

    return isValid;
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    return false;
  }
};

// Create artist profile from Supabase Auth user data
export const createArtistProfileFromAuth = async (authUser: any): Promise<Artist | null> => {
  try {

    const profileData = {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Artist',
      subscription_active: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('artists')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Error creating artist profile:', error);
      throw new Error(`Failed to create artist profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating artist profile from auth:', error);
    return null;
  }
};

// Get artist's current app mode based on authentication and subscription status - optimized with timeout
export const getArtistAppMode = async (artistId: string): Promise<'preview' | 'production'> => {
  return safeAsync(
    () => withRetryAndTimeout(
      async () => {
        const isSubscriptionValid = await checkSubscriptionExpiry(artistId);
        return isSubscriptionValid ? 'production' : 'preview';
      },
      { maxRetries: 2, baseDelay: 500 },
      { timeoutMs: 8000, timeoutMessage: 'Subscription check timeout' }
    ),
    'preview',
    (error) => console.error('Failed to get artist app mode:', error)
  );
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Check if a booking link suffix is available
export const checkBookingLinkAvailability = async (
  bookingLinkSuffix: string,
  currentArtistId?: string
): Promise<{ isAvailable: boolean; error?: string }> => {
  if (!bookingLinkSuffix.trim()) {
    return { isAvailable: false, error: 'Booking link cannot be empty' };
  }

  try {
    const fullBookingLink = buildFullBookingLink(BASE_URL, bookingLinkSuffix);

    // Build query to exclude current artist if provided
    let query = supabase
      .from('artists')
      .select('id')
      .eq('booking_link', fullBookingLink);

    // Exclude current artist from the check
    if (currentArtistId) {
      query = query.neq('id', currentArtistId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking booking link:', error);
      return {
        isAvailable: false,
        error: 'Failed to check booking link availability'
      };
    }

    if (data) {
      return {
        isAvailable: false,
        error: 'This booking link is already in use'
      };
    }

    return { isAvailable: true };
  } catch (error) {
    console.error('Unexpected error checking booking link:', error);
    return {
      isAvailable: false,
      error: 'An unexpected error occurred'
    };
  }
};

export const getArtistLocations = async (artistId: string): Promise<Locations[] | null> => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('artist_id', artistId);

    if (error) {
      console.error('Error getting artist locations:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting artist locations:', error);
    return null;
  }
}