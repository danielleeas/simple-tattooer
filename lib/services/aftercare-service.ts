import { supabase } from '../supabase';
import { 
  AftercareTip, 
  CreateAftercareTipData, 
  UpdateAftercareTipData
} from '../types';

export interface AftercareServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get all aftercare tips for the current artist
export const getArtistAftercareTips = async (artistId: string): Promise<AftercareServiceResult<AftercareTip[]>> => {
  try {
    const { data, error } = await supabase
      .from('aftercare_tips')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching aftercare tips:', error);
      return {
        success: false,
        error: `Failed to fetch aftercare tips: ${error.message}`
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error in getArtistAftercareTips:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Create a new aftercare tip
export const createAftercareTip = async (
  artistId: string, 
  tipData: CreateAftercareTipData
): Promise<AftercareServiceResult<AftercareTip>> => {
  try {
    const { data, error } = await supabase
      .from('aftercare_tips')
      .insert({
        artist_id: artistId,
        title: tipData.title,
        instructions: tipData.instructions
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating aftercare tip:', error);
      return {
        success: false,
        error: `Failed to create aftercare tip: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in createAftercareTip:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Update an existing aftercare tip
export const updateAftercareTip = async (
  tipId: string,
  tipData: UpdateAftercareTipData
): Promise<AftercareServiceResult<AftercareTip>> => {
  try {
    const { data, error } = await supabase
      .from('aftercare_tips')
      .update({
        title: tipData.title,
        instructions: tipData.instructions,
        updated_at: new Date().toISOString()
      })
      .eq('id', tipId)
      .select()
      .single();

    if (error) {
      console.error('Error updating aftercare tip:', error);
      return {
        success: false,
        error: `Failed to update aftercare tip: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in updateAftercareTip:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Delete an aftercare tip
export const deleteAftercareTip = async (tipId: string): Promise<AftercareServiceResult<void>> => {
  try {
    const { error } = await supabase
      .from('aftercare_tips')
      .delete()
      .eq('id', tipId);

    if (error) {
      console.error('Error deleting aftercare tip:', error);
      return {
        success: false,
        error: `Failed to delete aftercare tip: ${error.message}`
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteAftercareTip:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
