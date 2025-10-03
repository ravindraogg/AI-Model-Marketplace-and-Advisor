import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Zap, Star, Users, TrendingUp, Clock, Code, DollarSign, Cloud, Server, ChevronLeft, GitPullRequest, Layers, Package, BarChart2, Check, ExternalLink, Sun, Moon, Home, Settings, LogOut, Box, Loader2, Heart, HeartCrack } from 'lucide-react'; // Added Heart, HeartCrack

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const colorScheme = {
  dark: {
    bgPrimary: 'bg-[#050505]',
    textPrimary: 'text-[#E6E6E6]',
    textSecondary: 'text-[#A6A6A6]',
    cardBg: 'bg-black/30 backdrop-blur-xl',
    cardSecondaryBg: 'bg-black/15 backdrop-blur-lg',
    cardBorder: 'border-[#00FFE0]/30',
    scrollbarThumb: '#00FFE0',
    navBg: 'bg-black/20',
    shadow: 'shadow-lg',
  },
  light: {
    bgPrimary: 'bg-[#f5f5ed]',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    cardBg: 'bg-white/80 backdrop-blur-lg',
    cardSecondaryBg: 'bg-gray-100/80 backdrop-blur-md',
    cardBorder: 'border-gray-300',
    scrollbarThumb: '#1E90FF',
    navBg: 'bg-white/80',
    shadow: 'shadow-md',
  },
};

const RatingStars = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`w-5 h-5 transition-colors ${i < fullStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
      />
    );
  }
  return <div className="flex space-x-1">{stars}</div>;
};

const renderAvatarInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
};

// Mock data for cost estimation (can remain outside as it is static)
const mockCosts = {
  'AWS': {
    name: 'Amazon Web Services (AWS)',
    hourly: 0.52,
    monthly: 375,
    gpu: 'g4dn.xlarge',
    description: 'GPU-optimized instance for inference.',
    link: 'https://aws.amazon.com/ec2/instance-types/g4/',
  },
  'GCP': {
    name: 'Google Cloud Platform (GCP)',
    hourly: 0.45,
    monthly: 325,
    gpu: 'n1-standard-4 + T4 GPU',
    description: 'General-purpose instance with a T4 GPU.',
    link: 'https://cloud.google.com/compute/gpus-pricing',
  },
  'Azure': {
    name: 'Microsoft Azure',
    hourly: 0.58,
    monthly: 415,
    gpu: 'Standard_NC6',
    description: 'NVIDIA K80-powered instance for deep learning.',
    link: 'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/nc-series/',
  },
  'On-Premise': {
    name: 'Your Own Server (On-Prem)',
    hardwareCost: 1500,
    monthlyPower: 50,
    description: 'Estimated cost for a dedicated consumer-grade GPU server (e.g., RTX 4070).',
  }
};

const DetailPageNavbar = ({ theme, currentTheme, modelName, toggleTheme }) => {
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    
    useEffect(() => {
        try {
          const storedProfile = sessionStorage.getItem('userProfile');
          if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
          }
        } catch (e) {
          console.error("Failed to load profile from session storage:", e);
        }
      }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 ${currentTheme.cardBg} border-b ${currentTheme.cardBorder} transition-colors duration-500`}>
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link to="/marketplace" className={`p-2 rounded-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} hover:border-[#00FFE0] transition-colors`} aria-label="Go Back to Marketplace">
                            <ChevronLeft className={`w-6 h-6 ${currentTheme.textPrimary}`} />
                        </Link>
                        <span className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            <span className="text-[#00FFE0]">Model</span><span className={currentTheme.textPrimary}>Nest / </span>
                            <span className="text-[#1E90FF] text-lg max-w-xs truncate inline-block align-middle">{modelName}</span>
                        </span>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-black/30 hover:bg-black/50 text-[#00FFE0]' : 'bg-white/30 hover:bg-white/50 text-[#1E90FF]'}`}
                            aria-label="Toggle theme"
                            style={{ boxShadow: isDark ? '0 0 10px rgba(0,255,224,0.3)' : '0 0 10px rgba(30,144,255,0.3)' }}
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        
                        {[
                            { name: 'Home', url: '/mainpage', icon: Home },
                            { name: 'Marketplace', url: '/marketplace', icon: Zap },
                            { name: 'My Models', url: '/mymodels', icon: Heart }, // Added My Models link
                            { name: 'Deployments', url: '#', icon: Box }
                        ].map((item) => (
                            <Link
                                key={item.name}
                                to={item.url}
                                className={`hidden md:flex items-center space-x-1 ${currentTheme.textSecondary} hover:${
                                    isDark ? 'text-[#00FFE0] hover:scale-105' : 'text-[#1E90FF] hover:scale-105'
                                } transition-all font-semibold`}
                            >
                                {item.name}
                            </Link>
                        ))}

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
                                    <div className={`p-4 bg-gradient-to-r from-[#1E90FF]/40 to-[#9B59B6]/40 border-b ${currentTheme.cardBorder}`}>
                                        <p className={`font-bold ${currentTheme.textPrimary}`}>{profile?.name}</p>
                                        <p className={`text-sm ${currentTheme.textSecondary}`}>{profile?.email}</p>
                                        {profile?.company && (
                                            <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>{profile.company} • {profile.role}</p>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => { console.log("Open Settings Modal"); setShowProfileMenu(false); }}
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
    );
};

