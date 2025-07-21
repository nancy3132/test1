// Auth Types
export type Wallet = 'MetaMask' | 'TrustWallet' | 'WalletConnect';

export interface User {
  id: string;
  username: string;
  avatar: string | null;
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

// Task Types
export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';
export type TaskStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  reward: number;
  link?: string;
  instructions: string;
  requirements?: {
    easyTasksCompleted?: number;
  };
  createdAt: string;
  imageUrl?: string;
  isHot?: boolean;
  type?: string;
  tokens?: {
    symbol: string;
    url: string;
  }[];
}

export interface TaskSubmission {
  id: string;
  user_id: string;
  task_id: string;
  screenshot?: string;
  text?: string;
  status: TaskStatus;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

// Form Types
export interface PublishTaskForm {
  email: string;
  telegram: string;
  description: string;
}