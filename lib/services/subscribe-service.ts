import { supabase } from '../supabase';
import { updateSubscriptionStatus } from './auth-service';

export interface PurchaseResult {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  subscribeToken?: string;
  dataAndroid?: string;
  signatureAndroid?: string;
}

export interface SubscriptionPurchaseResponse {
  responseCode: number;
  results: PurchaseResult[];
  errorCode?: string;
  debugMessage?: string;
}

export interface SubscriptionData {
  subscriptionType: 'monthly' | 'yearly';
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  subscribeToken?: string;
  dataAndroid?: string;
  signatureAndroid?: string;
}

// Save subscription data to Supabase (called after artist signs up)
export const saveSubscriptionToSupabase = async (artistId: string, purchaseData: any) => {
  try {
    const subscriptionData = {
      artist_id: artistId,
      subscription_type: purchaseData.subscriptionType,
      product_id: purchaseData.productId,
      transaction_id: purchaseData.transactionId,
      subscribe_date: new Date(purchaseData.transactionDate).toISOString(),
      expiry_date: calculateExpiryDate(purchaseData.subscriptionType, purchaseData.transactionDate),
      receipt_data: purchaseData.transactionReceipt,
      subscribe_token: purchaseData.subscribeToken,
      data_android: purchaseData.dataAndroid,
      signature_android: purchaseData.signatureAndroid,
      is_active: true,
    };

    // Save subscription data
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save subscription data: ${error.message}`);
    }

    // Update artist's subscription status
    await updateSubscriptionStatus(artistId, purchaseData.subscriptionType, true);

    return data;
  } catch (error) {
    console.error('Error saving subscription to Supabase:', error);
    throw error;
  }
};

// Save subscription data (new interface with better error handling)
export const saveSubscriptionData = async (
  artistId: string,
  subscriptionData: SubscriptionData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const purchaseDate = new Date(subscriptionData.transactionDate);
    const expiryDate = calculateExpiryDate(subscriptionData.subscriptionType, subscriptionData.transactionDate);

    // Insert subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        artist_id: artistId,
        subscription_type: subscriptionData.subscriptionType,
        product_id: subscriptionData.productId,
        transaction_id: subscriptionData.transactionId,
        subscribe_date: purchaseDate.toISOString(),
        expiry_date: expiryDate,
        receipt_data: subscriptionData.transactionReceipt,
        subscribe_token: subscriptionData.subscribeToken,
        data_android: subscriptionData.dataAndroid,
        signature_android: subscriptionData.signatureAndroid,
        is_active: true,
      });

    if (subscriptionError) {
      throw new Error(`Failed to save subscription: ${subscriptionError.message}`);
    }

    // Update artist's subscription status
    await updateSubscriptionStatus(artistId, subscriptionData.subscriptionType, true);

    return { success: true };
  } catch (error) {
    console.error('Error saving subscription data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Update existing subscription (for renewals and extensions)
export const updateSubscriptionData = async (
  artistId: string,
  subscriptionData: SubscriptionData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const purchaseDate = new Date(subscriptionData.transactionDate);
    const expiryDate = calculateExpiryDate(subscriptionData.subscriptionType, subscriptionData.transactionDate);

    // First, check if artist has an existing subscription
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to fetch existing subscription: ${fetchError.message}`);
    }

    if (existingSubscription) {
      // Update existing subscription record
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          subscription_type: subscriptionData.subscriptionType,
          product_id: subscriptionData.productId,
          transaction_id: subscriptionData.transactionId,
          expiry_date: expiryDate,
          receipt_data: subscriptionData.transactionReceipt,
          subscribe_token: subscriptionData.subscribeToken,
          data_android: subscriptionData.dataAndroid,
          signature_android: subscriptionData.signatureAndroid,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`);
      }
    } else {
      // Insert new subscription record (for first-time subscriptions)
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          artist_id: artistId,
          subscription_type: subscriptionData.subscriptionType,
          product_id: subscriptionData.productId,
          transaction_id: subscriptionData.transactionId,
          subscribe_date: purchaseDate.toISOString(),
          expiry_date: expiryDate,
          receipt_data: subscriptionData.transactionReceipt,
          subscribe_token: subscriptionData.subscribeToken,
          data_android: subscriptionData.dataAndroid,
          signature_android: subscriptionData.signatureAndroid,
          is_active: true,
        });

      if (insertError) {
        throw new Error(`Failed to create subscription: ${insertError.message}`);
      }
    }

    // Update artist's subscription status
    await updateSubscriptionStatus(artistId, subscriptionData.subscriptionType, true);

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to calculate expiry date
export const calculateExpiryDate = (subscriptionType: 'monthly' | 'yearly', purchaseDate?: number): string => {
  const baseDate = purchaseDate ? new Date(purchaseDate) : new Date();
  const expiryDate = new Date(baseDate);
  
  if (subscriptionType === 'monthly') {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }
  
  return expiryDate.toISOString();
};

// Validate subscription status
export const validateSubscription = async (artistId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('expiry_date, is_active')
      .eq('artist_id', artistId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return false;
    }

    const expiryDate = new Date(data.expiry_date);
    const now = new Date();

    return now <= expiryDate && data.is_active;
  } catch (error) {
    console.error('Subscription validation error:', error);
    return false;
  }
};
