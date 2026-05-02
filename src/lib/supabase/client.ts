import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqzhyvggnulolrwpdfxr.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxemh5dmdnbnVsb2xyd3BkZnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTg4ODMsImV4cCI6MjA5MjI3NDg4M30.ZTs2-hv0crgKdD3LAnDryq7-xOdMPeD-JDsko7bsfZs'
  )
}
