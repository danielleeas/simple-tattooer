-- Enable necessary extensions for Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  photo TEXT,
  avatar TEXT,
  booking_link TEXT UNIQUE NOT NULL,
  studio_name TEXT,
  social_handler TEXT,
  subscription_active BOOLEAN DEFAULT FALSE,
  subscription_type TEXT CHECK (subscription_type IS NULL OR subscription_type IN ('monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for artists table
CREATE INDEX IF NOT EXISTS idx_artists_subscription_active ON artists(subscription_active) WHERE subscription_active = true;
CREATE INDEX IF NOT EXISTS idx_artists_subscription_type ON artists(subscription_type) WHERE subscription_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artists_email ON artists(email);
CREATE INDEX IF NOT EXISTS idx_artists_booking_link ON artists(booking_link);
CREATE INDEX IF NOT EXISTS idx_artists_created_at ON artists(created_at);

-- User subscriptions table for storing purchase details
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly')) NOT NULL,
  product_id TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  subscribe_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  receipt_data TEXT NOT NULL,
  subscribe_token TEXT,
  data_android TEXT,
  signature_android TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_artist_id ON subscriptions(artist_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_transaction_id ON subscriptions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry_date ON subscriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_artist_active ON subscriptions(artist_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry_active ON subscriptions(expiry_date, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscribe_date ON subscriptions(subscribe_date);

-- Artist locations table for storing artist locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  place_id TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  is_main_studio BOOLEAN DEFAULT FALSE,
  source TEXT,
  source_id TEXT,
  source_end TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artist_id, address)
);

-- Optimized indexes for artist locations
CREATE INDEX IF NOT EXISTS idx_locations_artist_id ON locations(artist_id);
CREATE INDEX IF NOT EXISTS idx_locations_main_studio ON locations(artist_id, is_main_studio) WHERE is_main_studio = true;
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS idx_locations_place_id ON locations(place_id);

-- Apps table for storing app settings
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  watermark_image TEXT,
  watermark_text TEXT,
  watermark_position TEXT DEFAULT 'center' CHECK (watermark_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')),
  watermark_opacity INTEGER DEFAULT 50 CHECK (watermark_opacity BETWEEN 0 AND 100),
  watermark_enabled BOOLEAN DEFAULT FALSE,
  welcome_screen_enabled BOOLEAN DEFAULT TRUE,
  swipe_navigation BOOLEAN DEFAULT TRUE,
  calendar_sync BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for apps
CREATE INDEX IF NOT EXISTS idx_apps_artist_id ON apps(artist_id);
CREATE INDEX IF NOT EXISTS idx_apps_watermark_enabled ON apps(watermark_enabled) WHERE watermark_enabled = true;
CREATE INDEX IF NOT EXISTS idx_apps_welcome_screen_enabled ON apps(welcome_screen_enabled) WHERE welcome_screen_enabled = true;
CREATE INDEX IF NOT EXISTS idx_apps_swipe_navigation ON apps(swipe_navigation) WHERE swipe_navigation = true;
CREATE INDEX IF NOT EXISTS idx_apps_calendar_sync ON apps(calendar_sync) WHERE calendar_sync = true;
CREATE INDEX IF NOT EXISTS idx_apps_push_notifications ON apps(push_notifications) WHERE push_notifications = true;
CREATE INDEX IF NOT EXISTS idx_apps_created_at ON apps(created_at);
CREATE INDEX IF NOT EXISTS idx_apps_updated_at ON apps(updated_at);

-- Rules table for storing rules
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 100,
  deposit_hold_time INTEGER NOT NULL DEFAULT 12,
  deposit_remind_time INTEGER NOT NULL DEFAULT 12,
  paypal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  paypal_method TEXT DEFAULT '',
  etransfer_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  etransfer_method TEXT DEFAULT '',
  creditcard_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  creditcard_method TEXT DEFAULT '',
  venmo_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  venmo_method TEXT DEFAULT '',
  deposit_policy TEXT DEFAULT '',
  cancellation_policy TEXT DEFAULT '',
  reschedule_policy TEXT DEFAULT '',
  question_one TEXT DEFAULT '',
  question_two TEXT DEFAULT '',
  waiver_text TEXT,
  privacy_policy TEXT,
  terms_of_condition TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for rules
CREATE INDEX IF NOT EXISTS idx_rules_artist_id ON rules(artist_id);
CREATE INDEX IF NOT EXISTS idx_rules_deposit_amount ON rules(deposit_amount);
CREATE INDEX IF NOT EXISTS idx_rules_deposit_hold_time ON rules(deposit_hold_time);
CREATE INDEX IF NOT EXISTS idx_rules_deposit_remind_time ON rules(deposit_remind_time);
CREATE INDEX IF NOT EXISTS idx_rules_paypal_enabled ON rules(paypal_enabled) WHERE paypal_enabled = true;
CREATE INDEX IF NOT EXISTS idx_rules_etransfer_enabled ON rules(etransfer_enabled) WHERE etransfer_enabled = true;
CREATE INDEX IF NOT EXISTS idx_rules_creditcard_enabled ON rules(creditcard_enabled) WHERE creditcard_enabled = true;
CREATE INDEX IF NOT EXISTS idx_rules_venmo_enabled ON rules(venmo_enabled) WHERE venmo_enabled = true;
CREATE INDEX IF NOT EXISTS idx_rules_created_at ON rules(created_at);
CREATE INDEX IF NOT EXISTS idx_rules_updated_at ON rules(updated_at);

-- Flows table for storing flow settings
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  work_days TEXT[] NOT NULL DEFAULT '{}' CHECK (work_days <@ ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  diff_time_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  start_times JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(start_times) = 'object'),
  end_times JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(end_times) = 'object'),
  consult_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  consult_in_person BOOLEAN NOT NULL DEFAULT FALSE,
  consult_online BOOLEAN NOT NULL DEFAULT FALSE,
  consult_duration INTEGER NOT NULL DEFAULT 0,
  consult_work_days TEXT[] NOT NULL DEFAULT '{}' CHECK (consult_work_days <@ ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  diff_consult_time_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  consult_start_times JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(consult_start_times) = 'object'),
  consult_meeting_url TEXT DEFAULT '',
  multiple_sessions_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sessions_per_day INTEGER NOT NULL DEFAULT 0,
  session_duration INTEGER NOT NULL DEFAULT 0,
  break_time INTEGER NOT NULL DEFAULT 0,
  back_to_back_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  max_back_to_back INTEGER NOT NULL DEFAULT 0, 
  buffer_between_sessions INTEGER NOT NULL DEFAULT 0,
  send_drawings_in_advance BOOLEAN NOT NULL DEFAULT FALSE,
  receive_drawing_time INTEGER NOT NULL DEFAULT 12,
  change_policy_time INTEGER NOT NULL DEFAULT 12,
  final_appointment_remind_time INTEGER NOT NULL DEFAULT 12,
  auto_email BOOLEAN NOT NULL DEFAULT FALSE,
  auto_fill_drawing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  max_reschedules INTEGER NOT NULL DEFAULT 0,
  reschedule_booking_days INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for flows
CREATE INDEX IF NOT EXISTS idx_flows_artist_id ON flows(artist_id);
CREATE INDEX IF NOT EXISTS idx_flows_work_days ON flows(work_days);
CREATE INDEX IF NOT EXISTS idx_flows_diff_time_enabled ON flows(diff_time_enabled) WHERE diff_time_enabled = true;
CREATE INDEX IF NOT EXISTS idx_flows_consult_enabled ON flows(consult_enabled) WHERE consult_enabled = true;
CREATE INDEX IF NOT EXISTS idx_flows_consult_in_person ON flows(consult_in_person) WHERE consult_in_person = true;
CREATE INDEX IF NOT EXISTS idx_flows_consult_online ON flows(consult_online) WHERE consult_online = true;
CREATE INDEX IF NOT EXISTS idx_flows_consult_duration ON flows(consult_duration);
CREATE INDEX IF NOT EXISTS idx_flows_consult_work_days ON flows(consult_work_days);
CREATE INDEX IF NOT EXISTS idx_flows_diff_consult_time_enabled ON flows(diff_consult_time_enabled) WHERE diff_consult_time_enabled = true;
CREATE INDEX IF NOT EXISTS idx_flows_consult_meeting_url ON flows(consult_meeting_url);
CREATE INDEX IF NOT EXISTS idx_flows_multiple_sessions_enabled ON flows(multiple_sessions_enabled) WHERE multiple_sessions_enabled = true;
CREATE INDEX IF NOT EXISTS idx_flows_sessions_per_day ON flows(sessions_per_day);
CREATE INDEX IF NOT EXISTS idx_flows_session_duration ON flows(session_duration);
CREATE INDEX IF NOT EXISTS idx_flows_break_time ON flows(break_time);
CREATE INDEX IF NOT EXISTS idx_flows_back_to_back_enabled ON flows(back_to_back_enabled) WHERE back_to_back_enabled = true;
CREATE INDEX IF NOT EXISTS idx_flows_max_back_to_back ON flows(max_back_to_back);
CREATE INDEX IF NOT EXISTS idx_flows_buffer_between_sessions ON flows(buffer_between_sessions);
CREATE INDEX IF NOT EXISTS idx_flows_send_drawings_in_advance ON flows(send_drawings_in_advance) WHERE send_drawings_in_advance = true;
CREATE INDEX IF NOT EXISTS idx_flows_receive_drawing_time ON flows(receive_drawing_time);
CREATE INDEX IF NOT EXISTS idx_flows_change_policy_time ON flows(change_policy_time);
CREATE INDEX IF NOT EXISTS idx_flows_final_appointment_remind_time ON flows(final_appointment_remind_time);
CREATE INDEX IF NOT EXISTS idx_flows_auto_email ON flows(auto_email) WHERE auto_email = true;
CREATE INDEX IF NOT EXISTS idx_flows_auto_fill_drawing_enabled ON flows(auto_fill_drawing_enabled) WHERE auto_fill_drawing_enabled = true;
CREATE INDEX IF NOT EXISTS idx_flows_max_reschedules ON flows(max_reschedules);
CREATE INDEX IF NOT EXISTS idx_flows_reschedule_booking_days ON flows(reschedule_booking_days);
CREATE INDEX IF NOT EXISTS idx_flows_created_at ON flows(created_at);
CREATE INDEX IF NOT EXISTS idx_flows_updated_at ON flows(updated_at);

-- Templates table for storing templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  new_booking_request_received_subject TEXT DEFAULT '',
  new_booking_request_received_body TEXT DEFAULT '',
  booking_request_approved_auto_subject TEXT DEFAULT '',
  booking_request_approved_auto_body TEXT DEFAULT '',
  booking_request_approved_manual_subject TEXT DEFAULT '',
  booking_request_approved_manual_body TEXT DEFAULT '',
  declined_booking_request_subject TEXT DEFAULT '',
  declined_booking_request_body TEXT DEFAULT '',
  deposit_payment_reminder_subject TEXT DEFAULT '',
  deposit_payment_reminder_body TEXT DEFAULT '',
  deposit_forfeit_subject TEXT DEFAULT '',
  deposit_forfeit_body TEXT DEFAULT '',
  deposit_keep_subject TEXT DEFAULT '',
  deposit_keep_body TEXT DEFAULT '',
  consult_confirmation_subject TEXT DEFAULT '',
  consult_confirmation_body TEXT DEFAULT '',
  consult_reminder_subject TEXT DEFAULT '',
  consult_reminder_body TEXT DEFAULT '',
  consult_declined_subject TEXT DEFAULT '',
  consult_declined_body TEXT DEFAULT '',
  appointment_confirmation_no_profile_subject TEXT DEFAULT '',
  appointment_confirmation_no_profile_body TEXT DEFAULT '',
  appointment_confirmation_with_profile_subject TEXT DEFAULT '',
  appointment_confirmation_with_profile_body TEXT DEFAULT '',
  appointment_final_confirmation_subject TEXT DEFAULT '',
  appointment_final_confirmation_body TEXT DEFAULT '',
  waiver_reminder_subject TEXT DEFAULT '',
  waiver_reminder_body TEXT DEFAULT '',
  healing_check_in_subject TEXT DEFAULT '',
  healing_check_in_body TEXT DEFAULT '',
  cancellation_notification_subject TEXT DEFAULT '',
  cancellation_notification_body TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_artist_id ON templates(artist_id);
CREATE INDEX IF NOT EXISTS idx_templates_new_booking_request_received_subject ON templates(new_booking_request_received_subject);
CREATE INDEX IF NOT EXISTS idx_templates_booking_request_approved_auto_subject ON templates(booking_request_approved_auto_subject);
CREATE INDEX IF NOT EXISTS idx_templates_booking_request_approved_manual_subject ON templates(booking_request_approved_manual_subject);
CREATE INDEX IF NOT EXISTS idx_templates_declined_booking_request_subject ON templates(declined_booking_request_subject);
CREATE INDEX IF NOT EXISTS idx_templates_deposit_payment_reminder_subject ON templates(deposit_payment_reminder_subject);
CREATE INDEX IF NOT EXISTS idx_templates_deposit_forfeit_subject ON templates(deposit_forfeit_subject);
CREATE INDEX IF NOT EXISTS idx_templates_deposit_keep_subject ON templates(deposit_keep_subject);
CREATE INDEX IF NOT EXISTS idx_templates_consult_confirmation_subject ON templates(consult_confirmation_subject);
CREATE INDEX IF NOT EXISTS idx_templates_consult_reminder_subject ON templates(consult_reminder_subject);
CREATE INDEX IF NOT EXISTS idx_templates_consult_declined_subject ON templates(consult_declined_subject);
CREATE INDEX IF NOT EXISTS idx_templates_appointment_confirmation_no_profile_subject ON templates(appointment_confirmation_no_profile_subject);
CREATE INDEX IF NOT EXISTS idx_templates_appointment_confirmation_with_profile_subject ON templates(appointment_confirmation_with_profile_subject);
CREATE INDEX IF NOT EXISTS idx_templates_appointment_final_confirmation_subject ON templates(appointment_final_confirmation_subject);
CREATE INDEX IF NOT EXISTS idx_templates_waiver_reminder_subject ON templates(waiver_reminder_subject);
CREATE INDEX IF NOT EXISTS idx_templates_healing_check_in_subject ON templates(healing_check_in_subject);
CREATE INDEX IF NOT EXISTS idx_templates_cancellation_notification_subject ON templates(cancellation_notification_subject);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_updated_at ON templates(updated_at);

-- faq Categories table for storing faq categories
CREATE TABLE IF NOT EXISTS faq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for faq categories
CREATE INDEX IF NOT EXISTS idx_faq_categories_artist_id ON faq_categories(artist_id);
CREATE INDEX IF NOT EXISTS idx_faq_categories_category_name ON faq_categories(category_name);
CREATE INDEX IF NOT EXISTS idx_faq_categories_created_at ON faq_categories(created_at);
CREATE INDEX IF NOT EXISTS idx_faq_categories_updated_at ON faq_categories(updated_at);

-- faq Categories table for storing faq categories
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for faq items
CREATE INDEX IF NOT EXISTS idx_faq_items_category_id ON faq_items(category_id);
CREATE INDEX IF NOT EXISTS idx_faq_items_question ON faq_items(question);
CREATE INDEX IF NOT EXISTS idx_faq_items_answer ON faq_items(answer);
CREATE INDEX IF NOT EXISTS idx_faq_items_created_at ON faq_items(created_at);
CREATE INDEX IF NOT EXISTS idx_faq_items_updated_at ON faq_items(updated_at);

-- aftercare tips table for storing aftercare tips
CREATE TABLE IF NOT EXISTS aftercare_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for aftercare tips
CREATE INDEX IF NOT EXISTS idx_aftercare_tips_artist_id ON aftercare_tips(artist_id);
CREATE INDEX IF NOT EXISTS idx_aftercare_tips_title ON aftercare_tips(title);
CREATE INDEX IF NOT EXISTS idx_aftercare_tips_instructions ON aftercare_tips(instructions);
CREATE INDEX IF NOT EXISTS idx_aftercare_tips_created_at ON aftercare_tips(created_at);
CREATE INDEX IF NOT EXISTS idx_aftercare_tips_updated_at ON aftercare_tips(updated_at);

-- artist Flashs table for storing artist flashs
CREATE TABLE IF NOT EXISTS artist_flashs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  flash_name TEXT,
  flash_image TEXT,
  flash_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  repeatable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for artist flashs
CREATE INDEX IF NOT EXISTS idx_artist_flashs_artist_id ON artist_flashs(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_flashs_flash_name ON artist_flashs(flash_name);
CREATE INDEX IF NOT EXISTS idx_artist_flashs_flash_image ON artist_flashs(flash_image);
CREATE INDEX IF NOT EXISTS idx_artist_flashs_flash_price ON artist_flashs(flash_price);
CREATE INDEX IF NOT EXISTS idx_artist_flashs_repeatable ON artist_flashs(repeatable) WHERE repeatable = true;
CREATE INDEX IF NOT EXISTS idx_artist_flashs_created_at ON artist_flashs(created_at);
CREATE INDEX IF NOT EXISTS idx_artist_flashs_updated_at ON artist_flashs(updated_at);

-- artist Portfolios table for storing artist portfolios
CREATE TABLE IF NOT EXISTS artist_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  portfolio_name TEXT,
  portfolio_image TEXT,
  portfolio_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for artist portfolios
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_artist_id ON artist_portfolios(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_portfolio_name ON artist_portfolios(portfolio_name);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_portfolio_image ON artist_portfolios(portfolio_image);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_portfolio_description ON artist_portfolios(portfolio_description);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_created_at ON artist_portfolios(created_at);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_updated_at ON artist_portfolios(updated_at);

-- spot convention table for storing spot conventions
CREATE TABLE IF NOT EXISTS spot_conventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  dates TEXT[] NOT NULL,
  diff_time_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  start_times JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(start_times) = 'object'),
  end_times JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(end_times) = 'object'),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for spot conventions
CREATE INDEX IF NOT EXISTS idx_spot_conventions_artist_id ON spot_conventions(artist_id);
CREATE INDEX IF NOT EXISTS idx_spot_conventions_title ON spot_conventions(title);
CREATE INDEX IF NOT EXISTS idx_spot_conventions_dates ON spot_conventions(dates);
CREATE INDEX IF NOT EXISTS idx_spot_conventions_diff_time_enabled ON spot_conventions(diff_time_enabled) WHERE diff_time_enabled = true;
CREATE INDEX IF NOT EXISTS idx_spot_conventions_location_id ON spot_conventions(location_id);
CREATE INDEX IF NOT EXISTS idx_spot_conventions_notes ON spot_conventions(notes);
CREATE INDEX IF NOT EXISTS idx_spot_conventions_created_at ON spot_conventions(created_at);
CREATE INDEX IF NOT EXISTS idx_spot_conventions_updated_at ON spot_conventions(updated_at);

-- temp changes table for storing temp changes
CREATE TABLE IF NOT EXISTS temp_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  work_days TEXT[] NOT NULL DEFAULT '{}' CHECK (work_days <@ ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  different_time_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  start_times JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(start_times) = 'object'),
  end_times JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(end_times) = 'object'),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for temp changes
CREATE INDEX IF NOT EXISTS idx_temp_changes_artist_id ON temp_changes(artist_id);
CREATE INDEX IF NOT EXISTS idx_temp_changes_start_date ON temp_changes(start_date);
CREATE INDEX IF NOT EXISTS idx_temp_changes_end_date ON temp_changes(end_date);
CREATE INDEX IF NOT EXISTS idx_temp_changes_work_days ON temp_changes(work_days);
CREATE INDEX IF NOT EXISTS idx_temp_changes_different_time_enabled ON temp_changes(different_time_enabled) WHERE different_time_enabled = true;
CREATE INDEX IF NOT EXISTS idx_temp_changes_location_id ON temp_changes(location_id);
CREATE INDEX IF NOT EXISTS idx_temp_changes_notes ON temp_changes(notes);
CREATE INDEX IF NOT EXISTS idx_temp_changes_created_at ON temp_changes(created_at);
CREATE INDEX IF NOT EXISTS idx_temp_changes_updated_at ON temp_changes(updated_at);

-- off days table for storing off days
CREATE TABLE IF NOT EXISTS off_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_repeat BOOLEAN NOT NULL DEFAULT FALSE,
  repeat_type TEXT NOT NULL DEFAULT 'daily',
  repeat_duration INTEGER NOT NULL DEFAULT 1,
  repeat_duration_unit TEXT NOT NULL DEFAULT 'weeks',
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for off days
CREATE INDEX IF NOT EXISTS idx_off_days_artist_id ON off_days(artist_id);
CREATE INDEX IF NOT EXISTS idx_off_days_title ON off_days(title);
CREATE INDEX IF NOT EXISTS idx_off_days_start_date ON off_days(start_date);
CREATE INDEX IF NOT EXISTS idx_off_days_end_date ON off_days(end_date);
CREATE INDEX IF NOT EXISTS idx_off_days_is_repeat ON off_days(is_repeat) WHERE is_repeat = true;
CREATE INDEX IF NOT EXISTS idx_off_days_repeat_type ON off_days(repeat_type);
CREATE INDEX IF NOT EXISTS idx_off_days_repeat_duration ON off_days(repeat_duration);
CREATE INDEX IF NOT EXISTS idx_off_days_repeat_duration_unit ON off_days(repeat_duration_unit);
CREATE INDEX IF NOT EXISTS idx_off_days_notes ON off_days(notes);
CREATE INDEX IF NOT EXISTS idx_off_days_created_at ON off_days(created_at);
CREATE INDEX IF NOT EXISTS idx_off_days_updated_at ON off_days(updated_at);

-- events table for storing events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  allDay BOOLEAN NOT NULL DEFAULT FALSE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  type TEXT NOT NULL DEFAULT 'item',
  source TEXT NOT NULL DEFAULT 'block_time',
  source_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for events
CREATE INDEX IF NOT EXISTS idx_events_artist_id ON events(artist_id);
CREATE INDEX IF NOT EXISTS idx_events_title ON events(title);
CREATE INDEX IF NOT EXISTS idx_events_allDay ON events(allDay) WHERE allDay = true;
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_color ON events(color);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_source_id ON events(source_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_updated_at ON events(updated_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_updated_at BEFORE UPDATE ON apps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_updated_at BEFORE UPDATE ON rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_updated_at BEFORE UPDATE ON flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get artist with all related data
CREATE OR REPLACE FUNCTION get_artist_full_data(artist_uuid UUID)
RETURNS TABLE (
  artist_id UUID,
  email TEXT,
  full_name TEXT,
  photo TEXT,
  avatar TEXT,
  studio_name TEXT,
  booking_link TEXT,
  social_handler TEXT,
  subscription_active BOOLEAN,
  subscription_type TEXT,
  subscription JSONB,
  app JSONB,
  rule JSONB,
  flow JSONB,
  template JSONB,
  locations JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.email,
    a.full_name,
    a.photo,
    a.avatar,
    a.studio_name,
    a.booking_link,
    a.social_handler,
    a.subscription_active,
    a.subscription_type,
    to_jsonb(s.*) as subscription,
    to_jsonb(p.*) as app,
    to_jsonb(r.*) as rule,
    to_jsonb(f.*) as flow,
    to_jsonb(t.*) as template,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(l.*)) 
       FROM locations l 
       WHERE l.artist_id = a.id), 
      '[]'::jsonb
    ) as locations
  FROM artists a
  LEFT JOIN subscriptions s ON s.artist_id = a.id AND s.is_active = true AND s.expiry_date > NOW()
  LEFT JOIN apps p ON p.artist_id = a.id
  LEFT JOIN rules r ON r.artist_id = a.id
  LEFT JOIN flows f ON f.artist_id = a.id
  LEFT JOIN templates t ON t.artist_id = a.id
  WHERE a.id = artist_uuid;
END;
$$ LANGUAGE plpgsql;