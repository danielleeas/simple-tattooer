-- Function to remove expired lock events when deposit is not paid
-- This can be called directly or scheduled via pg_cron
create or replace function remove_expired_lock_events()
returns void as $$
declare
  session_record record;
  deposit_hold_hours int;
  -- Time compression for testing: 1 hour = 1 minute
  -- Set to true to enable time compression, false for production
  enable_time_compression boolean := true;
  time_unit text;
begin
  -- Set time unit based on compression setting
  if enable_time_compression then
    time_unit := 'minutes';  -- 1 hour = 1 minute for testing
  else
    time_unit := 'hours';     -- Normal production mode
  end if;

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
    -- With time compression: 24 hours becomes 24 minutes
    if session_record.project_created_at + (deposit_hold_hours || ' ' || time_unit)::interval <= now() then
      -- Remove lock events for this session directly in the database
      delete from events
      where source = 'lock'
        and source_id = session_record.session_id;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

create or replace function send_deposit_reminder_email()
returns void as $$
declare
  project_record record;
  deposit_remind_hours int;
  -- Time compression for testing: 1 hour = 1 minute
  -- Set to true to enable time compression, false for production
  enable_time_compression boolean := true;
  time_unit text;
begin
  -- Set time unit based on compression setting
  if enable_time_compression then
    time_unit := 'minutes';  -- 1 hour = 1 minute for testing
  else
    time_unit := 'hours';     -- Normal production mode
  end if;

  -- Find all lock events where:
  -- 1. The associated session's project has deposit_paid = false
  -- 2. The hold time has expired based on project.created_at + deposit_hold_time
  
  for project_record in
    select distinct p.artist_id, p.created_at
    from projects p
    where p.deposit_paid = false
  loop
    -- Get deposit_hold_time from rules for this artist
    select r.deposit_remind_time into deposit_remind_hours
    from rules r
    where r.artist_id = project_record.artist_id
    limit 1;

    -- If no hold time configured, use default 24 hours
    if deposit_remind_hours is null or deposit_remind_hours <= 0 then
      deposit_remind_hours := 12;
    end if;

    -- Check if hold time has expired
    -- Use project.created_at as the start time for the hold period
    -- With time compression: 24 hours becomes 24 minutes
    if project_record.created_at + (deposit_remind_hours || ' ' || time_unit)::interval <= now() then
      -- Send deposit reminder email
      -- send_deposit_reminder_email_to_artist(project_record.artist_id);
    end if;
  end loop;
end;
$$ language plpgsql security definer;

