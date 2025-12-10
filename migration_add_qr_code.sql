-- Migration to add QR code URL column to artists table
-- Run this migration on your Supabase database if you already have the artists table created

-- Add qr_code_url column to artists table
ALTER TABLE artists ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Update the get_artist_full_data function to include qr_code_url
CREATE OR REPLACE FUNCTION get_artist_full_data(artist_uuid UUID)
RETURNS TABLE (
  artist_id UUID,
  email TEXT,
  full_name TEXT,
  photo TEXT,
  avatar TEXT,
  studio_name TEXT,
  booking_link TEXT,
  qr_code_url TEXT,
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
    a.qr_code_url,
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

-- Update the get_artist_by_booking_link function to include qr_code_url
CREATE OR REPLACE FUNCTION get_artist_by_booking_link(booking_link_param TEXT)
RETURNS TABLE (
  artist_id UUID,
  email TEXT,
  full_name TEXT,
  photo TEXT,
  avatar TEXT,
  studio_name TEXT,
  booking_link TEXT,
  qr_code_url TEXT,
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
    a.qr_code_url,
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
  WHERE LOWER(a.booking_link) = LOWER(booking_link_param);
END;
$$ LANGUAGE plpgsql;
