import { supabase } from '../supabase';
import { ArtistPortfolio, CreatePortfolioData, UpdatePortfolioData } from '../types';

export interface PortfolioServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get all portfolios for the current artist
export const getArtistPortfolios = async (artistId: string): Promise<PortfolioServiceResult<ArtistPortfolio[]>> => {
  try {
    const { data, error } = await supabase
      .from('artist_portfolios')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching portfolios:', error);
      return {
        success: false,
        error: `Failed to fetch portfolios: ${error.message}`
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error in getArtistPortfolios:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Create a new portfolio
export const createPortfolio = async (
  artistId: string, 
  portfolioData: CreatePortfolioData
): Promise<PortfolioServiceResult<ArtistPortfolio>> => {
  try {
    const { data, error } = await supabase
      .from('artist_portfolios')
      .insert({
        artist_id: artistId,
        portfolio_name: portfolioData.portfolio_name,
        portfolio_image: portfolioData.portfolio_image,
        portfolio_description: portfolioData.portfolio_description
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating portfolio:', error);
      return {
        success: false,
        error: `Failed to create portfolio: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in createPortfolio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Update an existing portfolio
export const updatePortfolio = async (
  portfolioId: string,
  portfolioData: UpdatePortfolioData
): Promise<PortfolioServiceResult<ArtistPortfolio>> => {
  try {
    const { data, error } = await supabase
      .from('artist_portfolios')
      .update({
        ...portfolioData,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId)
      .select()
      .single();

    if (error) {
      console.error('Error updating portfolio:', error);
      return {
        success: false,
        error: `Failed to update portfolio: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in updatePortfolio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Delete a portfolio
export const deletePortfolio = async (portfolioId: string): Promise<PortfolioServiceResult> => {
  try {
    const { error } = await supabase
      .from('artist_portfolios')
      .delete()
      .eq('id', portfolioId);

    if (error) {
      console.error('Error deleting portfolio:', error);
      return {
        success: false,
        error: `Failed to delete portfolio: ${error.message}`
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deletePortfolio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Get a single portfolio by ID
export const getPortfolioById = async (portfolioId: string): Promise<PortfolioServiceResult<ArtistPortfolio>> => {
  try {
    const { data, error } = await supabase
      .from('artist_portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (error) {
      console.error('Error fetching portfolio:', error);
      return {
        success: false,
        error: `Failed to fetch portfolio: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in getPortfolioById:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Bulk upsert portfolios by id (updates existing rows; inserts if unknown ids provided)
export const upsertPortfolios = async (
  artistId: string,
  updates: Array<{ id: string; portfolio_image: string } & UpdatePortfolioData>
): Promise<PortfolioServiceResult<ArtistPortfolio[]>> => {
  try {
    const rows = updates.map((u) => ({
      id: u.id,
      artist_id: artistId,
      portfolio_name: u.portfolio_name,
      portfolio_image: u.portfolio_image,
      portfolio_description: u.portfolio_description,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('artist_portfolios')
      .upsert(rows, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Error bulk upserting portfolios:', error);
      return {
        success: false,
        error: `Failed to save portfolios: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error in upsertPortfolios:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};