/*
  # Remove Obsolete Illustration Queue CRON Job

  1. Changes
    - Unschedule the 'process-illustration-queue' CRON job
    - The illustration system now uses direct generation instead of queue processing
    - This CRON job was running every 2 minutes but is no longer needed
  
  2. Notes
    - Safe to run: If CRON job doesn't exist, unschedule will simply do nothing
    - This migration cleans up the automated processing system that has been superseded
*/

-- Unschedule the illustration queue processing CRON job
SELECT cron.unschedule('process-illustration-queue')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-illustration-queue'
);
