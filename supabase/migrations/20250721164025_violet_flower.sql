/*
  # Create users and tasks schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text)
      - `avatar` (text, nullable)
      - `balance` (decimal)
      - `tasks_completed` (integer)
      - `total_earned` (decimal)
      - `level` (integer)
      - `referral_code` (text)
      - `joined_at` (timestamp)
      - `congratulated` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `task_submissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `task_id` (text)
      - `screenshot` (text, nullable)
      - `text` (text, nullable)
      - `status` (text)
      - `submitted_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `dashboard_tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `task_type` (text) -- 'telegram', 'instagram', 'survey'
      - `completed` (boolean)
      - `first_click_done` (boolean)
      - `username_provided` (text, nullable)
      - `survey_answers` (jsonb, nullable)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL DEFAULT 'Web3 User',
  avatar text,
  balance decimal(10,2) NOT NULL DEFAULT 0.00,
  tasks_completed integer NOT NULL DEFAULT 0,
  total_earned decimal(10,2) NOT NULL DEFAULT 0.00,
  level integer NOT NULL DEFAULT 1,
  referral_code text NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  joined_at timestamptz NOT NULL DEFAULT now(),
  congratulated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  screenshot text,
  text text,
  status text NOT NULL DEFAULT 'Pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dashboard_tasks table
CREATE TABLE IF NOT EXISTS dashboard_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('telegram', 'instagram', 'survey')),
  completed boolean NOT NULL DEFAULT false,
  first_click_done boolean NOT NULL DEFAULT false,
  username_provided text,
  survey_answers jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_type)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for task_submissions table
CREATE POLICY "Users can read own submissions"
  ON task_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own submissions"
  ON task_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own submissions"
  ON task_submissions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for dashboard_tasks table
CREATE POLICY "Users can read own dashboard tasks"
  ON dashboard_tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own dashboard tasks"
  ON dashboard_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own dashboard tasks"
  ON dashboard_tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_user_id ON task_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_user_id ON dashboard_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_task_type ON dashboard_tasks(task_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_submissions_updated_at BEFORE UPDATE ON task_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_tasks_updated_at BEFORE UPDATE ON dashboard_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();