import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Upload, Code, Zap, Layers, GitPullRequest, Sun, Moon, Home, Settings, LogOut, ExternalLink, Package, Loader2, ChevronLeft, Save } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;


const colorScheme = {
  dark: {
    bgPrimary: 'bg-[#050505]',
    textPrimary: 'text-[#E6E6E6]',
    textSecondary: 'text-[#A6A6A6]',
    cardBg: 'bg-black/30 backdrop-blur-xl',
    cardSecondaryBg: 'bg-black/15 backdrop-blur-lg',
    cardBorder: 'border-[#00FFE0]/30',
    navBg: 'bg-black/20',
  },
  light: {
    bgPrimary: 'bg-[#f5f5ed]',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    cardBg: 'bg-white/80 backdrop-blur-lg',
    cardSecondaryBg: 'bg-gray-100/80 backdrop-blur-md',
    cardBorder: 'border-gray-300',
    navBg: 'bg-white/80',
  },
};

// --- Embed Components ---

// Simple Iframe component for embedding GitHub/HuggingFace links
const EmbedViewer = ({ url, currentTheme }) => {
    if (!url) return <p className={`${currentTheme.textSecondary} p-4`}>No valid URL provided for embedding.</p>;

    let src = url;
    let title = "Code/Model Repository";
    
    // Attempt to make Hugging Face links embeddable if possible (using direct link is usually safest)
    if (url.includes('huggingface.co')) {
        title = "Hugging Face Model Page";
    } 
    // Attempt to make GitHub links embeddable (using the raw content viewer is tricky due to X-Frame-Options, but we'll use the repo view as a fallback)
    else if (url.includes('github.com')) {
        // GitHub does not allow embedding the repository page easily. We show the link instead.
        return (
            <div className={`p-4 ${currentTheme.cardSecondaryBg} rounded-xl border ${currentTheme.cardBorder}`}>
                <p className={`${currentTheme.textPrimary} mb-2 font-semibold`}>GitHub Repository Link:</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-[#1E90FF] hover:text-[#00FFE0] transition-colors text-sm">
                    <ExternalLink className="w-4 h-4" />
                    <span>{url}</span>
                </a>
                <p className={`${currentTheme.textSecondary} text-xs mt-2`}>Note: Direct embedding of GitHub repositories is restricted for security reasons. Click the link to view the code.</p>
            </div>
        );
    }
    
    // For general URLs or HuggingFace
    return (
        <div className={`w-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl overflow-hidden`}>
            <iframe 
                src={src} 
                title={title} 
                className="w-full h-80 border-0" 
                allowFullScreen
            />
        </div>
    );
};

// --- Add New Model Modal ---
const NewTrainedModelModal = ({ currentTheme, onSave, onClose }) => {
    const isDark = currentTheme.bgPrimary === colorScheme.dark.bgPrimary;
    const [formData, setFormData] = useState({
        name: '', description: '', gitUrl: '', hfUrl: '', baseModel: '', category: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const inputStyle = `w-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl px-4 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all duration-300 ${isDark ? 'focus:shadow-[0_0_15px_rgba(0,255,224,0.5)]' : 'focus:shadow-[0_0_15px_rgba(30,144,255,0.5)]'}`;

    const handleSave = async () => {
        if (!formData.name || !formData.gitUrl) {
            setSaveError("Model Name and GitHub URL are mandatory.");
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            // Error is handled in onSave (handleSaveTrainedModel) with a throw
            setSaveError(error.message || "Failed to save the model.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 transition-opacity duration-300">
            <div className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative transition-transform duration-500 scale-100`}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-3xl font-extrabold ${currentTheme.textPrimary} bg-gradient-to-r from-[#9B59B6] to-[#1E90FF] bg-clip-text text-transparent`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        Log Custom Trained Model
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-3 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-full hover:border-red-500 transition-all`}
                    >
                        <ExternalLink className={`w-5 h-5 ${currentTheme.textPrimary}`} />
                    </button>
                </div>

                {saveError && (
                    <div className="p-3 mb-4 bg-red-600/20 text-red-400 border border-red-500 rounded-xl">
                        Error: {saveError}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Model Name (Required)</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={inputStyle} />
                    </div>
                    <div>
                        <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>GitHub Repository URL (Required)</label>
                        <input type="url" value={formData.gitUrl} onChange={(e) => setFormData({...formData, gitUrl: e.target.value})} className={inputStyle} placeholder="e.g., https://github.com/myuser/my-model-repo" />
                    </div>
                    <div>
                        <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Hugging Face URL (Optional)</label>
                        <input type="url" value={formData.hfUrl} onChange={(e) => setFormData({...formData, hfUrl: e.target.value})} className={inputStyle} placeholder="e.g., https://huggingface.co/myuser/my-model" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Base Model Used (Optional)</label>
                            <input type="text" value={formData.baseModel} onChange={(e) => setFormData({...formData, baseModel: e.target.value})} className={inputStyle} placeholder="e.g., Llama-3, ResNet-50" />
                        </div>
                        <div>
                            <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Category (Optional)</label>
                            <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={inputStyle} placeholder="e.g., NLP, Vision" />
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm mb-2 ${currentTheme.textSecondary}`}>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={`${inputStyle} h-24`} />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full mt-6 py-3 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-xl text-black font-extrabold hover:scale-[1.01] transition-all duration-300 disabled:opacity-50`}
                >
                    {isSaving ? (
                        <span className="flex items-center justify-center space-x-2"><Loader2 className="w-5 h-5 animate-spin" /><span>SAVING MODEL...</span></span>
                    ) : (
                        <span className="flex items-center justify-center space-x-2"><Save className="w-5 h-5" /><span>SAVE TRAINED MODEL</span></span>
                    )}
                </button>
            </div>
        </div>
    );
};


// --- Main Component ---
export default function MyModels({ theme, toggleTheme }) {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [trainedModels, setTrainedModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTrainedModal, setShowTrainedModal] = useState(false);
    // NEW: State for user profile data
    const [profile, setProfile] = useState(null); 

    const currentTheme = colorScheme[theme || 'dark'];
    const isDark = theme === 'dark';

    const renderAvatarInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    // NEW: Fetch profile from session storage
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


    const fetchModels = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setLoading(false);
            // In a real app, you would redirect to signin
            return; 
        }

        try {
            // 1. Fetch Favorites
            const favResponse = await fetch(`${API_BASE_URL}/api/models/favorites`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (favResponse.ok) {
                setFavorites(await favResponse.json());
            } else {
                console.error("Failed to fetch favorites:", favResponse.statusText);
                setFavorites([]);
            }

            // 2. Fetch Trained Models
            const trainedResponse = await fetch(`${API_BASE_URL}/api/models/trained`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (trainedResponse.ok) {
                setTrainedModels(await trainedResponse.json());
            } else {
                console.error("Failed to fetch trained models:", trainedResponse.statusText);
                setTrainedModels([]);
            }
        } catch (error) {
            console.error("Network error fetching models:", error);
        } finally {
            setLoading(false);
        }
    }, []); // Removed API_BASE_URL from dependencies since it's static

    const handleSaveTrainedModel = async (formData) => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Authentication required.");

        const response = await fetch(`${API_BASE_URL}/api/models/trained`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({...formData, status: "Deployed?" }) // Added status field
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save trained model.');
        }

        // FIX: The save was successful, now refresh the list
        await fetchModels();
    };


    useEffect(() => {
        fetchModels();
    }, [fetchModels]);


    if (loading) {
        return (
            <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} flex items-center justify-center`}>
                <div className="text-center z-10">
                    <div className="w-16 h-16 border-4 border-[#00FFE0]/20 border-t-[#00FFE0] rounded-full animate-spin mb-4 mx-auto" />
                    <p className="text-xl text-[#00FFE0]">Loading your models...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} relative overflow-hidden font-sans pt-20`}>
            
            {/* New Trained Model Modal */}
            {showTrainedModal && (
                <NewTrainedModelModal 
                    currentTheme={currentTheme} 
                    onSave={handleSaveTrainedModel} 
                    onClose={() => setShowTrainedModal(false)} 
                />
            )}

            {/* Navigation Bar (Simplified) */}
            <nav className={`fixed top-0 left-0 right-0 z-50 ${currentTheme.cardBg} border-b ${currentTheme.cardBorder} transition-colors duration-500`}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link to="/mainpage" className={`p-2 rounded-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} hover:border-[#00FFE0] transition-colors`} aria-label="Go Back to Home">
                                <ChevronLeft className={`w-6 h-6 ${currentTheme.textPrimary}`} />
                            </Link>
                            <span className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                {/* FIX: Updated Navbar Title Format */}
                                <span className="text-[#00FFE0]">Model</span><span className={currentTheme.textPrimary}>Nest / </span>
                                <span className="text-[#1E90FF]">My Models</span>
                            </span>
                        </div>
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-black/30 hover:bg-black/50 text-[#00FFE0]' : 'bg-white/30 hover:bg-white/50 text-[#1E90FF]'}`}
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            {/* Profile Avatar from session storage */}
                            <div className={`w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center text-white font-bold text-lg border-2 ${currentTheme.cardBorder}`}>
                                {renderAvatarInitial(profile?.name || "User")}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0" style={{
                    backgroundImage: isDark ? 'linear-gradient(rgba(0,255,224,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,224,0.04) 1px,transparent 1px)' : 'linear-gradient(rgba(30,144,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(30,144,255,0.08) 1px,transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                <h1 className={`text-4xl font-extrabold mb-8 ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    <span className="text-[#1E90FF]">My </span>Model <span className="text-[#00FFE0]">Hub</span>
                </h1>
                
                {/* Favorites Section */}
                <div className={`mb-10 p-8 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl transition-all duration-300`}>
                    <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} flex items-center space-x-3 mb-6`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                        <span>Favorite Models ({favorites.length})</span>
                    </h2>
                    
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.length > 0 ? (
                            favorites.map((fav, index) => (
                                <Link 
                                    to={`/model/${encodeURIComponent(fav.modelName)}`}
                                    key={index} 
                                    className={`p-5 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(30,144,255,0.4)] hover:border-[#1E90FF]/60`}
                                >
                                    <div>
                                        <h3 className={`font-bold text-lg ${currentTheme.textPrimary} mb-1`}>{fav.modelName}</h3>
                                        <div className="flex items-center space-x-3 text-sm">
                                            <span className={`text-[#00FFE0] font-semibold flex items-center space-x-1`}><Layers className="w-4 h-4" /><span>{fav.platform}</span></span>
                                            <span className={`text-[#9B59B6] flex items-center space-x-1`}><Package className="w-4 h-4" /><span>{fav.category}</span></span>
                                        </div>
                                    </div>
                                    <p className={`text-xs ${currentTheme.textSecondary} mt-3`}>Favorited on: {new Date(fav.createdAt).toLocaleDateString()}</p>
                                </Link>
                            ))
                        ) : (
                            <p className={`${currentTheme.textSecondary} sm:col-span-3 text-center p-8`}>You haven't added any models to your favorites yet. Explore the Marketplace!</p>
                        )}
                    </div>
                </div>

                {/* Trained Models Section */}
                <div className={`p-8 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl transition-all duration-300`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} flex items-center space-x-3`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            <Upload className="w-6 h-6 text-[#00FFE0]" />
                            <span>Trained Models ({trainedModels.length})</span>
                        </h2>
                        <button
                            onClick={() => setShowTrainedModal(true)}
                            className="px-6 py-2 bg-gradient-to-r from-[#9B59B6] to-[#00FFE0] rounded-full text-black text-sm font-bold hover:scale-105 transition-all flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Log New Model</span>
                        </button>
                    </div>

                    <div className="space-y-8">
                        {trainedModels.length > 0 ? (
                            trainedModels.map((trained, index) => (
                                <div key={index} className={`p-6 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-2xl`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className={`font-extrabold text-xl ${currentTheme.textPrimary} mb-1`}>{trained.name}</h3>
                                            <div className="flex flex-wrap items-center space-x-4 text-sm">
                                                <span className={`text-[#1E90FF] font-semibold flex items-center space-x-1`}><Package className="w-4 h-4" /><span>{trained.category || 'Custom'}</span></span>
                                                <span className={`text-[#9B59B6] flex items-center space-x-1`}><Zap className="w-4 h-4" /><span>Base: {trained.baseModel || 'N/A'}</span></span>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-green-500/30 text-green-300 text-xs font-semibold rounded-full border border-green-500">{trained.status}</span>
                                    </div>

                                    <p className={`text-base ${currentTheme.textSecondary} mb-4`}>{trained.description}</p>
                                    
                                    {/* Code/Embed Section */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="md:col-span-1">
                                            <h4 className={`font-semibold ${currentTheme.textPrimary} flex items-center space-x-2 mb-2`}>
                                                <GitPullRequest className="w-5 h-5 text-[#1E90FF]" />
                                                <span>GitHub Repository</span>
                                            </h4>
                                            <EmbedViewer url={trained.gitUrl} currentTheme={currentTheme} />
                                        </div>
                                        
                                        {trained.hfUrl && (
                                            <div className="md:col-span-1">
                                                <h4 className={`font-semibold ${currentTheme.textPrimary} flex items-center space-x-2 mb-2`}>
                                                    <Code className="w-5 h-5 text-[#00FFE0]" />
                                                    <span>Hugging Face Page</span>
                                                </h4>
                                                <EmbedViewer url={trained.hfUrl} currentTheme={currentTheme} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={`${currentTheme.textSecondary} text-center p-8`}>You haven't logged any custom trained models yet. Click "Log New Model" to get started!</p>
                        )}
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
