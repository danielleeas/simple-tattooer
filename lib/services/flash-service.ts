import { supabase } from '../supabase';
import { ArtistFlash, CreateFlashData, UpdateFlashData } from '../types';

export interface FlashServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get all flashs for the current artist
export const getArtistFlashs = async (artistId: string): Promise<FlashServiceResult<ArtistFlash[]>> => {
  try {
    const { data, error } = await supabase
      .from('artist_flashs')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching flashs:', error);
      return {
        success: false,
        error: `Failed to fetch flashs: ${error.message}`
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error in getArtistFlashs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Create a new flash
export const createFlash = async (
  artistId: string, 
  flashData: CreateFlashData
): Promise<FlashServiceResult<ArtistFlash>> => {
  try {
    const { data, error } = await supabase
      .from('artist_flashs')
      .insert({
        artist_id: artistId,
        flash_name: flashData.flash_name,
        flash_image: flashData.flash_image,
        flash_price: flashData.flash_price,
        repeatable: flashData.repeatable
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating flash:', error);
      return {
        success: false,
        error: `Failed to create flash: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in createFlash:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Update an existing flash
export const updateFlash = async (
  flashId: string,
  flashData: UpdateFlashData
): Promise<FlashServiceResult<ArtistFlash>> => {
  try {
    const { data, error } = await supabase
      .from('artist_flashs')
      .update({
        ...flashData,
        updated_at: new Date().toISOString()
      })
      .eq('id', flashId)
      .select()
      .single();

    if (error) {
      console.error('Error updating flash:', error);
      return {
        success: false,
        error: `Failed to update flash: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in updateFlash:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Bulk upsert flashes by id (updates existing rows; inserts if unknown ids are provided)
export const upsertFlashes = async (
  artistId: string,
  updates: Array<{ id: string; flash_image: string } & UpdateFlashData>
): Promise<FlashServiceResult<ArtistFlash[]>> => {
  try {
    const rows = updates.map((u) => ({
      id: u.id,
      artist_id: artistId,
      // Only include fields that may change; undefined fields are ignored by Supabase
      flash_name: u.flash_name,
      flash_image: u.flash_image,
      flash_price: u.flash_price,
      repeatable: u.repeatable,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('artist_flashs')
      .upsert(rows, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Error bulk upserting flashes:', error);
      return {
        success: false,
        error: `Failed to save flashes: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error in upsertFlashes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Delete a flash
export const deleteFlash = async (flashId: string): Promise<FlashServiceResult> => {
  try {
    const { error } = await supabase
      .from('artist_flashs')
      .delete()
      .eq('id', flashId);

    if (error) {
      console.error('Error deleting flash:', error);
      return {
        success: false,
        error: `Failed to delete flash: ${error.message}`
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteFlash:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Get a single flash by ID
export const getFlashById = async (flashId: string): Promise<FlashServiceResult<ArtistFlash>> => {
  try {
    const { data, error } = await supabase
      .from('artist_flashs')
      .select('*')
      .eq('id', flashId)
      .single();

    if (error) {
      console.error('Error fetching flash:', error);
      return {
        success: false,
        error: `Failed to fetch flash: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in getFlashById:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
