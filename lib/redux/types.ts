export interface SignupData {
    email: string;
    password: string;
    name: string;
}

export interface Artist {
    id: string;
    email: string;
    full_name: string;
    photo: string;
    avatar: string;
    booking_link: string;
    studio_name: string;
    social_handler: string;
    subscription_active: boolean;
    subscription_type?: string;
    subscription?: Subscriptions;
    app?: Apps;
    rule?: Rules;
    flow?: Flows;
    template?: Templates;
    locations?: Locations[];
}

interface SimpleArtist {
    id: string;
    email: string;
    full_name: string;
    photo: string;
    avatar: string;
    booking_link: string;
    studio_name: string;
    social_handler: string;
    subscription_active: boolean;
    subscription_type?: string;
}

export interface Client {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    location?: string;
    links?: {
        artist_id: string;
        status: string;
        artist: SimpleArtist;
    }[];
}

export interface Subscriptions {
    id: string;
    artist_id: string;
    subscription_type: 'monthly' | 'yearly';
    product_id: string;
    transaction_id: string;
    purchase_date: string;
    expiry_date: string;
    receipt_data: string;
    purchase_token?: string;
    data_android?: string;
    signature_android?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Apps {
    watermark_image?: string;
    watermark_text?: string;
    watermark_position?: string;
    watermark_opacity?: number;
    watermark_enabled?: boolean;
    welcome_screen_enabled?: boolean;
    swipe_navigation?: boolean;
    calendar_sync?: boolean;
    push_notifications?: boolean;
}

export interface Rules {
    deposit_amount?: number;
    deposit_hold_time?: number;
    deposit_remind_time?: number;
    paypal_enabled?: boolean;
    paypal_method?: string;
    etransfer_enabled?: boolean;
    etransfer_method?: string;
    creditcard_enabled?: boolean;
    creditcard_method?: string;
    venmo_enabled?: boolean;
    venmo_method?: string;
    deposit_policy?: string;
    cancellation_policy?: string;
    reschedule_policy?: string;
    question_one?: string;
    question_two?: string;
    waiver_text?: string;
    privacy_policy?: string;
    terms_of_condition?: string;
}

export interface Flows {
    work_days?: string[];
    diff_time_enabled?: boolean;
    start_times?: Record<string, string>;
    end_times?: Record<string, string>;
    consult_enabled?: boolean;
    consult_in_person?: boolean;
    consult_online?: boolean;
    consult_duration?: number;
    consult_work_days?: string[];
    diff_consult_time_enabled?: boolean;
    consult_start_times?: Record<string, string[]>;
    consult_meeting_url?: string;
    multiple_sessions_enabled?: boolean;
    sessions_per_day?: number;
    session_duration?: number;
    break_time?: number;
    back_to_back_enabled?: boolean;
    max_back_to_back?: number;
    buffer_between_sessions?: number;
    send_drawings_in_advance?: boolean;
    receive_drawing_time?: number;
    change_policy_time?: number;
    final_appointment_remind_time?: number;
    auto_email?: boolean;
    auto_fill_drawing_enabled?: boolean;
    max_reschedules?: number;
    reschedule_booking_days?: number;
}

export interface Templates {
    new_booking_request_received_subject?: string;
    new_booking_request_received_body?: string;
    booking_request_approved_auto_subject?: string;
    booking_request_approved_auto_body?: string;
    booking_request_approved_manual_subject?: string;
    booking_request_approved_manual_body?: string;
    declined_booking_request_subject?: string;
    declined_booking_request_body?: string;
    deposit_payment_reminder_subject?: string;
    deposit_payment_reminder_body?: string;
    deposit_forfeit_subject?: string;
    deposit_forfeit_body?: string;
    deposit_keep_subject?: string;
    deposit_keep_body?: string;
    consult_confirmation_subject?: string;
    consult_confirmation_body?: string;
    consult_reminder_subject?: string;
    consult_reminder_body?: string;
    consult_declined_subject?: string;
    consult_declined_body?: string;
    appointment_confirmation_no_profile_subject?: string;
    appointment_confirmation_no_profile_body?: string;
    appointment_confirmation_with_profile_subject?: string;
    appointment_confirmation_with_profile_body?: string;
    appointment_final_confirmation_subject?: string;
    appointment_final_confirmation_body?: string;
    waiver_reminder_subject?: string;
    waiver_reminder_body?: string;
    healing_check_in_subject?: string;
    healing_check_in_body?: string;
    cancellation_notification_subject?: string;
    cancellation_notification_body?: string;
}

export interface Locations {
    id?: string;
    address: string;
    place_id: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    is_main_studio: boolean;
    source?: string;
    source_id?: string;
    source_end?: string;
}