// mind-care/supabase-client.js
const SUPABASE_URL = 'https://ejhoyfspjhbpkorxvotg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaG95ZnNwamhicGtvcnh2b3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzQ2NDAsImV4cCI6MjEwNjUxMDY0MH0.SnZY197_jgaxpMcxqyVaSHHm_9I6UDviHNwclUbn15Y';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);