// Helper function for file export
const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Utility function to parse code from markdown blocks
const extractCode = (response) => {
  const dockerMatch = response.match(/```dockerfile\n([\s\S]*?)\n```/i);
  const pythonMatch = response.match(/```python\n([\s\S]*?)\n```/i);

  const defaultCode = "# Failed to generate code. Please try again.";

  return {
    dockerfile: dockerMatch ? dockerMatch[1].trim() : defaultCode,
    pythonCode: pythonMatch ? pythonMatch[1].trim() : defaultCode,
  };
};

export default function ModelDetail({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const { modelName: encodedModelName } = useParams(); 
  const modelName = decodeURIComponent(encodedModelName);
  
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState(null); // success | error | null
  
  const [generatedCode, setGeneratedCode] = useState({
      dockerfile: "# Click 'Generate Deployment Code' to get your files.",
      pythonCode: "# Click 'Generate Deployment Code' to get your files.",
  });

  const currentTheme = colorScheme[theme || 'dark'];
  const isDark = theme === 'dark';

  const fetchModelDetails = useCallback(async (encodedName) => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/api/models/marketplace/${encodedName}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Model details not found.');
      }

      const data = await response.json();
      setModel(data);

      // Check if model is already favorited
      const token = localStorage.getItem('authToken');
      if (token) {
        const favoriteCheckResponse = await fetch(`${API_BASE_URL}/api/models/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (favoriteCheckResponse.ok) {
            const favorites = await favoriteCheckResponse.json();
            const isFav = favorites.some(fav => fav.modelName === data.name);
            setIsFavorite(isFav);
        }
      }

    } catch (e) {
      console.error("Fetch Error:", e);
      setError("Failed to load model details. Please go back to the marketplace.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const handleFavoriteToggle = async () => {
    if (!model) return;
    
    // Simple state change for UI feedback
    if (isFavorite) {
        // In a real app, you would add logic to unfavorite here (DELETE route).
        setFavoriteStatus('error'); 
        setTimeout(() => setFavoriteStatus(null), 3000);
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        setFavoriteStatus('error');
        // In a real app, redirect to signin
        setTimeout(() => setFavoriteStatus(null), 3000);
        return; 
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/models/favorite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                modelName: model.name,
                platform: model.platform,
                category: model.category,
            })
        });

        if (response.ok) {
            setIsFavorite(true);
            setFavoriteStatus('success');
        } else {
            const errorData = await response.json();
            if (response.status === 409) { // Duplicate
                setIsFavorite(true);
                setFavoriteStatus('success');
            } else {
                throw new Error(errorData.message || 'Failed to save favorite.');
            }
        }
    } catch (error) {
        console.error("Error saving favorite:", error);
        setFavoriteStatus('error');
    } finally {
        setTimeout(() => setFavoriteStatus(null), 3000);
    }
  };


  const fetchAICode = useCallback(async () => {
    if (!model) return;

    setCodeLoading(true);
    const token = localStorage.getItem('authToken');
    const userPrompt = `Generate a Dockerfile and a Python (Flask/FastAPI) deployment file (app.py) for the model named "${model.name}" from the platform ${model.platform}. 
    The Python file should include boilerplate for loading the model via Hugging Face Transformers pipeline (assuming the environment is set up). 
    IMPORTANT: Provide the Dockerfile inside a \`\`\`dockerfile\n...\n\`\`\` block and the Python code inside a \`\`\`python\n...\n\`\`\` block. 
    DO NOT include any text, explanations, or formatting outside these two code blocks.`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ message: userPrompt })
        });

        if (!response.ok) {
            throw new Error('AI service failed to generate code.');
        }

        const result = await response.json();
        const aiText = result.reply || "Error: No reply received.";
        
        const extracted = extractCode(aiText);
        setGeneratedCode(extracted);

    } catch (error) {
        console.error("Error fetching AI code:", error);
        setGeneratedCode({
            dockerfile: `## Failed to generate Dockerfile: ${error.message}`,
            pythonCode: `## Failed to generate app.py: ${error.message}`,
        });
    } finally {
        setCodeLoading(false);
    }
  }, [model, API_BASE_URL]);


  useEffect(() => {
    fetchModelDetails(encodedModelName);
  }, [fetchModelDetails, encodedModelName]);

  const handleExportDocker = () => {
      // Export with NO extension
      downloadFile(generatedCode.dockerfile, 'Dockerfile', 'text/plain');
  };

  const handleExportPython = () => {
      downloadFile(generatedCode.pythonCode, 'app.py', 'text/python');
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} flex items-center justify-center`}>
        <div className="text-center z-10">
          <div className="w-16 h-16 border-4 border-[#00FFE0]/20 border-t-[#00FFE0] rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-xl text-[#00FFE0]">Loading model details...</p>
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} flex flex-col items-center justify-center p-8 text-center`}>
        <h1 className="text-4xl font-extrabold text-red-500 mb-4">{error || "Model data is missing."}</h1>
        <Link to="/marketplace" className={`px-6 py-2 bg-gradient-to-r from-[#9B59B6] to-[#1E90FF] rounded-full text-white font-semibold hover:scale-105 transition-all`}>
          Go to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} relative overflow-hidden font-sans pt-20`}>
        
      {/* Navigation Bar */}
      <DetailPageNavbar theme={theme} currentTheme={currentTheme} modelName={modelName} toggleTheme={toggleTheme} />

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: isDark ? 'linear-gradient(rgba(0,255,224,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,224,0.04) 1px,transparent 1px)' : 'linear-gradient(rgba(30,144,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(30,144,255,0.08) 1px,transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        
        {/* Model Title Header */}
        <header className="flex items-center space-x-4 mb-8 border-b border-[#00FFE0]/20 pb-4">
          <h1 className={`text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] bg-clip-text text-transparent`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {model.name}
          </h1>
          {/* FAVORITE BUTTON */}
          <button
              onClick={handleFavoriteToggle}
              className={`p-3 rounded-full border transition-all duration-300 ${
                  isFavorite 
                      ? 'border-red-500 bg-red-500/20 text-red-400 hover:scale-110'
                      : `${currentTheme.cardSecondaryBg} ${currentTheme.cardBorder} text-[#9B59B6] hover:scale-110 hover:border-[#9B59B6]`
              }`}
          >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-400' : 'fill-transparent'}`} />
          </button>
        </header>

        {/* Status Notification */}
        {favoriteStatus === 'success' && (
            <div className="fixed bottom-5 right-5 z-50 p-4 bg-green-600/90 text-white rounded-lg shadow-xl flex items-center space-x-2 animate-bounce">
                <Check className="w-5 h-5" />
                <span>Model saved to My Models!</span>
            </div>
        )}
        {favoriteStatus === 'error' && (
            <div className="fixed bottom-5 right-5 z-50 p-4 bg-red-600/90 text-white rounded-lg shadow-xl flex items-center space-x-2 animate-bounce">
                <HeartCrack className="w-5 h-5" />
                <span>Failed to save or already favorited/Signed out!</span>
            </div>
        )}


        {/* Top-level Model Info */}
        <div className={`p-8 mb-8 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl transition-all duration-300`}>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-4">
              <Zap className="w-8 h-8 text-[#00FFE0]" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Category</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>{model.category}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Layers className="w-8 h-8 text-[#1E90FF]" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Platform</p>
                <a href={model.url} target="_blank" rel="noopener noreferrer" className={`text-xl font-bold ${currentTheme.textPrimary} hover:text-[#1E90FF] transition-colors`}>
                  {model.platform}
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Star className="w-8 h-8 text-yellow-400" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Rating</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>{model.rating.toFixed(1)}</p>
                  <RatingStars rating={model.rating} />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Users className="w-8 h-8 text-[#9B59B6]" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Downloads</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>{model.downloads}M</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Model Overview & Metrics */}
            <div className={`p-8 mb-6 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl`}>
              <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} flex items-center space-x-2 mb-4`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <BarChart2 className="w-6 h-6 text-[#00FFE0]" />
                <span>Performance & Details</span>
              </h2>
              <p className={`text-base leading-relaxed ${currentTheme.textSecondary} mb-6`}>{model.description}</p>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-[#00FFE0]/20 flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-[#00FFE0]" />
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Accuracy</p>
                    <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>{model.performance}%</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-[#1E90FF]/20 flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-[#1E90FF]" />
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Latency</p>
                    <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>{model.speed}ms</p>
                  </div>
                </div>
                {/* Official Page Button relocated here */}
                <a 
                  href={model.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="md:col-span-2 p-4 rounded-xl border border-[#9B59B6]/20 flex items-center justify-center space-x-2 bg-gradient-to-r from-[#9B59B6]/20 to-transparent hover:from-[#9B59B6]/40 transition-all duration-300"
                >
                  <ExternalLink className="w-5 h-5 text-[#9B59B6]" />
                  <span className="text-sm font-semibold text-[#9B59B6]">Go to Official Page</span>
                </a>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-6">
                {model.tags && model.tags.map((tag) => (
                  <span key={tag} className={`px-3 py-1 text-xs rounded-full ${isDark ? 'bg-black/30 border border-[#1E90FF]/30 text-[#1E90FF]' : 'bg-gray-200 border border-[#1E90FF]/50 text-[#1E90FF]'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Deployment Section (AI Code Generation) */}
            <div className={`p-8 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl`}>
              <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} flex items-center space-x-2 mb-4`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <Package className="w-6 h-6 text-[#1E90FF]" />
                <span>AI Deployment Code Generator</span>
              </h2>
              <p className={`text-sm ${currentTheme.textSecondary} mb-6`}>
                  Get production-ready boilerplate code generated by the AI Advisor, tailored for 
                  <span className={`inline-block mx-1 px-2 py-0.5 rounded-md text-black font-semibold 
                      ${isDark 
                          ? 'bg-gradient-to-r from-[#00FFE0] to-[#1E90FF]' 
                          : 'bg-gradient-to-r from-[#1E90FF] to-[#00FFE0]'}`}>
                      {model.name}
                  </span>.
              </p>
              
              <div className="mb-6">
                  <button 
                      onClick={fetchAICode}
                      disabled={codeLoading}
                      className={`w-full py-3 rounded-xl text-black font-extrabold transition-all duration-300 disabled:opacity-50 
                          ${codeLoading 
                              ? 'bg-[#A6A6A6]/70 cursor-wait' 
                              : 'bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(30,144,255,0.7)]'
                          }`}
                  >
                      {codeLoading ? (
                          <span className="flex items-center justify-center space-x-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>GENERATING CODE...</span>
                          </span>
                      ) : (
                          'GENERATE DEPLOYMENT CODE'
                      )}
                  </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-semibold text-lg ${currentTheme.textPrimary} flex items-center space-x-2`}>
                      <GitPullRequest className="w-5 h-5 text-[#9B59B6]" />
                      <span>Dockerfile</span>
                    </h3>
                    <button
                        onClick={handleExportDocker}
                        disabled={codeLoading}
                        className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-full text-xs font-bold text-black hover:scale-105 transition-all disabled:opacity-50"
                    >
                        <span>Export Dockerfile</span>
                    </button>
                  </div>
                  <div className={`p-4 mt-2 ${currentTheme.cardSecondaryBg} rounded-xl overflow-x-auto border ${currentTheme.cardBorder}`}>
                    <pre className={`text-sm ${currentTheme.textSecondary}`}>{generatedCode.dockerfile}</pre>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-semibold text-lg ${currentTheme.textPrimary} flex items-center space-x-2`}>
                      <Code className="w-5 h-5 text-[#9B59B6]" />
                      <span>Python API Code (`app.py`)</span>
                    </h3>
                    <button
                        onClick={handleExportPython}
                        disabled={codeLoading}
                        className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-full text-xs font-bold text-black hover:scale-105 transition-all disabled:opacity-50"
                    >
                        <span>Export app.py</span>
                    </button>
                  </div>
                  <div className={`p-4 mt-2 ${currentTheme.cardSecondaryBg} rounded-xl overflow-x-auto border ${currentTheme.cardBorder}`}>
                    <pre className={`text-sm ${currentTheme.textSecondary}`}>{generatedCode.pythonCode}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Cost Estimation */}
          <div className="lg:col-span-1">
            <div className={`p-8 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl sticky top-28`}>
              <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} flex items-center space-x-2 mb-4`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <DollarSign className="w-6 h-6 text-[#9B59B6]" />
                <span>Deployment Costs</span>
              </h2>
              <p className={`text-sm ${currentTheme.textSecondary} mb-6`}>Estimated costs to run this model on various platforms.</p>
              
              <div className="space-y-6">
                {Object.entries(mockCosts).map(([provider, costs]) => (
                  <div key={provider} className="p-4 border border-white/10 rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      {provider === 'On-Premise' ? <Server className="w-6 h-6 text-[#00FFE0]" /> : <Cloud className="w-6 h-6 text-[#1E90FF]" />}
                      <h3 className={`font-bold text-lg ${currentTheme.textPrimary}`}>{costs.name}</h3>
                    </div>
                    <p className={`text-sm ${currentTheme.textSecondary} mb-2`}>{costs.description}</p>
                    {provider !== 'On-Premise' ? (
                      <>
                        <p className={`text-xs ${currentTheme.textSecondary} mb-2`}>Instance: {costs.gpu}</p>
                        <div className="flex items-center justify-between font-semibold mt-4">
                          <p className="text-sm">Hourly Cost:</p>
                          <span className={`text-lg font-bold ${currentTheme.textPrimary}`}>${costs.hourly}</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold">
                          <p className="text-sm">Monthly Cost:</p>
                          <span className={`text-lg font-bold ${currentTheme.textPrimary}`}>~${costs.monthly}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between font-semibold mt-4">
                          <p className="text-sm">Initial Hardware:</p>
                          <span className={`text-lg font-bold ${currentTheme.textPrimary}`}>~${costs.hardwareCost}</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold">
                          <p className="text-sm">Monthly Power:</p>
                          <span className={`text-lg font-bold ${currentTheme.textPrimary}`}>~${costs.monthlyPower}</span>
                        </div>
                      </>
                    )}
                    {costs.link && (
                      <a href={costs.link} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-end text-xs font-semibold text-[#1E90FF] hover:text-[#00FFE0] transition-colors">
                        <span>View Pricing</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        .font-sans {
            font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
