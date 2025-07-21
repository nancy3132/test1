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
  submitTask: (
    taskId: string,
    data: { screenshot?: string; text?: string },
    onFirstFail?: () => void
  ) => Promise<void>;
  updateDashboardTask: (
    taskType: 'telegram' | 'instagram' | 'survey',
    updates: Partial<DashboardTask>
  ) => Promise<void>;
  completeDashboardTask: (
    taskType: 'telegram' | 'instagram' | 'survey',
    data?: { username?: string; surveyAnswers?: any }
  ) => Promise<void>;
  isVerifying: boolean;
  verificationCountdown: number;
  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks] = useState<Task[]>(mockTasks);
  const { user, updateTasksCompleted } = useAuth();

  const [userSubmissions, setUserSubmissions] = useState<SupabaseTaskSubmission[]>([]);
  const [dashboardTasks, setDashboardTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(10);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load task submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setUserSubmissions(submissions || []);

      // Load dashboard tasks
      const { data: dashTasks, error: dashTasksError } = await supabase
        .from('dashboard_tasks')
        .select('*')
        .eq('user_id', user.id);

      if (dashTasksError) throw dashTasksError;
      setDashboardTasks(dashTasks || []);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const checkVerification = () => {
      const failAtRaw = localStorage.getItem('verificationFailAt');
      if (!failAtRaw) return;

      const failAt = parseInt(failAtRaw);
      const timeLeft = Math.max(0, Math.floor((failAt - Date.now()) / 1000));
      if (timeLeft > 0) {
        setIsVerifying(true);
        setVerificationCountdown(timeLeft);

        interval = setInterval(() => {
          const newTimeLeft = Math.max(0, Math.floor((failAt - Date.now()) / 1000));
          setVerificationCountdown(newTimeLeft);

          if (newTimeLeft <= 0) {
            clearInterval(interval!);
            localStorage.removeItem('verificationFailAt');
            setIsVerifying(false);
            window.dispatchEvent(new Event('task-verification-failed'));
          }
        }, 500);
      } else {
        localStorage.removeItem('verificationFailAt');
      }
    };

    checkVerification();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

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
    if (!user) return;

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

  const submitTask = (
    taskId: string,
    data: { screenshot?: string; text?: string },
    onFirstFail?: () => void
  ): Promise<boolean> => {
    if (!user) return Promise.resolve(false);

    return new Promise((resolve) => {
      const failAt = Date.now() + 10000;
      localStorage.setItem('verificationFailAt', failAt.toString());
      localStorage.setItem('verifyingTaskId', taskId);

      setIsVerifying(true);
      setVerificationCountdown(10);

      const interval = setInterval(() => {
        const timeLeft = Math.max(0, Math.floor((failAt - Date.now()) / 1000));
        setVerificationCountdown(timeLeft);

        if (timeLeft > 0) return;

        clearInterval(interval);
        setIsVerifying(false);
        localStorage.removeItem('verificationFailAt');

        const handleSuccess = async () => {
          try {
            const { data: newSubmission, error } = await supabase
              .from('task_submissions')
              .insert([{
                user_id: user.id,
                task_id: taskId,
                screenshot: data.screenshot,
                text: data.text,
                status: 'Approved'
              }])
              .select()
              .single();

            if (error) throw error;

            setUserSubmissions(prev => [newSubmission, ...prev]);

            // Update tasks completed count
            const approvedCount = userSubmissions.filter(s => s.status === 'Approved').length + 1;
            const dashboardCompletedCount = dashboardTasks.filter(t => t.completed).length;
            await updateTasksCompleted(approvedCount + dashboardCompletedCount);

            resolve(true);
          } catch (error) {
            console.error('Error submitting task:', error);
            resolve(false);
          }
        };

        if (['telegram', 'instagram'].includes(taskId)) {
          const firstFailKey = 'dashboard_first_fail_done';
          const alreadyFailed = localStorage.getItem(firstFailKey) === 'true';
          if (!alreadyFailed) {
            localStorage.setItem(firstFailKey, 'true');
            if (onFirstFail) onFirstFail();
            window.dispatchEvent(new Event('task-verification-failed'));
            resolve(false);
            return;
          }
          handleSuccess();
          return;
        }

        if (taskId === 'survey') {
          handleSuccess();
          return;
        }

        const globalAttemptRaw = localStorage.getItem('globalAttemptCount');
        const globalAttempt = globalAttemptRaw ? parseInt(globalAttemptRaw) : 1;

        if ([1, 4, 5].includes(globalAttempt)) {
          if (onFirstFail) onFirstFail();
          window.dispatchEvent(new Event('task-verification-failed'));
          resolve(false);
          return;
        }

        handleSuccess();
      });
    });
  };

            screenshot: data.screenshot,
            text: data.text,
            status: 'Approved',
            submittedAt: new Date().toISOString(),
          };

          setUserSubmissions((prev) => {
            const exists = prev.some((sub) => sub.taskId === taskId);
            const newSubmissions = exists
              ? prev.map((sub) => sub.taskId === taskId ? newSubmission : sub)
              : [...prev, newSubmission].slice(-MAX_STORED_SUBMISSIONS);

            setTimeout(() => {
              if (!['telegram', 'instagram'].includes(taskId)) {
                updateTasksCompleted(
                  newSubmissions.filter((s, index, self) => s.status === 'Approved' && self.findIndex(x => x.taskId === s.taskId) === index).length
                );
              }
              resolve(true);
            }, 500);

            return newSubmissions;
          });
        };

        if (['telegram', 'instagram'].includes(taskId)) {
          const firstFailKey = 'dashboard_first_fail_done';
          const alreadyFailed = localStorage.getItem(firstFailKey) === 'true';
          if (!alreadyFailed) {
            localStorage.setItem(firstFailKey, 'true');
            if (onFirstFail) onFirstFail();
            window.dispatchEvent(new Event('task-verification-failed'));
            resolve(false);
            return;
          }
          handleSuccess();
          return;
        }

        if (taskId === 'survey') {
          handleSuccess();
          return;
        }

        const globalAttemptRaw = localStorage.getItem('globalAttemptCount');
        const globalAttempt = globalAttemptRaw ? parseInt(globalAttemptRaw) : 1;

        if ([1, 4, 5].includes(globalAttempt)) {
          const updated = failAttemptCount + 1;
          setFailAttemptCount(updated);
          localStorage.setItem('failAttemptCount', updated.toString());

          if (onFirstFail) onFirstFail();
          window.dispatchEvent(new Event('task-verification-failed'));
          resolve(false);
          return;
        }

        handleSuccess();
      });
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
        isVerifying,
        verificationCountdown,
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
