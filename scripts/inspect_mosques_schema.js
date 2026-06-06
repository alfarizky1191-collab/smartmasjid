const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.');
  process.exit(2);
}

const supabase = createClient(url, key);

(async () => {
  try {
    const { data, error } = await supabase.from('mosques').select('*').limit(1).maybeSingle();
    if (error) {
      console.error('Supabase error:', error.message || error);
      process.exit(1);
    }
    if (!data) {
      console.log('No rows found in mosques table.');
      process.exit(0);
    }
    console.log('Detected columns on mosques (from one sample row):');
    Object.keys(data).forEach((k) => console.log('-', k));
  } catch (e) {
    console.error('Unexpected error:', e.message || e);
    process.exit(1);
  }
})();
