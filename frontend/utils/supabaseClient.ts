import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Client ini HANYA digunakan untuk Realtime Broadcast (relay pesan chat).
// TIDAK ada operasi database Supabase yang dilakukan — semua data chat
// disimpan di MySQL cPanel melalui REST API backend.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
