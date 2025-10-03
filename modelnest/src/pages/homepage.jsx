import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Sparkles, TrendingUp, Star, Box, Search, Filter, ArrowRight, Zap, Clock, Users, ChevronRight, Brain, Upload, Sun, Moon, User, Settings, LogOut, Edit2, Save, X, Image as ImageIcon } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const colorScheme = {
  dark: {
    bgPrimary: 'bg-[#050505]', // Deeper dark background
    textPrimary: 'text-[#E6E6E6]',
    textSecondary: 'text-[#A6A6A6]',
    // Glassmorphism update: Semi-transparent black, strong backdrop-blur
    cardBg: 'bg-black/20 backdrop-blur-xl',
    cardSecondaryBg: 'bg-black/10 backdrop-blur-lg',
    // Neon border
    cardBorder: 'border-[#00FFE0]/30',
    scrollbarThumb: '#00FFE0',
  },
  light: {
    bgPrimary: 'bg-gray-100',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    cardBg: 'bg-white/80 backdrop-blur-lg', // Light glass
    cardSecondaryBg: 'bg-white/60 backdrop-blur-md',
    cardBorder: 'border-gray-300',
    scrollbarThumb: '#1E90FF',
  }
};

// Random greetings array
const greetings = [
  "Welcome back", "Hello", "Hey there", "Good to see you",
  "Greetings", "Nice to have you back", "Welcome", "Hi there"
];

