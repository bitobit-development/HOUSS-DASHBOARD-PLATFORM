import { createClient } from '@supabase/supabase-js';

// Replace these values with your actual Supabase project URL and API key
const supabaseUrl = 'https://cjtddlxcwwvoflelgwwc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdGRkbHhjd3d2b2ZsZWxnd3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTQ3MDMsImV4cCI6MjA1OTI3MDcwM30.MokPdnLXk9ORymjKsvAYcn7tN-HO6gmdrLJn7AgXsc8';

export const supabase = createClient(supabaseUrl, supabaseKey);
