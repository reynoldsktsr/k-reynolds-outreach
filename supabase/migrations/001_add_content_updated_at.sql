-- Run this once against an already-deployed database (Project -> SQL Editor
-- -> New query). Idempotent - safe to run more than once. A fresh database
-- created from supabase/schema.sql already has this column.
alter table businesses add column if not exists content_updated_at timestamptz;
