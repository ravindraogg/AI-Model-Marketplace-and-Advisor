import React, { useState } from 'react';
import { LogIn, UserPlus, Box, Mail, Lock, User, Briefcase, Target, Code, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// You'll need to use a router library like react-router-dom for this.
// Assuming a useHistory or useNavigate hook is available from your routing setup.
import { useNavigate } from 'react-router-dom';

export default function AuthPage({ onSuccess }) {
  const navigate = useNavigate(); // This hook is used for navigation.
  const [isSignIn, setIsSignIn] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Essential
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Professional (Optional)
    company: '',
    role: '',
    experience: '',
    
    // Step 3: Interests (Optional)
    interests: [],
    useCases: []
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const interestsOptions = [
    { id: 'nlp', label: 'Natural Language Processing', icon: '📝' },
    { id: 'cv', label: 'Computer Vision', icon: '👁️' },
    { id: 'audio', label: 'Audio Processing', icon: '🔊' },
    { id: 'rl', label: 'Reinforcement Learning', icon: '🎮' },
    { id: 'ts', label: 'Time Series', icon: '📈' },
    { id: 'rec', label: 'Recommendation Systems', icon: '⭐' }
  ];

  const useCasesOptions = [
    { id: 'research', label: 'Research & Development' },
    { id: 'production', label: 'Production Deployment' },
    { id: 'education', label: 'Education & Learning' },
    { id: 'prototyping', label: 'Rapid Prototyping' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleArrayField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const validateStep = () => {
    if (isSignIn) {
      if (!formData.email || !formData.password) {
        setError('Email and password are required.');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address.');
        return false;
      }
      return true;
    }

    // Sign Up validation
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('All fields are required in this step.');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleAuth = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');
    
    try {
      let endpoint = '';
      let method = 'POST';
      let dataToSend = {};

      if (isSignIn) {
        endpoint = `${API_BASE_URL}/api/auth/signin`;
        dataToSend = {
          email: formData.email,
          password: formData.password,
        };
      } else {
        endpoint = `${API_BASE_URL}/api/auth/signup`;
        // Send all collected fields for registration
        dataToSend = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          company: formData.company,
          role: formData.role,
          experience: formData.experience,
          interests: formData.interests,
          useCases: formData.useCases,
        };
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle server-side errors (e.g., validation, user exists, wrong password)
        throw new Error(data.message || 'An authentication error occurred.');
      }
      
      // Check if the response contains a token (for both signin and signup)
      if (data.token) {
        // Successful Sign In OR Successful Sign Up (with token returned from backend)
        localStorage.setItem('authToken', data.token);
        onSuccess(data.token, data.user);
        navigate('/mainpage');
      } else if (!isSignIn) {
        // Successful Sign Up, but backend did not return token (old backend behavior)
        // We revert to the old 'must sign in' flow, but notify the user clearly.
        setError('Account created successfully! Please sign in with your new credentials.');
        
        setTimeout(() => {
          setIsSignIn(true);
          setCurrentStep(1);
          setFormData(prev => ({
            ...prev,
            name: '',
            password: '',
            confirmPassword: '',
          }));
          setError(''); 
        }, 3000);
      } else {
         // Should not happen for signin if response.ok is true, but handle unexpected structure
         throw new Error('Login successful, but no token received.');
      }

    } catch (err) {
      setError(err.message || 'Network error. Please check your connection.');
      console.error('Auth Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (isSignIn) {
      return (
        <div className="space-y-5">
          <div>
            <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-xl pl-12 pr-4 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-xl pl-12 pr-4 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
              />
            </div>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-xl pl-12 pr-4 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-xl pl-12 pr-4 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-xl pl-12 pr-4 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-xl pl-12 pr-4 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <p className="text-[#A6A6A6] text-sm mb-4">Help us personalize your experience (Optional)</p>
            
            <div>
              <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Company / Organization</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
                <input
                  type="text"
                  placeholder="Your company name"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-xl pl-12 pr-4 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Your Role</label>
              <div className="relative">
                <Code className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-xl pl-12 pr-4 py-3 text-[#E6E6E6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all appearance-none"
                >
                  <option value="" className="bg-[#0D0D0D]">Select your role</option>
                  <option value="ml-engineer" className="bg-[#0D0D0D]">ML Engineer</option>
                  <option value="data-scientist" className="bg-[#0D0D0D]">Data Scientist</option>
                  <option value="researcher" className="bg-[#0D0D0D]">Researcher</option>
                  <option value="developer" className="bg-[#0D0D0D]">Software Developer</option>
                  <option value="student" className="bg-[#0D0D0D]">Student</option>
                  <option value="other" className="bg-[#0D0D0D]">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#A6A6A6] text-sm mb-2 ml-1">Experience Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['Beginner', 'Intermediate', 'Expert'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleInputChange('experience', level)}
                    className={`py-3 rounded-xl border transition-all ${
                      formData.experience === level
                        ? 'bg-gradient-to-r from-[#1E90FF]/20 to-[#9B59B6]/20 border-[#00FFE0] text-[#00FFE0]'
                        : 'bg-[#0D0D0D] border-[#00FFE0]/20 text-[#A6A6A6] hover:border-[#00FFE0]/50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-[#E6E6E6] text-sm mb-3 ml-1">What are you interested in?</label>
              <div className="grid grid-cols-2 gap-3">
                {interestsOptions.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleArrayField('interests', interest.id)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      formData.interests.includes(interest.id)
                        ? 'bg-gradient-to-r from-[#1E90FF]/20 to-[#9B59B6]/20 border-[#00FFE0]'
                        : 'bg-[#0D0D0D] border-[#00FFE0]/20 hover:border-[#00FFE0]/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">{interest.icon}</span>
                      {formData.interests.includes(interest.id) && (
                        <Check className="w-4 h-4 text-[#00FFE0] ml-auto" />
                      )}
                    </div>
                    <p className={`text-sm ${formData.interests.includes(interest.id) ? 'text-[#E6E6E6]' : 'text-[#A6A6A6]'}`}>
                      {interest.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#E6E6E6] text-sm mb-3 ml-1">Primary Use Case</label>
              <div className="space-y-2">
                {useCasesOptions.map((useCase) => (
                  <button
                    key={useCase.id}
                    type="button"
                    onClick={() => toggleArrayField('useCases', useCase.id)}
                    className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
                      formData.useCases.includes(useCase.id)
                        ? 'bg-gradient-to-r from-[#1E90FF]/20 to-[#9B59B6]/20 border-[#00FFE0]'
                        : 'bg-[#0D0D0D] border-[#00FFE0]/20 hover:border-[#00FFE0]/50'
                    }`}
                  >
                    <span className={formData.useCases.includes(useCase.id) ? 'text-[#E6E6E6]' : 'text-[#A6A6A6]'}>
                      {useCase.label}
                    </span>
                    {formData.useCases.includes(useCase.id) && (
                      <Check className="w-5 h-5 text-[#00FFE0]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E6E6E6] relative overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#00FFE0]/5 rounded-full blur-3xl top-0 left-0 animate-pulse" />
        <div className="absolute w-96 h-96 bg-[#1E90FF]/5 rounded-full blur-3xl bottom-0 right-0 animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,224,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,224,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Back Button */}
      {currentStep > 1 && !isSignIn && (
        <button
          onClick={handleBack}
          className="fixed top-8 left-8 z-50 p-3 rounded-full bg-[#1A1A1A] border border-[#00FFE0]/20 text-[#00FFE0] hover:bg-[#1E90FF]/20 hover:border-[#1E90FF] transition-all"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Progress Bar */}
      {!isSignIn && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-[#1A1A1A]">
            <div
              className="h-full bg-gradient-to-r from-[#1E90FF] to-[#00FFE0] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-[#0D0D0D]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-[#00FFE0]/20 border-t-[#00FFE0] rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-[#00FFE0] text-lg font-semibold">
              {isSignIn ? 'Signing you in...' : 'Creating your account...'}
            </p>
          </div>
        </div>
      )}

      {/* Auth Card */}
      <div className="relative z-10 bg-[#1A1A1A] border border-[#00FFE0]/20 rounded-3xl p-10 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(0,255,224,0.1)]">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-xl flex items-center justify-center">
            <Box className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="text-[#00FFE0]">Model</span><span className="text-white">Nest</span>
          </span>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold mb-2 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {isSignIn ? (
            <span className="text-[#1E90FF]">Welcome Back</span>
          ) : (
            <span className="text-[#00FFE0]">
              {currentStep === 1 && 'Create Account'}
              {currentStep === 2 && 'Professional Info'}
              {currentStep === 3 && 'Your Interests'}
            </span>
          )}
        </h2>
        
        <p className="text-[#A6A6A6] text-center mb-8">
          {isSignIn 
            ? 'Sign in to continue to your AI workspace' 
            : currentStep === 1 
              ? 'Join thousands of AI developers' 
              : currentStep === 2
                ? 'Tell us about your work'
                : 'Customize your experience'}
        </p>

        {/* Step Indicator */}
        {!isSignIn && (
          <div className="flex items-center justify-center space-x-3 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    step < currentStep
                      ? 'bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] border-[#00FFE0]'
                      : step === currentStep
                        ? 'border-[#00FFE0] text-[#00FFE0]'
                        : 'border-[#00FFE0]/20 text-[#A6A6A6]'
                  }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5 text-white" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 ${step < currentStep ? 'bg-[#00FFE0]' : 'bg-[#00FFE0]/20'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start space-x-3">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">!</span>
            </div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Content */}
        {renderStepContent()}

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          {isSignIn ? (
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-xl text-white font-bold text-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_0_25px_rgba(30,144,255,0.4)] flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-4 bg-[#0D0D0D] border border-[#00FFE0]/20 hover:border-[#00FFE0] rounded-xl text-[#E6E6E6] font-semibold transition-all flex items-center space-x-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-4 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-xl text-white font-bold hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(30,144,255,0.4)] flex items-center justify-center space-x-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleAuth}
                  disabled={loading}
                  className="flex-1 py-4 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-xl text-white font-bold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-[0_0_25px_rgba(30,144,255,0.4)] flex items-center justify-center space-x-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </button>
              )}
            </div>
          )}

          {/* Toggle Sign In/Sign Up */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignIn(!isSignIn);
                setCurrentStep(1);
                setError('');
              }}
              className="text-sm text-[#00FFE0] hover:text-[#1E90FF] transition-colors"
            >
              {isSignIn ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
