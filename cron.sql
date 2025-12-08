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

-- Function to send deposit reminder emails via HTTP request
-- This can be called directly or scheduled via pg_cron
-- 
-- Prerequisites:
-- 1. Enable pg_net extension: CREATE EXTENSION IF NOT EXISTS pg_net;
-- 2. Ensure the API endpoint /api/deposit-reminder-email exists and is accessible
-- 3. Projects table must have send_reminder_email column (BOOLEAN, default FALSE)
create or replace function send_deposit_reminder_email()
returns text as $$
declare
  project_record record;
  deposit_remind_hours int;
  deposit_hold_hours int;
  client_email text;
  client_name text;
  artist_name text;
  artist_avatar text;
  template_subject text;
  template_body text;
  request_body text;
  deadline_timestamp timestamp with time zone;
  deadline_formatted text;
  base_url text := 'https://simpletattooer.com';
  http_response record;
  project_count int := 0;
  processed_count int := 0;
  remind_deadline timestamp with time zone;
  time_until_remind interval;
  -- Time compression for testing: 1 hour = 1 minute
  -- Set to true to enable time compression, false for production
  enable_time_compression boolean := true;
  time_unit text;
  
  -- Variable to collect logs
  log_output text := '';
  http_req_id bigint;
begin
  -- Set time unit based on compression setting
  if enable_time_compression then
    time_unit := 'minutes';  -- 1 hour = 1 minute for testing
  else
    time_unit := 'hours';     -- Normal production mode
  end if;

  -- Find all projects where:
  -- 1. deposit_paid = false
  -- 2. send_reminder_email = false (hasn't been sent yet)
  -- 3. The reminder time has expired based on project.created_at + deposit_remind_time
  
  -- Count projects that match criteria for debugging
  select count(*) into project_count
  from projects p
  where p.deposit_paid = false
    and (p.send_reminder_email = false or p.send_reminder_email is null);
  
  log_output := log_output || format('Found %s matching projects.', project_count) || E'\n';
  
  for project_record in
    select 
      p.id as project_id,
      p.artist_id, 
      p.client_id,
      p.created_at,
      p.title,
      p.deposit_amount
    from projects p
    where p.deposit_paid = false
      and (p.send_reminder_email = false or p.send_reminder_email is null)
  loop
    log_output := log_output || format('Processing Project %s', project_record.project_id) || E'\n';
    
    -- Get deposit_remind_time and deposit_hold_time from rules for this artist
    select r.deposit_remind_time, r.deposit_hold_time 
    into deposit_remind_hours, deposit_hold_hours
    from rules r
    where r.artist_id = project_record.artist_id
    limit 1;

    -- If no remind time configured, use default 12 hours
    if deposit_remind_hours is null or deposit_remind_hours <= 0 then
      deposit_remind_hours := 12;
    end if;

    -- If no hold time configured, use default 24 hours
    if deposit_hold_hours is null or deposit_hold_hours <= 0 then
      deposit_hold_hours := 24;
    end if;

    -- Check if remind time has expired
    -- Use project.created_at as the start time for the remind period
    -- With time compression: 12 hours becomes 12 minutes
    remind_deadline := project_record.created_at + (deposit_remind_hours || ' ' || time_unit)::interval;
    time_until_remind := remind_deadline - now();
    
    log_output := log_output || format('  - Remind Deadline: %s (Now: %s)', remind_deadline, now()) || E'\n';
    
    if remind_deadline <= now() then
      processed_count := processed_count + 1;
      log_output := log_output || '  - Deadline reached. Preparing email...' || E'\n';
      
      -- Get client email and name
      select c.email, c.full_name into client_email, client_name
      from clients c
      where c.id = project_record.client_id
      limit 1;

      -- Skip if no client email
      if client_email is null or client_email = '' then
        log_output := log_output || '  - SKIP: No client email.' || E'\n';
        continue;
      end if;

      -- Get artist avatar and name
      select a.full_name, a.avatar into artist_name, artist_avatar
      from artists a
      where a.id = project_record.artist_id
      limit 1;

      -- Calculate deadline: project.created_at + deposit_hold_time
      deadline_timestamp := project_record.created_at + (deposit_hold_hours || ' ' || 'hours')::interval;
      
      -- Convert to Pacific Standard Time (PST/PDT)
      -- Format deadline as "YYYY-MM-DD H:MM AM/PM" (e.g., "2025-12-15 4:00 PM")
      deadline_formatted := to_char(
        deadline_timestamp AT TIME ZONE 'America/Los_Angeles',
        'YYYY-MM-DD FMHH12:MI AM'
      );

      -- Get template subject and body from templates table
      select 
        t.deposit_payment_reminder_subject,
        t.deposit_payment_reminder_body
      into template_subject, template_body
      from templates t
      where t.artist_id = project_record.artist_id
      limit 1;

      -- Use defaults if template not found
      if template_subject is null or template_subject = '' then
        template_subject := 'Deposit still needed to confirm your date';
      end if;
      if template_body is null or template_body = '' then
        template_body := E'Hi [Client First Name],\n\nHey! Just a quick nudge — your deposit hasn''t come through yet.\nPlease pay by [deadline] to keep your spot.';
      end if;

      --------------------------------------------------------------------
      -- Send email via pg_net HTTP request
      -- Using net.http_post which returns a request ID, then we must query http_request_queue
      --------------------------------------------------------------------

      -- Build request body as JSON text (matches your Postman/cURL example)
      request_body := json_build_object(
        'to', client_email,
        'email_templates', json_build_object(
          'subject', template_subject,
          'body', template_body
        ),
        'avatar_url', coalesce(artist_avatar, ''),
        'variables', json_build_object(
          'Your Name', coalesce(artist_name, ''),
          'Client First Name', coalesce(split_part(client_name, ' ', 1), ''),
          'deadline', deadline_formatted
        )
      )::text;

      -- Call HTTP endpoint via pg_net
      -- NOTE: pg_net.http_post returns an integer (id), not a record with status_code directly
      -- The request is asynchronous.
      begin
        select net.http_post(
          url := base_url || '/api/deposit-reminder-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'to', client_email,
            'email_templates', json_build_object(
                'subject', template_subject,
                'body', template_body
            ),
            'avatar_url', coalesce(artist_avatar, ''),
            'variables', json_build_object(
                'Your Name', coalesce(artist_name, ''),
                'Client First Name', coalesce(split_part(client_name, ' ', 1), ''),
                'deadline', deadline_formatted
            )
          )
        ) into http_req_id;

        log_output := log_output || format('  - HTTP Request Queued. ID: %s', http_req_id) || E'\n';
        
        -- Since pg_net is async, we can't immediately check the status code synchronously in the same transaction easily
        -- without a sleep loop which is bad practice in triggers/functions.
        -- HOWEVER, for this cron job, we will assume success for the queuing and mark as sent
        -- OR strictly we should have a separate process check the status. 
        -- For simplicity here: We'll mark it as sent so we don't spam.
        -- If it fails, we'd need a separate mechanism to retry.
        
        update projects
        set send_reminder_email = true
        where id = project_record.project_id;
        
        log_output := log_output || '  - SUCCESS: DB updated (Email queued).' || E'\n';

      exception when others then
        -- Log error but don't block other projects
        log_output := log_output || format('  - EXCEPTION: %s (SQLSTATE: %s)', sqlerrm, sqlstate) || E'\n';
      end;
    else
      log_output := log_output || '  - Not yet time to remind.' || E'\n';
    end if;
  end loop;
  
  return log_output;
end;
$$ language plpgsql security definer;
