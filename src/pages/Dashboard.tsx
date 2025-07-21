import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield,
  Wallet,
  ExternalLink,
  CheckCircle,
  X,
  PartyPopper,
  AlertCircle,
  MessageCircle,
  Instagram,
  CircleDollarSign,
  Users,
  ArrowRight,
  Rocket,
  Trophy,
  Smartphone,
  Coins,
  Building2,
  GraduationCap,
  Gamepad2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';

const Dashboard = () => {
  const { user, updateUserBalance, setUserAsCongratulated, loading: authLoading } = useAuth();
  const { 
    dashboardTasks, 
    getDashboardTask, 
    updateDashboardTask, 
    completeDashboardTask,
    loading: tasksLoading 
  } = useTasks();

  const loading = authLoading || tasksLoading;

  // Modal states
  const [showMinBalanceModal, setShowMinBalanceModal] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showFirstAttemptFailModal, setShowFirstAttemptFailModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [currentTaskType, setCurrentTaskType] = useState<'telegram' | 'instagram' | 'survey' | null>(null);
  const [username, setUsername] = useState('');
  const [currentSurveyStep, setCurrentSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<string[]>([]);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Survey questions
  const surveyQuestions = [
    {
      question: "How did you hear about Sonavo?",
      options: ["Social Media", "Friend", "Search", "Other"]
    },
    {
      question: "What interests you most about Web3?",
      options: ["Earning Opportunities", "Technology", "Community", "Innovation"]
    },
    {
      question: "How experienced are you with crypto?",
      options: ["Beginner", "Intermediate", "Advanced", "Expert"]
    },
    {
      question: "What type of tasks interest you most?",
      options: ["Social", "Technical", "Creative", "Educational"]
    },
    {
      question: "How much time can you dedicate weekly?",
      options: ["1-2 hours", "3-5 hours", "5-10 hours", "10+ hours"]
    }
  ];

  // Check for congratulations when all 3 tasks completed
  useEffect(() => {
    if (dashboardTasks && dashboardTasks.length === 3 && user) {
      const allCompleted = dashboardTasks.every(task => task.completed);
      if (allCompleted && !user.congratulated) {
        updateUserBalance(10);
        setUserAsCongratulated();
        setShowCongratsModal(true);
      }
    }
  }, [dashboardTasks, user, updateUserBalance, setUserAsCongratulated]);

  // FAKE VERIFICATION SYSTEM FOR DASHBOARD TASKS
  const handleTaskClick = async (taskType: 'telegram' | 'instagram' | 'survey') => {
    const dashboardTask = getDashboardTask(taskType);
    setUsername('');

    if (taskType === 'survey') {
      setCurrentSurveyStep(0);
      setSurveyAnswers([]);
      setShowSurveyModal(true);
      return;
    }

    if (!dashboardTask?.first_click_done) {
      await updateDashboardTask(taskType, { first_click_done: true });
      
      if (taskType === 'telegram') {
        window.open('https://t.me/+atUr8L_y6nJhMWVi', '_blank');
      } else if (taskType === 'instagram') {
        window.open('https://www.instagram.com/sonavo.web3?igsh=MzhpOTdrOHZ1YmRp/', '_blank');
      }
    } else {
      setCurrentTaskType(taskType);
      setShowUsernameModal(true);
    }
  };

  // FAKE VERIFICATION - первая попытка всегда "проваливается"
  const handleUsernameSubmit = async () => {
    if (!currentTaskType || !username.trim()) return;

    setShowUsernameModal(false);

    // FAKE VERIFICATION DELAY
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // FAKE FAILURE LOGIC - 30% chance to fail for realism
    const shouldFail = Math.random() < 0.3;
    
    if (shouldFail) {
      setShowFirstAttemptFailModal(true);
      return;
    }

    // Success - complete the task
    await completeDashboardTask(currentTaskType, { username });
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);

    setUsername('');
    setCurrentTaskType(null);
  };

  const handleSurveyAnswer = (answer: string) => {
    const newAnswers = [...surveyAnswers, answer];
    setSurveyAnswers(newAnswers);
    
    if (currentSurveyStep < surveyQuestions.length - 1) {
      setCurrentSurveyStep(prev => prev + 1);
    } else {
      completeDashboardTask('survey', { surveyAnswers: newAnswers });
      setShowSurveyModal(false);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);
    }
  };

  const handleWithdrawClick = () => {
    if (!user || (user.balance || 0) < 30) {
      setShowMinBalanceModal(true);
      return;
    }
    // Withdraw logic would go here
  };

  // Render task button with proper states
  const renderTaskButton = (taskType: 'telegram' | 'instagram' | 'survey') => {
    const dashboardTask = getDashboardTask(taskType);

    if (dashboardTask?.completed) {
      return (
        <div className="w-full rounded-lg py-2 px-4 bg-green-500/10 text-green-400 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span className="font-medium">Completed</span>
        </div>
      );
    }

    const gradients = {
      telegram: 'from-blue-500 via-blue-400 to-blue-600',
      instagram: 'from-purple-500 via-pink-500 to-orange-500',
      survey: 'from-green-500 via-emerald-400 to-teal-500'
    };

    return (
      <button
        onClick={() => handleTaskClick(taskType)}
        className={`w-full rounded-lg py-2 px-4 flex items-center justify-center font-medium transition-all duration-300 ${
          dashboardTask?.first_click_done
            ? `bg-gradient-to-r ${gradients[taskType]} bg-opacity-10 hover:bg-opacity-20 relative overflow-hidden group`
            : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
        }`}
      >
        {dashboardTask?.first_click_done ? (
          <>
            <span className="relative z-10 flex items-center text-white">
              Verify Completion 
              <CheckCircle className="w-4 h-4 ml-2" />
            </span>
            <div className={`absolute inset-0 bg-gradient-to-r ${gradients[taskType]} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
          </>
        ) : (
          <>
            {taskType === 'telegram' && 'Join Telegram'}
            {taskType === 'instagram' && 'Go to Instagram'}
            {taskType === 'survey' && 'Start Survey'}
            <ExternalLink className="w-4 h-4 ml-2" />
          </>
        )}
      </button>
    );
  };

  // Check if all tasks completed
  const hasAllTasksCompleted = dashboardTasks && dashboardTasks.length === 3 && 
    dashboardTasks.every(task => task.completed);

  // Safe user data with fallbacks
  const safeUser = user || {
    username: 'Web3 User',
    level: 1,
    tasks_completed: 0,
    balance: 0,
    total_earned: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 w-full overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to <span className="text-neon-green">Sonavo</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Your gateway to Web3 earnings
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {hasAllTasksCompleted && (
              <button
                onClick={handleWithdrawClick}
                className="flex items-center gap-2 bg-gradient-to-r from-neon-green to-green-400 text-background px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-neon-green/20 transition-all duration-300"
              >
                <Wallet className="w-5 h-5" />
                Withdraw
              </button>
            )}
            
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#00ffb2]/10 to-[#00ffb2]/5 rounded-full px-6 py-3 border border-[#00ffb2]/20 shadow-md">
              <Shield className="h-5 w-5 text-neon-green" />
              <span className="text-base font-semibold text-white">Level {safeUser.level}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12"
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#1A2421] p-6 border border-[#2A3A35] group hover:border-[#00FFB2]/30 transition-all duration-300">
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-[#00FFB2]/5 rounded-full blur-2xl group-hover:bg-[#00FFB2]/10 transition-all duration-300"></div>
          <div className="flex items-center gap-4">
            <div className="bg-[#00FFB2]/10 rounded-xl p-3">
              <CheckCircle className="h-6 w-6 text-[#00FFB2]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Tasks Completed</p>
              <p className="text-2xl font-bold">{safeUser.tasks_completed}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#1A1F35] p-6 border border-[#2A3A55] group hover:border-[#3B82F6]/30 transition-all duration-300">
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-[#3B82F6]/5 rounded-full blur-2xl group-hover:bg-[#3B82F6]/10 transition-all duration-300"></div>
          <div className="flex items-center gap-4">
            <div className="bg-[#3B82F6]/10 rounded-xl p-3">
              <Wallet className="h-6 w-6 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold">${safeUser.balance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#2A1A35] p-6 border border-[#3A2A55] group hover:border-[#8B5CF6]/30 transition-all duration-300">
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-[#8B5CF6]/5 rounded-full blur-2xl group-hover:bg-[#8B5CF6]/10 transition-all duration-300"></div>
          <div className="flex items-center gap-4">
            <div className="bg-[#8B5CF6]/10 rounded-xl p-3">
              <CircleDollarSign className="h-6 w-6 text-[#8B5CF6]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Earned</p>
              <p className="text-2xl font-bold">${safeUser.total_earned.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#351A1A] p-6 border border-[#552A2A] group hover:border-[#F6745C]/30 transition-all duration-300">
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-[#F6745C]/5 rounded-full blur-2xl group-hover:bg-[#F6745C]/10 transition-all duration-300"></div>
          <div className="flex items-center gap-4">
            <div className="bg-[#F6745C]/10 rounded-xl p-3">
              <Users className="h-6 w-6 text-[#F6745C]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Referral Earnings</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Tasks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Earn Your First $10</h2>
            <p className="text-gray-400 mt-1">Complete these 3 simple tasks below and get your first reward. It takes less than 5 minutes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Telegram Task */}
          <div className="card bg-gradient-to-br from-blue-900/20 to-dark-gray border-blue-800/50 hover:border-blue-500/50 min-h-[240px]">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-900/30 rounded-xl p-2">
                    <MessageCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-blue-400 font-medium">Step 1</span>
                </div>
                <a
                  href="https://t.me/+atUr8L_y6nJhMWVi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
              
              <h3 className="font-bold text-lg mb-2">Join Our Telegram</h3>
              <p className="text-gray-400 text-sm mb-4">Join the Sonavo community on Telegram to stay updated.</p>
              
              <div className="mt-auto">
                {renderTaskButton('telegram')}
              </div>
            </div>
          </div>

          {/* Instagram Task */}
          <div className="card bg-gradient-to-br from-purple-900/20 to-dark-gray border-purple-800/50 hover:border-purple-500/50 min-h-[240px]">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-900/30 rounded-xl p-2">
                    <Instagram className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-purple-400 font-medium">Step 2</span>
                </div>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
              
              <h3 className="font-bold text-lg mb-2">Follow Us on Instagram</h3>
              <p className="text-gray-400 text-sm mb-4">Follow us on Instagram for updates, highlights, and tips.</p>
              
              <div className="mt-auto">
                {renderTaskButton('instagram')}
              </div>
            </div>
          </div>

          {/* Survey Task */}
          <div className="card bg-gradient-to-br from-green-900/20 to-dark-gray border-green-800/50 hover:border-green-500/50 min-h-[240px]">
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-900/30 rounded-xl p-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-green-400 font-medium">Step 3</span>
              </div>
              
              <h3 className="font-bold text-lg mb-2">Answer 5 Quick Questions</h3>
              <p className="text-gray-400 text-sm mb-4">Help us understand you better. Answer a few questions.</p>
              
              <div className="mt-auto">
                {renderTaskButton('survey')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
          >
            Start Earning
          </Link>
        </div>
      </motion.div>

      {/* Coming Soon Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-20 mb-24"
      >
        <div className="flex items-center gap-3 mb-8">
          <Rocket className="h-6 w-6 text-[#009dff]" />
          <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Trophy, title: "Leaderboard & Weekly Prizes", desc: "Compete with other users and win exclusive rewards every week.", color: "purple" },
            { icon: Smartphone, title: "Mobile App", desc: "Complete tasks and track earnings on the go with our mobile app.", color: "blue" },
            { icon: Coins, title: "Solana Token", desc: "Native token on Solana for rewards, governance, and exclusive features.", color: "orange" },
            { icon: Building2, title: "Employer Dashboard", desc: "Post tasks, manage submissions, and find top talent in Web3.", color: "emerald" },
            { icon: GraduationCap, title: "Learn & Earn Quests", desc: "Master Web3 skills while earning rewards through interactive courses.", color: "yellow" },
            { icon: Gamepad2, title: "Play & Earn Games", desc: "Earn tokens while playing exciting Web3 games and challenges.", color: "pink" }
          ].map((feature, index) => (
            <div key={index} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br from-${feature.color}-900/20 to-[#111827] p-6 border border-${feature.color}-500/20 hover:border-${feature.color}-500/40 transition-all duration-300`}>
              <div className={`absolute -right-8 -top-8 h-32 w-32 bg-gradient-to-br from-${feature.color}-500/20 to-transparent blur-2xl group-hover:animate-pulse`}></div>
              <div className="flex justify-center">
                <feature.icon className={`h-8 w-8 text-${feature.color}-400 mb-4 transform transition-transform duration-300 group-hover:scale-110`} />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#009dff] to-[#6600ff] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300"
          >
            Explore Available Tasks
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>

      {/* Modals */}
      {showSurveyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-gray rounded-xl p-8 max-w-md w-full mx-4 relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 rounded-t-xl overflow-hidden">
              <div 
                className="h-full bg-neon-green transition-all duration-300"
                style={{ width: `${((currentSurveyStep + 1) / surveyQuestions.length) * 100}%` }}
              ></div>
            </div>

            <button 
              onClick={() => setShowSurveyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8 text-center">
              <h3 className="text-xl font-bold mb-2">Question {currentSurveyStep + 1} of {surveyQuestions.length}</h3>
              <p className="text-gray-300">{surveyQuestions[currentSurveyStep].question}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {surveyQuestions[currentSurveyStep].options.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSurveyAnswer(option)}
                  className="w-full p-4 rounded-lg bg-medium-gray hover:bg-light-gray border border-light-gray transition-all duration-200 text-left relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">{option}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-gray rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">
              Enter your {currentTaskType === 'telegram' ? 'Telegram' : 'Instagram'} username
            </h3>
            
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`@${currentTaskType === 'telegram' ? 'telegram' : 'instagram'}_username`}
              className="input w-full mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setUsername('');
                }}
                className="flex-1 px-4 py-2 bg-light-gray rounded-lg hover:bg-opacity-80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUsernameSubmit}
                disabled={!username.trim()}
                className="flex-1 bg-neon-green text-background rounded-lg py-2 font-medium disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification Modals */}
      {showSuccessNotification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-4 right-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3 z-50"
        >
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-100">Task completed successfully!</p>
        </motion.div>
      )}

      {showMinBalanceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-dark-gray text-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-700 text-center flex flex-col items-center"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold">Minimum Withdrawal</h3>
            </div>
            <p className="text-gray-300 mb-6">
              The minimum amount required for withdrawal is <span className="text-yellow-400 font-semibold">$30.</span>
            </p>
            <button
              onClick={() => setShowMinBalanceModal(false)}
              className="w-full py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-semibold transition-all duration-200"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}

      {showFirstAttemptFailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1c1c1c] text-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-red-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold">Verification Failed</h3>
            </div>
            <p className="text-gray-300 mb-6">
              You haven't completed the task yet. Please complete it and try again.
            </p>
            <button
              onClick={() => setShowFirstAttemptFailModal(false)}
              className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-black rounded-lg font-semibold transition-all duration-200"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      )}

      {showCongratsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-dark-gray text-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-green-500/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <PartyPopper className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold">Congratulations!</h3>
            </div>
            <p className="text-gray-300 mb-6">
              You've completed your first 3 tasks and earned <span className="text-green-400 font-semibold">$10</span>!
            </p>
            <button
              onClick={() => setShowCongratsModal(false)}
              className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-black rounded-lg font-semibold transition-all duration-200"
            >
              Awesome!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;