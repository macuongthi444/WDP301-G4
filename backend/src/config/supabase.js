// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;          // https://abcxyz.supabase.co
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;