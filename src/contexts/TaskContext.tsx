import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { mockTasks } from '../data/initialData';
import { useAuth } from './AuthContext';
import { supabase, TaskSubmission as SupabaseTaskSubmission, DashboardTask } from '../lib/supabase';

interface TaskContextType {
  tasks: Task[];
  userSubmissions: SupabaseTaskSubmission[];
  dashboardTasks: DashboardTask[];
  getTaskById: (id: string) => Task | undefined;
  getUserTaskSubmission: (taskId: string) => SupabaseTaskSubmission | undefined;
  getDashboardTask: (taskType: 'telegram' | 'instagram' | 'survey') => DashboardTask | undefined;
  submitTask: (taskId: string, data: { screenshot?: string; text?: string }) => Promise<void>;
  updateDashboardTask: (taskType: 'telegram' | 'instagram' | 'survey', updates: Partial<DashboardTask>) => Promise<void>;
  completeDashboardTask: (taskType: 'telegram' | 'instagram' | 'survey', data?: { username?: string; surveyAnswers?: any }) => Promise<void>;
  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks] = useState<Task[]>(mockTasks);
  const { user, updateTasksCompleted } = useAuth();
  const [userSubmissions, setUserSubmissions] = useState<SupabaseTaskSubmission[]>([]);
  const [dashboardTasks, setDashboardTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user || !supabase) return;

    try {
      setLoading(true);
      
      // Load task submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!submissionsError && submissions) {
        setUserSubmissions(submissions);
      }

      // Load dashboard tasks
      const { data: dashTasks, error: dashTasksError } = await supabase
        .from('dashboard_tasks')
        .select('*')
        .eq('user_id', user.id);

      if (!dashTasksError && dashTasks) {
        setDashboardTasks(dashTasks);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((task) => task.id === id);
  };

  const getUserTaskSubmission = (taskId: string): SupabaseTaskSubmission | undefined => {
    return userSubmissions.find((submission) => submission.task_id === taskId);
  };

  const getDashboardTask = (taskType: 'telegram' | 'instagram' | 'survey'): DashboardTask | undefined => {
    return dashboardTasks.find((task) => task.task_type === taskType);
  };

  const updateDashboardTask = async (
    taskType: 'telegram' | 'instagram' | 'survey',
    updates: Partial<DashboardTask>
  ) => {
    if (!user || !supabase) return;

    try {
      const existingTask = getDashboardTask(taskType);
      
      if (existingTask) {
        const { data, error } = await supabase
          .from('dashboard_tasks')
          .update(updates)
          .eq('id', existingTask.id)
          .select()
          .single();

        if (error) throw error;
        
        setDashboardTasks(prev => 
          prev.map(task => task.id === existingTask.id ? data : task)
        );
      } else {
        const { data, error } = await supabase
          .from('dashboard_tasks')
          .insert([{
            user_id: user.id,
            task_type: taskType,
            ...updates
          }])
          .select()
          .single();

        if (error) throw error;
        setDashboardTasks(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error updating dashboard task:', error);
    }
  };

  const completeDashboardTask = async (
    taskType: 'telegram' | 'instagram' | 'survey',
    data?: { username?: string; surveyAnswers?: any }
  ) => {
    if (!user) return;

    try {
      await updateDashboardTask(taskType, {
        completed: true,
        completed_at: new Date().toISOString(),
        username_provided: data?.username,
        survey_answers: data?.surveyAnswers
      });

      // Update tasks completed count
      const completedCount = dashboardTasks.filter(t => t.completed).length + 1;
      const approvedSubmissions = userSubmissions.filter(s => s.status === 'Approved').length;
      await updateTasksCompleted(completedCount + approvedSubmissions);

    } catch (error) {
      console.error('Error completing dashboard task:', error);
    }
  };

  // FAKE VERIFICATION SYSTEM FOR EXPLORE TASKS
  const submitTask = async (
    taskId: string,
    data: { screenshot?: string; text?: string }
  ): Promise<void> => {
    if (!user || !supabase) return;

    return new Promise((resolve) => {
      // Simulate verification delay
      setTimeout(async () => {
        try {
          // FAKE VERIFICATION LOGIC - некоторые попытки "проваливаются" для реализма
          const shouldFail = Math.random() < 0.3; // 30% chance to fail first time
          
          if (shouldFail) {
            // Don't save anything, just reject
            throw new Error('Verification failed');
          }

          // Create new submission immediately in local state
          const newSubmission: SupabaseTaskSubmission = {
            id: `temp-${Date.now()}`,
            user_id: user.id,
            task_id: taskId,
            screenshot: data.screenshot || null,
            text: data.text || null,
            status: 'Approved',
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Update local state immediately
          setUserSubmissions(prev => [newSubmission, ...prev]);

          // Update tasks completed count
          const newCompletedCount = userSubmissions.filter(s => s.status === 'Approved').length + 1;
          const dashboardCompletedCount = dashboardTasks.filter(t => t.completed).length;
          await updateTasksCompleted(newCompletedCount + dashboardCompletedCount);

          // Add reward to balance
          await updateTasksCompleted(newApprovedCount + dashboardCompletedCount);
          if (task) {
            await updateUserBalance(task.reward);
          }
            const { data: savedSubmission, error } = await supabase
          const { data: newSubmission, error } = await supabase
          const newApprovedCount = userSubmissions.filter(s => s.status === 'Approved').length + 1;
            .insert([{
              user_id: user.id,
              task_id: taskId,
              screenshot: data.screenshot,
              text: data.text,
              status: 'Approved'
            }])
            .select()
            .single();
            if (!error && savedSubmission) {
              // Update the temporary submission with real data from database
              setUserSubmissions(prev => 
                prev.map(sub => 
                  sub.id === newSubmission.id ? savedSubmission : sub
                )
              );

          setUserSubmissions(prev => [newSubmission, ...prev]);

          resolve();
        } catch (error) {
          console.error('Task verification failed:', error);
          throw error;
        }
      }, 10000); // 10 second "verification" delay
    });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        userSubmissions,
        dashboardTasks,
        getTaskById,
        getUserTaskSubmission,
        getDashboardTask,
        submitTask,
        updateDashboardTask,
        completeDashboardTask,
        loading,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};