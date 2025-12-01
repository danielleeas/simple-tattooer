export interface FAQCategory {
  id: string;
  artist_id: string;
  category_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFAQCategoryData {
  category_name: string;
}

export interface UpdateFAQCategoryData {
  category_name?: string;
}

export interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFAQItemData {
  category_id: string;
  question: string;
  answer: string;
}

export interface UpdateFAQItemData {
  question?: string;
  answer?: string;
}

export interface FAQCategoryWithItems extends FAQCategory {
  faq_items: FAQItem[];
}

export interface AftercareTip {
  id: string;
  artist_id: string;
  title: string;
  instructions: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAftercareTipData {
  title: string;
  instructions: string;
}

export interface UpdateAftercareTipData {
  title?: string;
  instructions?: string;
}

export interface ArtistFlash {
  id: string;
  artist_id: string;
  flash_name: string;
  flash_image: string;
  flash_price: number;
  repeatable: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFlashData {
  flash_name: string;
  flash_image: string;
  flash_price: number;
  repeatable: boolean;
}

export interface UpdateFlashData {
  flash_name?: string;
  flash_image?: string;
  flash_price?: number;
  repeatable?: boolean;
}

export interface ArtistPortfolio {
  id: string;
  artist_id: string;
  portfolio_name: string;
  portfolio_image: string;
  portfolio_description: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePortfolioData {
  portfolio_name: string;
  portfolio_image: string;
  portfolio_description: string;
}

export interface UpdatePortfolioData {
  portfolio_name?: string;
  portfolio_image?: string;
  portfolio_description?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  senderName: string;
  timestamp: string;
  date: Date;
  isRead?: boolean;
  avatar?: string;
}