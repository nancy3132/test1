import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create Supabase client if we have real credentials
export const supabase = (supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key') 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Database types
export interface User {
  id: string;
  username: string;
  avatar?: string;
  balance: number;
  tasks_completed: number;
  total_earned: number;
  level: number;
  referral_code: string;
  joined_at: string;
  congratulated: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskSubmission {
  id: string;
  user_id: string;
  task_id: string;
  screenshot?: string;
  text?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardTask {
  id: string;
  user_id: string;
  task_type: 'telegram' | 'instagram' | 'survey';
  completed: boolean;
  first_click_done: boolean;
  username_provided?: string;
  survey_answers?: any;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}