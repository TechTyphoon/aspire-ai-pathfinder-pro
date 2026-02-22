#!/bin/bash
# Supabase Keep-Alive Script
# Prevents free tier projects from auto-pausing after 7 days of inactivity
# Run this via cron every 3 days

SUPABASE_URL="${SUPABASE_URL:?SUPABASE_URL env var is required}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY env var is required}"

echo "[$(date)] Pinging Supabase to prevent auto-pause..."

# Simple health check - just hit the REST API
response=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

if [ "$response" = "200" ]; then
  echo "[$(date)] ✅ Supabase is alive (HTTP $response)"
else
  echo "[$(date)] ⚠️ Supabase returned HTTP $response"
fi
