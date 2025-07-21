import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, User as SupabaseUser } from '../lib/supabase';

interface AuthContextType {
  user: SupabaseUser | null;
  isConnected: boolean;
  userWallet: string | null;
  loading: boolean;
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  updateUserBalance: (amount: number) => Promise<void>;
  updateTasksCompleted: (count: number) => Promise<void>;
  updateProfile: (data: { username?: string; avatar?: string }) => Promise<void>;
  setUserAsCongratulated: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userWallet, setUserWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      setLoading(true);
      await createDemoUser();
    } catch (error) {
      console.error('Error initializing user:', error);
      // Fallback user if database fails
      setUser({
        id: 'demo-user-id',
        username: 'Web3 User',
        avatar: null,
        balance: 0,
        tasks_completed: 0,
        total_earned: 0,
        level: 1,
        referral_code: 'xyz123',
        joined_at: new Date().toISOString(),
        congratulated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setIsConnected(true);
      setUserWallet('0x1234...5678');
    } finally {
      setLoading(false);
    }
  };

  const createDemoUser = async () => {
    const userId = 'demo-user-id';
    
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!existingUser) {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert([{
            id: userId,
            username: 'Web3 User',
            balance: 0,
            tasks_completed: 0,
            total_earned: 0,
            level: 1,
            congratulated: false
          }])
          .select()
          .single();

        if (error) throw error;
        setUser(newUser);
      } else {
        setUser(existingUser);
      }
      
      setIsConnected(true);
      setUserWallet('0x1234...5678');
    } catch (error) {
      throw error;
    }
  };

  const connectWallet = async (walletType: string) => {
    setIsConnected(true);
    setUserWallet('0x1234...5678');
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setUserWallet(null);
  };

  const updateUserBalance = async (amount: number) => {
    if (!user) return;

    try {
      const newBalance = user.balance + amount;
      const newTotalEarned = user.total_earned + amount;

      const { data, error } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          total_earned: newTotalEarned
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error updating balance:', error);
      // Update locally as fallback
      setUser(prev => prev ? {
        ...prev,
        balance: prev.balance + amount,
        total_earned: prev.total_earned + amount
      } : null);
    }
  };

  const updateTasksCompleted = async (count: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ tasks_completed: count })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error updating tasks completed:', error);
      setUser(prev => prev ? { ...prev, tasks_completed: count } : null);
    }
  };

  const updateProfile = async (profileData: { username?: string; avatar?: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      setUser(prev => prev ? { ...prev, ...profileData } : null);
    }
  };

  const setUserAsCongratulated = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ congratulated: true })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error updating congratulated status:', error);
      setUser(prev => prev ? { ...prev, congratulated: true } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isConnected,
        userWallet,
        loading,
        connectWallet,
        disconnectWallet,
        updateUserBalance,
        updateTasksCompleted,
        updateProfile,
        setUserAsCongratulated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};