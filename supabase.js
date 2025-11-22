const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
    process.exit(1);
}

// Use service role key if available (bypasses RLS), otherwise use anon key
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

if (supabaseServiceRoleKey) {
    console.log('Using Supabase Service Role Key (RLS bypassed)');
} else {
    console.log('Using Supabase Anon Key (RLS enforced)');
}

module.exports = supabase;

