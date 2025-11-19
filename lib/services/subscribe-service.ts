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

// Helper function to calculate expiry date
const calculateExpiryDate = (subscriptionType: 'monthly' | 'yearly', purchaseDate?: number): string => {
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
