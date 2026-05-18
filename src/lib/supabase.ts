import { createClient } from '@supabase/supabase-js';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_STORAGE_BUCKET
} from '$env/static/public';
import type { Database } from './types/database';

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export const STORAGE_BUCKET = PUBLIC_STORAGE_BUCKET ?? 'assets';
