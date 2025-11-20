import { supabase } from '../supabase';
import { 
  FAQCategory, 
  CreateFAQCategoryData, 
  UpdateFAQCategoryData,
  FAQItem,
  CreateFAQItemData,
  UpdateFAQItemData,
  FAQCategoryWithItems
} from '../types';

export interface FAQServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get all FAQ categories with their items for the current artist
export const getArtistFAQs = async (artistId: string): Promise<FAQServiceResult<FAQCategoryWithItems[]>> => {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
      .select(`
        *,
        faq_items (*)
      `)
      .eq('artist_id', artistId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
      return {
        success: false,
        error: `Failed to fetch FAQs: ${error.message}`
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error in getArtistFAQs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Create a new FAQ category
export const createFAQCategory = async (
  artistId: string, 
  categoryData: CreateFAQCategoryData
): Promise<FAQServiceResult<FAQCategory>> => {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
      .insert({
        artist_id: artistId,
        category_name: categoryData.category_name
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ category:', error);
      return {
        success: false,
        error: `Failed to create FAQ category: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in createFAQCategory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Update an existing FAQ category
export const updateFAQCategory = async (
  categoryId: string,
  categoryData: UpdateFAQCategoryData
): Promise<FAQServiceResult<FAQCategory>> => {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
      .update({
        category_name: categoryData.category_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ category:', error);
      return {
        success: false,
        error: `Failed to update FAQ category: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in updateFAQCategory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Delete an FAQ category (this will also delete all FAQ items in the category due to CASCADE)
export const deleteFAQCategory = async (categoryId: string): Promise<FAQServiceResult<void>> => {
  try {
    const { error } = await supabase
      .from('faq_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting FAQ category:', error);
      return {
        success: false,
        error: `Failed to delete FAQ category: ${error.message}`
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteFAQCategory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Create a new FAQ item
export const createFAQItem = async (
  itemData: CreateFAQItemData
): Promise<FAQServiceResult<FAQItem>> => {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .insert({
        category_id: itemData.category_id,
        question: itemData.question,
        answer: itemData.answer
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ item:', error);
      return {
        success: false,
        error: `Failed to create FAQ item: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in createFAQItem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Update an existing FAQ item
export const updateFAQItem = async (
  itemId: string,
  itemData: UpdateFAQItemData
): Promise<FAQServiceResult<FAQItem>> => {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .update({
        question: itemData.question,
        answer: itemData.answer,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ item:', error);
      return {
        success: false,
        error: `Failed to update FAQ item: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in updateFAQItem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Delete an FAQ item
export const deleteFAQItem = async (itemId: string): Promise<FAQServiceResult<void>> => {
  try {
    const { error } = await supabase
      .from('faq_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting FAQ item:', error);
      return {
        success: false,
        error: `Failed to delete FAQ item: ${error.message}`
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteFAQItem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
