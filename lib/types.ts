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