create or replace function default_hold_time()
returns trigger as $$
declare
  delay_hours int := 24;  -- fallback
  delay_interval interval;
begin
  -- Read dynamic delay from settings table
  select (value::int) into delay_hours
  from settings
  where key = 'default_hold_time'
  limit 1;

  -- If no setting found, use 24h as safe default
  if delay_hours is null or delay_hours <= 0 then
    delay_hours := 24;
  end if;

  delay_interval := (delay_hours || ' hours')::interval;

  -- Only schedule if reminder not already sent
  if NEW.reminder_sent = false or NEW.reminder_sent is null then
    perform net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-quote-reminder',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_ANON_KEY',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'quote_id', NEW.id,
        'user_email', NEW.user_email,
        'user_name', NEW.user_name
      ),
      timeout_milliseconds := 30000
    ) with delay delay_interval;  -- THIS IS NOW DYNAMIC
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Function to remove expired lock events when deposit is not paid
-- This can be called directly or scheduled via pg_cron
create or replace function remove_expired_lock_events()
returns void as $$
declare
  session_record record;
  deposit_hold_hours int;
begin
  -- Find all lock events where:
  -- 1. The associated session's project has deposit_paid = false
  -- 2. The hold time has expired based on project.created_at + deposit_hold_time
  
  for session_record in
    select distinct s.id as session_id, s.project_id, p.artist_id, p.created_at as project_created_at
    from events e
    join sessions s on s.id = e.source_id::uuid
    join projects p on s.project_id = p.id
    where e.source = 'lock'
      and p.deposit_paid = false
  loop
    -- Get deposit_hold_time from rules for this artist
    select r.deposit_hold_time into deposit_hold_hours
    from rules r
    where r.artist_id = session_record.artist_id
    limit 1;

    -- If no hold time configured, use default 24 hours
    if deposit_hold_hours is null or deposit_hold_hours <= 0 then
      deposit_hold_hours := 24;
    end if;

    -- Check if hold time has expired
    -- Use project.created_at as the start time for the hold period
    if session_record.project_created_at + (deposit_hold_hours || ' hours')::interval <= now() then
      -- Remove lock events for this session directly in the database
      delete from events
      where source = 'lock'
        and source_id = session_record.session_id::text;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- HOW TO USE: Setting up automatic lock removal with pg_cron
-- ============================================================================
--
-- STEP 1: Enable pg_cron extension (if not already enabled)
-- Run this in your Supabase SQL Editor:
--
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- STEP 2: Schedule the cleanup job
-- Run this to schedule automatic cleanup every hour:
--
--   SELECT cron.schedule(
--     'remove-expired-locks',
--     '0 * * * *',  -- Cron schedule: Every hour at minute 0
--     $$SELECT remove_expired_lock_events()$$
--   );
--
-- Alternative schedules:
--   '*/30 * * * *'  -- Every 30 minutes
--   '0 */2 * * *'   -- Every 2 hours
--   '0 0 * * *'     -- Once daily at midnight
--
-- STEP 3: Verify the job is scheduled
--   SELECT * FROM cron.job WHERE jobname = 'remove-expired-locks';
--
-- STEP 4: View job execution history
--   SELECT * FROM cron.job_run_details 
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'remove-expired-locks')
--   ORDER BY start_time DESC LIMIT 10;
--
-- To unschedule/remove the job:
--   SELECT cron.unschedule('remove-expired-locks');
--
-- ============================================================================
-- ALTERNATIVE: Manual execution (without cron)
-- ============================================================================
--
-- You can also call the function manually from your application:
--
--   import { removeExpiredLockEvents } from './lib/services/booking-service';
--   await removeExpiredLockEvents();
--
-- Or directly via SQL:
--
--   SELECT remove_expired_lock_events();
--
-- ============================================================================