// Profile Edit Modal Component
const ProfileEditModal = ({ profile, onSave, onClose, currentTheme }) => {
  // Initialize form data with current profile state or empty strings
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    company: profile?.company || '',
    role: profile?.role || '',
  });
  const [saving, setSaving] = useState(false);

  // FIX: Ensure formData is passed correctly. The original logic was correct, 
  // but we are double-checking the flow here.
  const handleSave = async () => {
    setSaving(true);
    try {
      // Pass the current formData state to the parent's onSave function
      await onSave(formData);
    } catch (error) {
      // Catch errors that propagate from the API call in the parent component
      console.error("Error during save process:", error);
    } finally {
      setSaving(false);
    }
  };

  const isDark = currentTheme.bgPrimary === colorScheme.dark.bgPrimary;
  
  // Get first initial for avatar display
  const userInitial = profile?.name?.charAt(0).toUpperCase() || 'U';

  // Futuristic Input Style (Neon Glow)
  const inputStyle = `w-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl px-4 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all duration-300 ${isDark ? 'focus:shadow-[0_0_15px_rgba(0,255,224,0.5)]' : 'focus:shadow-[0_0_15px_rgba(30,144,255,0.5)]'}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl p-8 max-w-lg w-full shadow-2xl relative transition-transform duration-500 scale-100`}
           style={{ boxShadow: isDark ? '0 0 40px rgba(0,255,224,0.2)' : '0 0 40px rgba(30,144,255,0.2)' }}>

        <div className="flex items-center justify-between mb-8">
          <h3 className={`text-3xl font-extrabold ${currentTheme.textPrimary} bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] bg-clip-text text-transparent`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
            User Settings
          </h3>
          <button
            onClick={onClose}
            className={`p-3 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-full hover:border-[#9B59B6] transition-all hover:scale-110`}
            style={{ boxShadow: isDark ? '0 0 10px rgba(255,255,255,0.1)' : '0 0 10px rgba(0,0,0,0.1)' }}
          >
            <X className={`w-5 h-5 ${currentTheme.textPrimary}`} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Avatar Display Section */}
          <div className="flex items-center space-x-6 pb-4 border-b border-white/5">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center text-4xl text-white font-bold border-4 border-[#00FFE0] shadow-[0_0_15px_rgba(0,255,224,0.5)]">
              {userInitial}
            </div>
            <div>
              <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>{profile?.name}</p>
              <p className={`text-sm ${currentTheme.textSecondary}`}>{profile?.role} at {profile?.company}</p>
            </div>
          </div>

          {/* Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={inputStyle}
              />
            </div>
            <div>
              <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={inputStyle}
              />
            </div>
            <div>
              <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className={inputStyle}
              />
            </div>
            <div>
              <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className={inputStyle}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={onClose}
            className={`flex-1 py-3 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl font-semibold hover:border-[#9B59B6] hover:text-[#9B59B6] transition-all duration-300`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-3 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-xl text-black font-extrabold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50
            ${isDark ? 'hover:shadow-[0_0_25px_rgba(0,255,224,0.8)]' : 'hover:shadow-[0_0_25px_rgba(30,144,255,0.8)]'}
            `}
          >
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Homepage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState([
    { type: 'assistant', text: 'Welcome to ModelNest! Tell me about your AI project, and I\'ll recommend the perfect model or help you train a custom one.' }
  ]);

  const currentTheme = colorScheme[theme];
  const isDark = theme === 'dark';

  // --- API Fetch Logic (Uses actual API endpoint) ---
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      // Retrieve the authentication token
      const token = localStorage.getItem('authToken'); 
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch profile: ${response.status} - ${response.statusText}`);
        // Fallback for UI visibility if fetch fails
        setProfile({ name: 'User', email: 'unknown', company: 'N/A', role: 'Developer' }); 
      } else {
        const data = await response.json();
        setProfile(data);
      }
      
      setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    } catch (error) {
      console.error('Network Error during profile fetch:', error);
      // Fallback for UI visibility if network error occurs
      setProfile({ name: 'User', email: 'offline', company: 'N/A', role: 'Developer' }); 
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Theme and mouse tracking
  useEffect(() => {
    localStorage.setItem('theme', theme);
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // --- API Save Logic (Uses actual API endpoint) ---
  // If your backend expects a PUT request to update, change 'POST' to 'PUT'.
  const handleProfileUpdate = useCallback(async (updatedData) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT', // Keep as 'POST' as requested, but often 'PUT' is used for updates
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Send the updated data from the modal
        body: JSON.stringify(updatedData) 
      });
      
      if (!response.ok) {
        console.error(`Failed to update profile data: ${response.status} - ${response.statusText}`);
        // Throwing the error here ensures the modal's catch block is triggered
        throw new Error('Update failed. Check your network or permissions.');
      }

      // Assuming the backend returns the *newly saved* profile data
      const data = await response.json();
      setProfile(data);
      setShowEditModal(false);
      
    } catch (error) {
      console.error('API Error during profile update:', error);
      // In a real app, you would show an error notification here.
      // Re-throwing the error to be handled by the modal's catch/finally block
      throw error;
    }
  }, []);


  const popularModels = [
    {
      name: 'BERT-Large',
      category: 'NLP',
      downloads: '45.2M',
      rating: 4.9,
      description: 'State-of-the-art transformer for text classification and NER',
      tags: ['Transformer', 'Classification', 'HuggingFace'],
      performance: '98.5%',
      speed: '45ms'
    },
    {
      name: 'ResNet-152',
      category: 'Computer Vision',
      downloads: '38.7M',
      rating: 4.8,
      description: 'Deep residual network for image recognition and transfer learning',
      tags: ['CNN', 'ImageNet', 'PyTorch'],
      performance: '97.2%',
      speed: '32ms'
    },
    {
      name: 'GPT-3.5 Turbo',
      category: 'Text Generation',
      downloads: '52.1M',
      rating: 4.9,
      description: 'Advanced language model for text generation and completion',
      tags: ['Generative', 'OpenAI', 'API'],
      performance: '96.8%',
      speed: '120ms'
    },
    {
      name: 'YOLOv8',
      category: 'Object Detection',
      downloads: '29.5M',
      rating: 4.9,
      description: 'Real-time object detection with state-of-the-art accuracy',
      tags: ['Detection', 'Real-time', 'Ultralytics'],
      performance: '99.1%',
      speed: '8ms'
    }
  ];

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setMessages([...messages, { type: 'user', text: chatMessage }]);
      setChatMessage('');
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'assistant',
          text: 'Based on your requirements, I recommend exploring BERT for NLP tasks or training a custom model with Cerebras acceleration. Would you like to see benchmark comparisons?'
        }]);
      }, 1200);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00FFE0]/20 border-t-[#00FFE0] rounded-full animate-spin mb-4 mx-auto" />
          <p className={`${currentTheme.textPrimary} text-lg`}>Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  // Calculate coordinates for dynamic orbs
  const x1 = mousePos.x * 0.05 + 50;
  const y1 = mousePos.y * 0.05 + 50;
  const x2 = mousePos.x * -0.03 - 20;
  const y2 = mousePos.y * -0.03 - 20;
  const x3 = mousePos.x * 0.02 + 80;
  const y3 = mousePos.y * -0.01 + 60;
  
  // Avatar initial display function
  const renderAvatarInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  return (
    <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} relative overflow-hidden font-sans`}>
      {/* --- Animated Futuristic Background --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Neon Grid Layer */}
        <div className="absolute inset-0" style={{
          backgroundImage: isDark ? 'linear-gradient(rgba(0,255,224,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,224,0.04) 1px,transparent 1px)' : 'linear-gradient(rgba(30,144,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(30,144,255,0.08) 1px,transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Dynamic Glowing Orbs (Responsive to mousePos) */}
        {/* Orb 1: Cyan/Blue (Top Left) */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-30 mix-blend-screen transition-all duration-500 ease-out"
          style={{
            background: 'radial-gradient(circle, #00FFE0, #1E90FF, transparent)',
            filter: 'blur(80px)',
            left: `${x1}px`,
            top: `${y1}px`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Orb 2: Purple/Blue (Bottom Right) */}
        <div 
          className="absolute w-80 h-80 rounded-full opacity-30 mix-blend-screen transition-all duration-500 ease-out"
          style={{
            background: 'radial-gradient(circle, #9B59B6, #1E90FF, transparent)',
            filter: 'blur(70px)',
            right: `${x2}px`,
            bottom: `${y2}px`,
            transform: 'translate(50%, 50%)',
          }}
        />
        {/* Orb 3: Cyan (Center Right) */}
        <div 
          className="absolute w-72 h-72 rounded-full opacity-30 mix-blend-screen transition-all duration-500 ease-out"
          style={{
            background: 'radial-gradient(circle, #00FFE0, transparent)',
            filter: 'blur(60px)',
            right: `${x3}px`,
            top: `${y3}px`,
            transform: 'translate(50%, -50%)',
          }}
        />
      </div>

      {/* Profile Edit Modal */}
      {showEditModal && (
        <ProfileEditModal
          profile={profile}
          onSave={handleProfileUpdate}
          onClose={() => setShowEditModal(false)}
          currentTheme={currentTheme}
        />
      )}

      {/* Navigation - Glassmorphism applied here */}
      <nav className={`relative z-50 ${currentTheme.cardBg} border-b ${currentTheme.cardBorder} sticky top-0 transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-xl flex items-center justify-center shadow-lg">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-[#00FFE0]">Model</span><span className={currentTheme.textPrimary}>Nest</span>
              </span>
            </div>
            <div className="flex items-center space-x-6">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-black/30 hover:bg-black/50 text-[#00FFE0]' : 'bg-white/30 hover:bg-white/50 text-[#1E90FF]'}`}
                aria-label="Toggle theme"
                style={{ boxShadow: isDark ? '0 0 10px rgba(0,255,224,0.3)' : '0 0 10px rgba(30,144,255,0.3)' }}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {['MarketPlace', 'My Models', 'Deployments'].map((item) => (
  <button
    key={item}
    onClick={() => {
      if (item === 'MarketPlace') {
        window.location.href = '/marketplace'
      } else {
        window.location.href = '#'
      }
    }}
    className={`hidden md:block ${currentTheme.textSecondary} hover:${
      isDark ? 'text-[#00FFE0] hover:scale-105' : 'text-[#1E90FF] hover:scale-105'
    } transition-all font-semibold`}
  >
    {item}
  </button>
))}


              {/* Profile Menu */}
              <div className="relative z-50">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center text-white font-bold text-lg border-2 ${currentTheme.cardBorder} transition-all cursor-pointer hover:scale-105`}
                  style={{ boxShadow: isDark ? '0 0 15px rgba(30,144,255,0.5)' : '0 0 15px rgba(30,144,255,0.5)' }}
                >
                  {renderAvatarInitial(profile?.name)}
                </button>

                {showProfileMenu && (
                  <div className={`absolute right-0 mt-3 w-64 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl shadow-2xl overflow-hidden transition-all duration-300`}
                       style={{ boxShadow: isDark ? '0 0 30px rgba(0,255,224,0.3)' : '0 0 30px rgba(30,144,255,0.3)' }}
                       onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <div className={`p-4 bg-gradient-to-r from-[#1E90FF]/30 to-[#9B59B6]/30 border-b ${currentTheme.cardBorder}`}>
                      <p className={`font-bold ${currentTheme.textPrimary}`}>{profile?.name}</p>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>{profile?.email}</p>
                      {profile?.company && (
                        <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>{profile.company} • {profile.role}</p>
                      )}
                    </div>
                    <div className="p-2">
                      {/* Settings button opens the modal */}
                      <button
                        onClick={() => {
                          setShowEditModal(true);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-[#00FFE0]/20 hover:to-[#1E90FF]/20 rounded-xl transition-all ${currentTheme.textPrimary}`}
                      >
                        <Settings className="w-4 h-4 text-[#00FFE0]" />
                        <span>Settings</span>
                      </button>
                      
                      <button className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-500/20 rounded-xl transition-all mt-1 text-red-400`}>
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Section - Glassmorphism applied here */}
        <div className={`mb-8 p-6 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl transition-all duration-300`}
             style={{ boxShadow: isDark ? '0 0 20px rgba(0,255,224,0.1)' : '0 0 20px rgba(30,144,255,0.1)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-extrabold mb-2 ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {greeting}, <span className="bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] bg-clip-text text-transparent">{profile?.name?.split(' ')[0] || 'Developer'}</span>
              </h1>
              <p className={`text-lg ${currentTheme.textSecondary}`}>What AI solution will you build today?</p>
            </div>
            <div className={`hidden md:flex items-center space-x-6 px-8 py-4 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-2xl`}>
              <div className="text-center">
                <p className={`text-sm ${currentTheme.textSecondary}`}>Active Models</p>
                <p className={`text-2xl font-bold bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] bg-clip-text text-transparent`}>12</p>
              </div>
              <div className="h-10 w-px bg-[#9B59B6]/50"></div>
              <div className="text-center">
                <p className={`text-sm ${currentTheme.textSecondary}`}>Deployments</p>
                <p className={`text-2xl font-bold bg-gradient-to-r from-[#9B59B6] to-[#00FFE0] bg-clip-text text-transparent`}>8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Chat Box - Glassmorphism applied here */}
          <div className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-320px)] transition-all duration-500 hover:border-[#9B59B6]/60 hover:shadow-[0_0_25px_rgba(155,89,182,0.3)]`}>
            <div className="bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFE0]/20 rounded-full blur-3xl opacity-50" />
              <div className="relative z-10 flex items-center space-x-4">
                <div className={`w-14 h-14 ${currentTheme.cardSecondaryBg} backdrop-blur-sm rounded-2xl flex items-center justify-center border border-[#00FFE0]/50`}>
                  <Brain className="w-7 h-7 text-[#00FFE0]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    AI Training Advisor
                  </h2>
                  <p className="text-white/80 text-sm">Powered by Meta Llama</p>
                </div>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 transition-all duration-300 ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] text-white shadow-[0_0_15px_rgba(30,144,255,0.4)]' 
                      : `${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} ${currentTheme.textPrimary} hover:border-[#00FFE0]`
                  }`}>
                    {msg.type === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className={`w-4 h-4 text-[#00FFE0]`} />
                        <span className={`text-xs text-[#00FFE0] font-semibold`}>AI Advisor</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {['Image Classification', 'Text Analysis', 'Audio Processing', 'Video Detection'].map((action, i) => (
                  <button
                    key={i}
                    className={`px-4 py-2 ${currentTheme.cardSecondaryBg} hover:bg-gradient-to-r hover:from-[#1E90FF]/20 hover:to-[#9B59B6]/20 border ${currentTheme.cardBorder} hover:border-[#00FFE0] rounded-full text-xs ${currentTheme.textSecondary} transition-all duration-300`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-6 border-t ${currentTheme.cardBorder}`}>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Describe your project..."
                  className={`flex-1 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-full px-6 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all duration-300 ${isDark ? 'focus:shadow-[0_0_15px_rgba(0,255,224,0.5)]' : 'focus:shadow-[0_0_15px_rgba(30,144,255,0.5)]'}`}
                />
                <button className={`w-12 h-12 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} hover:border-[#00FFE0] rounded-full flex items-center justify-center transition-all hover:scale-105`}>
                  <Upload className={`w-5 h-5 ${isDark ? 'text-[#00FFE0]' : 'text-[#1E90FF]'}`} />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="w-12 h-12 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-full flex items-center justify-center hover:scale-110 hover:shadow-[0_0_30px_rgba(0,255,224,0.7)] transition-all duration-300"
                >
                  <Send className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Marketplace - Glassmorphism applied here */}
          <div className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-320px)] transition-all duration-500 hover:border-[#00FFE0]/60 hover:shadow-[0_0_25px_rgba(0,255,224,0.3)]`}>
            <div className={`p-6 border-b ${currentTheme.cardBorder}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-1`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Model <span className={`bg-gradient-to-r from-[#9B59B6] to-[#00FFE0] bg-clip-text text-transparent`}>Marketplace</span>
                  </h2>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>10,000+ pre-trained models</p>
                </div>
                <button className="group px-6 py-2 bg-gradient-to-r from-[#9B59B6] to-[#1E90FF] rounded-full text-white text-sm font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(155,89,182,0.5)] transition-all duration-300 flex items-center space-x-2">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="relative">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  className={`w-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-full pl-12 pr-12 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all duration-300 ${isDark ? 'focus:shadow-[0_0_15px_rgba(0,255,224,0.5)]' : 'focus:shadow-[0_0_15px_rgba(30,144,255,0.5)]'}`}
                />
                <button className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 ${currentTheme.cardBg} border ${currentTheme.cardBorder} hover:border-[#9B59B6] rounded-full transition-all hover:scale-105`}>
                  <Filter className={`w-4 h-4 text-[#9B59B6]`} />
                </button>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} flex items-center space-x-2 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] bg-clip-text text-transparent`}>
                  <TrendingUp className={`w-5 h-5 text-[#00FFE0]`} />
                  <span>Most Popular This Week</span>
                </h3>
              </div>

              <div className="space-y-4">
                {popularModels.map((model, index) => (
                  <div
                    key={index}
                    className={`group ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(255,77,255,0.3)] hover:border-[#FF4DFF]`}
                    style={{
                      borderImage: isDark ? 'linear-gradient(45deg, #00FFE0, #9B59B6) 1' : 'none'
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-lg group-hover:text-[#00FFE0] transition-colors ${currentTheme.textPrimary}`}>
                            {model.name}
                          </h4>
                          <p className={`text-xs font-semibold text-[#00FFE0]`}>{model.category}</p>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 ${currentTheme.cardBg} border ${currentTheme.cardBorder} px-3 py-1 rounded-full`}>
                        <Star className={`w-3 h-3 text-yellow-300 fill-yellow-300`} />
                        <span className={`text-xs font-bold ${currentTheme.textPrimary}`}>{model.rating}</span>
                      </div>
                    </div>

                    <p className={`text-sm mb-4 leading-relaxed ${currentTheme.textSecondary}`}>{model.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {model.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className={`px-3 py-1 bg-black/30 border border-[#1E90FF]/30 rounded-full text-xs text-[#1E90FF] transition-colors group-hover:text-white group-hover:bg-[#1E90FF]`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className={`flex items-center justify-between pt-3 border-t ${currentTheme.cardBorder}`}>
                      <div className={`flex items-center space-x-4 text-xs ${currentTheme.textSecondary}`}>
                        <div className="flex items-center space-x-1">
                          <Users className={`w-4 h-4 text-[#00FFE0]`} />
                          <span>{model.downloads}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className={`w-4 h-4 text-[#1E90FF]`} />
                          <span>{model.performance}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className={`w-4 h-4 text-[#9B59B6]`} />
                          <span>{model.speed}</span>
                        </div>
                      </div>
                      <button className="px-4 py-1.5 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-full text-xs font-bold text-black opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                        Deploy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Custom Font for Headings */
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        .font-sans {
            font-family: 'Inter', sans-serif;
        }

        /* Neon Scrollbar for Dark Theme */
        .dark-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .dark-scrollbar::-webkit-scrollbar-track {
          background: #050505;
        }
        .dark-scrollbar::-webkit-scrollbar-thumb {
          background: #00FFE0;
          border-radius: 4px;
        }
        .dark-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1E90FF;
        }

        /* Light Scrollbar */
        .light-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .light-scrollbar::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        .light-scrollbar::-webkit-scrollbar-thumb {
          background: #1E90FF;
          border-radius: 4px;
        }
        .light-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00FFE0;
        }
      `}</style>
    </div>
  );
}
