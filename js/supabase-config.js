// Supabase configuration and client initialization
const SUPABASE_URL = "https://nwmuxsvqwqtikwchitzi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bXV4c3Zxd3F0aWt3Y2hpdHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDEwODIsImV4cCI6MjA5MTQxNzA4Mn0.6Raqbuv7Ka-RnZQNLmSh3wJd8Dmylr7umICC-o5a4Jw";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export/Expose the client globally for our modular frontend
window.sb = _supabase;
