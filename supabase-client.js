// js/supabase-client.js
const SUPABASE_URL = 'https://ppykhzpnueyxdnxkxeqo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7qx8s8PvuJ-GyNhz2cD-sw_9yNPI2ku';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    // Força o envio da chave APENAS no header 'apikey',
    // evitando que o SDK a coloque no 'Authorization' e quebre o parse do JWT.
    headers: {
      apikey: SUPABASE_ANON_KEY
    }
  }
});

window.db = db;