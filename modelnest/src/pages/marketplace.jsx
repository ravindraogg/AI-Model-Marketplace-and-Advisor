import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Zap, Star, Users, TrendingUp, Clock, Shuffle, X, BarChart2, MessageSquare, ChevronDown, ChevronUp, Check, ExternalLink, Box, Sun, Moon, Settings, LogOut, Home } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;


const colorScheme = {
  dark: {
    bgPrimary: 'bg-[#050505]',
    textPrimary: 'text-[#E6E6E6]',
    textSecondary: 'text-[#A6A6A6]',
    // Updated cardBg to be slightly less opaque for better modern feel
    cardBg: 'bg-black/30 backdrop-blur-xl', 
    cardSecondaryBg: 'bg-black/15 backdrop-blur-lg',
    cardBorder: 'border-[#00FFE0]/30',
    scrollbarThumb: '#00FFE0',
  },
};

// --- Comprehensive Model Data and Categories ---
const CATEGORY_DATA = [
    { name: 'Natural Language Processing', short: 'NLP', tags: ['Transformer', 'BERT', 'GPT', 'Text Classification', 'NER', 'Summarization', 'Sentiment Analysis', 'HuggingFace', 'Tokenization'] },
    { name: 'Computer Vision', short: 'Vision', tags: ['CNN', 'ResNet', 'YOLO', 'Object Detection', 'Image Classification', 'Segmentation', 'OpenCV', 'ImageNet', 'PyTorch', 'TensorFlow'] },
    { name: 'Text-to-Speech', short: 'TTS', tags: ['Tacotron', 'WaveNet', 'Speech Synthesis', 'Voice Cloning', 'Deep Learning', 'PyTorch', 'Real-time'] },
    { name: 'Speech-to-Text', short: 'STT', tags: ['Whisper', 'ASR', 'DeepSpeech', 'Audio Transcription', 'NLP', 'Transformers', 'HuggingFace'] },
    { name: 'Audio/Music Generation', short: 'Audio', tags: ['WaveGAN', 'Jukebox', 'Audio Classification', 'Speech Enhancement', 'Voice Conversion', 'GANs'] },
    { name: 'Reinforcement Learning', short: 'RL', tags: ['Q-Learning', 'DQN', 'Policy Gradient', 'RLlib', 'Gym', 'Game AI', 'Deep RL'] },
    { name: 'Generative Models', short: 'Generation', tags: ['GAN', 'VAE', 'Stable Diffusion', 'Image Generation', 'DeepFakes', 'Style Transfer', 'Diffusion Models'] },
    { name: 'Time Series/Forecasting', short: 'Time Series', tags: ['LSTM', 'GRU', 'Prophet', 'ARIMA', 'Forecasting', 'Financial AI', 'Anomaly Detection'] },
    { name: 'Recommendation Systems', short: 'RecSys', tags: ['Collaborative Filtering', 'Matrix Factorization', 'Deep Learning', 'Content-based', 'Personalization', 'PyTorch'] },
    { name: 'Multi-modal AI', short: 'Multi-modal', tags: ['CLIP', 'DALL-E', 'Text-to-Image', 'Audio-Visual', 'Transformers', 'HuggingFace'] },
    { name: 'Object Detection/Segmentation', short: 'Detection', tags: ['YOLO', 'Mask R-CNN', 'Detectron2', 'Semantic Segmentation', 'Instance Segmentation'] },
    { name: 'Robotics/Control', short: 'Robotics', tags: ['RL', 'Kinematics', 'Path Planning', 'ROS', 'Simulation', 'OpenAI Gym', 'Gazebo'] },
    { name: 'Graph/Network Models', short: 'Graph', tags: ['GNN', 'Node Classification', 'Link Prediction', 'Graph Convolution', 'PyTorch Geometric'] },
    { name: 'Anomaly Detection', short: 'Anomaly', tags: ['Autoencoder', 'Isolation Forest', 'LSTM', 'Time Series', 'Fraud Detection', 'Cybersecurity'] },
    { name: 'Data Augmentation/Preprocessing', short: 'Data Prep', tags: ['SMOTE', 'Noise Injection', 'Image Augmentation', 'NLP Augmentation', 'Feature Scaling'] },
];

// Fallback Model Data Structure (Used only if API call fails or is still loading)
const FALLBACK_MODELS = [
  { id: 1, name: 'BERT-Large', category: 'NLP', performance: 98.5, speed: 45, downloads: 45.2, rating: 4.9, description: 'State-of-the-art transformer for text classification and NER.', tags: ['Transformer', 'Text Classification', 'HuggingFace', 'Fast'], reviews: 1540, platform: 'Hugging Face', url: 'https://huggingface.co/bert-large-uncased' },
  { id: 2, name: 'GPT-4o', category: 'Generation', performance: 99.0, speed: 80, downloads: 99.9, rating: 5.0, tags: ['GPT', 'Multimodal', 'OpenAI'], reviews: 5000, platform: 'OpenAI', url: 'https://platform.openai.com/docs/models/gpt-4o' },
  { id: 3, name: 'Llama 3 8B', category: 'Generation', performance: 95.5, speed: 5, downloads: 10.0, rating: 4.6, tags: ['LLM', 'Fast', 'Groq'], reviews: 800, platform: 'Groq', url: 'https://groq.com/products/llama-3/' },
  { id: 4, name: 'MobileNetV3', category: 'Vision', performance: 92.0, speed: 2, downloads: 30.1, rating: 4.5, tags: ['CNN', 'Vision', 'Mobile', 'TensorFlow'], reviews: 2100, platform: 'TensorFlow Hub', url: 'https://tfhub.dev/google/imagenet/mobilenet_v3_small_100_224/classification/5' },
  { id: 5, name: 'ResNet18', category: 'Vision', performance: 97.2, speed: 32, downloads: 38.7, rating: 4.8, description: 'Deep residual network for image recognition and transfer learning.', tags: ['CNN', 'Image Classification', 'PyTorch', 'Heavy'], reviews: 1200, platform: 'PyTorch Hub', url: 'https://pytorch.org/hub/pytorch_vision_resnet/' },
  { id: 6, name: 'SSD Detection', category: 'Detection', performance: 99.1, speed: 8, downloads: 29.5, rating: 4.9, description: 'Real-time object detection with state-of-the-art accuracy.', tags: ['Detection', 'Real-time', 'Vision'], reviews: 1800, platform: 'PyTorch Hub', url: 'https://pytorch.org/hub/nvidia_deeplearningexamples_ssd/' },
  { id: 7, name: 'Command R+', category: 'Generation', performance: 96.0, speed: 100, downloads: 15.0, rating: 4.7, tags: ['LLM', 'RAG', 'Cohere'], reviews: 750, platform: 'Cohere', url: 'https://cohere.com/models/command-r-plus' },
  { id: 8, name: 'Stable Diffusion', category: 'Generation', performance: 94.0, speed: 150, downloads: 70.0, rating: 4.8, tags: ['Image Generation', 'Diffusion'], reviews: 3000, platform: 'Replicate', url: 'https://replicate.com/stability-ai/stable-diffusion' },
  { id: 9, name: 'GPT-J 6B', category: 'Generation', performance: 95.0, speed: 90, downloads: 25.0, rating: 4.6, tags: ['Open Source', 'LLM', 'EleutherAI'], reviews: 1100, platform: 'EleutherAI/BigScience', url: 'https://huggingface.co/EleutherAI/gpt-j-6b' },
  { id: 10, name: 'GPT-2', category: 'Generation', performance: 88.0, speed: 30, downloads: 85.0, rating: 4.5, tags: ['Text Generation', 'Transformer'], reviews: 4500, platform: 'Hugging Face', url: 'https://huggingface.co/gpt2' },
];

// Helper component for star rating visualization
const RatingStars = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`w-4 h-4 transition-colors ${i < fullStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
      />
    );
  }
  return <div className="flex space-x-0.5">{stars}</div>;
};

// Helper function to render avatar initial (Placeholder as profile state is not here)
const renderAvatarInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
};


// --- Model Comparison Modal Component (Modern/Premium Restyle) ---
const ComparisonModal = ({ selectedModels, onClose, modelsData }) => {
  const models = modelsData.filter(m => selectedModels.includes(m.id));
  const currentTheme = colorScheme.dark;

  if (models.length < 2) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
        <div className="bg-black/30 border border-[#9B59B6]/40 backdrop-blur-xl rounded-3xl p-8 max-w-xl w-full text-center shadow-[0_0_50px_rgba(155,89,182,0.4)]">
          <X className="w-8 h-8 text-[#00FFE0] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Insufficient Models</h3>
          <p className="text-[#A6A6A6]">Please select at least two models to perform a meaningful comparison.</p>
          <button onClick={onClose} className="mt-6 px-6 py-2 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-full text-black font-semibold hover:scale-105 transition-all">
            Got It
          </button>
        </div>
      </div>
    );
  }
  
  // Use modelsData (all fetched models) to determine global max values for normalization
  const maxPerformanceGlobal = Math.max(...modelsData.map(m => m.performance)) || 100;
  const maxDownloadsGlobal = Math.max(...modelsData.map(m => m.downloads)) || 100;
  const visualizationMaxSpeed = Math.max(...modelsData.map(m => m.speed)) || 180;

  const metrics = [
    { key: 'performance', label: 'Accuracy Score', unit: '%', icon: TrendingUp, max: maxPerformanceGlobal, isHigherBetter: true },
    { key: 'speed', label: 'Inference Latency', unit: 'ms', icon: Clock, max: visualizationMaxSpeed, isHigherBetter: false },
    { key: 'downloads', label: 'Total Downloads', unit: 'M', icon: Users, max: maxDownloadsGlobal, isHigherBetter: true },
    { key: 'rating', label: 'Average Rating', unit: '/5', icon: Star, max: 5, isHigherBetter: true },
  ];

  const getBarWidth = (value, metric) => {
    if (metric.key === 'speed') {
      // Lower latency (speed) is better, so reverse the bar fill logic
      const normalized = 100 - (value / metric.max * 100);
      return Math.max(10, normalized); // Ensure min width for visual presence
    }
    return (value / metric.max) * 100;
  };
  
  const colors = ['#00FFE0', '#1E90FF', '#9B59B6'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className={`${currentTheme.cardBg} border border-[#00FFE0]/40 rounded-3xl p-8 max-w-6xl w-full text-white shadow-[0_0_50px_rgba(0,255,224,0.4)] relative`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 border border-[#1E90FF]/50 rounded-full hover:border-[#00FFE0] transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <h3 className="text-3xl font-extrabold text-white mb-8 border-b border-[#00FFE0]/20 pb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          <span className="bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] bg-clip-text text-transparent">Premium Model Comparison</span>
        </h3>

        {/* Model Header Row */}
        <div className="grid grid-cols-4 gap-4 text-sm font-semibold mb-6">
          <div className="col-span-1 text-left text-[#A6A6A6] pt-2">Model / Metrics</div>
          {models.map((model, index) => (
            <div 
              key={model.id} 
              className={`col-span-1 p-3 rounded-xl border border-white/10`}
              style={{ boxShadow: `0 0 10px ${colors[index % colors.length]}50` }}
            >
              <h4 className="font-bold text-lg" style={{ color: colors[index % colors.length] }}>{model.name}</h4>
              <p className="text-xs text-[#A6A6A6]">{model.platform}</p>
            </div>
          ))}
        </div>

        {/* --- Comparison Metrics Section --- */}
        <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-4 dark-scrollbar">
          {metrics.map((metric, metricIndex) => (
            <div key={metric.key} className="p-3 bg-black/20 rounded-lg border border-[#00FFE0]/10">
              <h4 className="font-semibold text-base text-[#E6E6E6] mb-3 flex items-center space-x-2">
                <metric.icon className="w-4 h-4 text-[#00FFE0]" />
                <span>{metric.label}</span>
                <span className="text-xs text-[#A6A6A6]">({metric.isHigherBetter ? 'Higher = Better' : 'Lower = Better'})</span>
              </h4>
              
              <div className="grid grid-cols-4 gap-4 items-center">
                {/* Empty left column for alignment */}
                <div className="col-span-1"></div> 

                {models.map((model, modelIndex) => {
                  const value = model[metric.key];
                  const barWidth = getBarWidth(value, metric);
                  const isRating = metric.key === 'rating';
                  const displayValue = isRating ? value.toFixed(1) : value.toLocaleString();

                  return (
                    <div key={model.id} className="col-span-1">
                      <div className="relative h-6 flex items-center">
                        <div className="absolute w-full h-2 bg-gray-700/50 rounded-full">
                          <div
                            className="h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${barWidth}%`,
                              background: colors[modelIndex % colors.length],
                              boxShadow: `0 0 8px ${colors[modelIndex % colors.length]}`
                            }}
                          />
                        </div>
                        {/* Numerical Value Overlay */}
                        <span className={`absolute right-0 top-1/2 -translate-y-1/2 transform text-xs px-2 py-0.5 rounded-full font-bold transition-all duration-500`}
                              style={{
                                backgroundColor: colors[modelIndex % colors.length],
                                color: 'black',
                                minWidth: '40px',
                                textAlign: 'center'
                              }}>
                          {displayValue}{metric.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Reviews/Community Metrics (Cleaned up) */}
          <div className="pt-6 border-t border-[#00FFE0]/20">
            <h4 className="font-semibold text-lg text-[#1E90FF] mb-4 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Community Reviews & Tags</span>
            </h4>
            <div className="grid grid-cols-4 gap-4">
              {models.map((model, index) => (
                <div key={model.id} className="col-span-1 p-4 bg-black/20 rounded-xl border border-[#1E90FF]/20">
                  <p className="text-sm font-bold text-[#E6E6E6] flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-[#00FFE0]" />
                    <span>{model.reviews ? model.reviews.toLocaleString() : 'N/A'} Reviews</span>
                  </p>
                  <div className="flex items-center mb-3">
                    <RatingStars rating={model.rating || 0} />
                    <span className="text-xs text-[#A6A6A6] ml-2">({(model.rating || 0).toFixed(1)} Score)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {model.tags && model.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-[#9B59B6]/30 text-[#9B59B6] border border-[#9B59B6]/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-[#9B59B6] to-[#1E90FF] rounded-xl text-white font-extrabold hover:scale-[1.03] transition-all duration-300 shadow-[0_0_20px_rgba(155,89,182,0.6)]">
            CLOSE ANALYTICS
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Filter Popover Component ---
const FilterPopover = ({ filters, setFilters, uniqueCategories, uniqueTags, onClose, currentTheme, CATEGORY_DATA }) => {
  const popoverRef = useRef();
  const TAG_LIMIT = 8;
  const CATEGORY_LIMIT = 4;
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click occurred outside the popover element
      // Ensure the filter button itself doesn't close the popover (handled by the parent onClick logic)
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const tagsToShow = showAllTags ? uniqueTags : uniqueTags.slice(0, TAG_LIMIT);
  const categoriesToShow = showAllCategories ? CATEGORY_DATA : CATEGORY_DATA.slice(0, CATEGORY_LIMIT);

  return (
    <div 
      ref={popoverRef}
      className={`absolute left-0 mt-2 w-72 z-50 p-5 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl shadow-2xl transition-all duration-300 transform origin-top-left`}
      style={{ boxShadow: '0 10px 30px rgba(0,255,224,0.3)' }}
    >
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h3 className="text-lg font-bold text-[#00FFE0] flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Quick Filters</span>
        </h3>
        <button onClick={onClose} className="p-1 text-[#A6A6A6] hover:text-white transition-colors rounded-full hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <h4 className="font-semibold text-sm mb-2 text-[#1E90FF]">Category</h4>
          <div className="space-y-2">
            {categoriesToShow.map(cat => (
              <label key={cat.short} className="flex items-center space-x-3 text-sm text-[#E6E6E6] cursor-pointer hover:text-[#00FFE0] transition-colors">
                <input
                  type="checkbox"
                  checked={filters.category.includes(cat.short)}
                  onChange={() => handleFilterChange('category', cat.short)}
                  className="form-checkbox h-4 w-4 text-[#00FFE0] bg-black/50 border-[#00FFE0]/50 rounded focus:ring-[#00FFE0] transition-colors"
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
          {CATEGORY_DATA.length > CATEGORY_LIMIT && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="mt-2 w-full text-center text-xs font-semibold text-[#1E90FF] hover:text-[#00FFE0] transition-colors"
            >
              {showAllCategories ? 'Show Less Categories' : `Load ${CATEGORY_DATA.length - CATEGORY_LIMIT} More Categories`}
            </button>
          )}
        </div>
        
        {/* Tags Filter */}
        <div>
          <h4 className="font-semibold text-sm mb-2 text-[#1E90FF]">Tags</h4>
          <div className="flex flex-wrap gap-2 pr-1">
            {tagsToShow.map(tag => (
              <button
                key={tag}
                onClick={() => handleFilterChange('tags', tag)}
                className={`px-3 py-1 text-xs rounded-full transition-colors border ${
                  filters.tags.includes(tag)
                    ? 'bg-[#00FFE0] text-black font-semibold shadow-[0_0_10px_rgba(0,255,224,0.5)] border-[#00FFE0]'
                    : 'bg-black/30 text-[#A6A6A6] border-[#9B59B6]/30 hover:border-[#00FFE0]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {uniqueTags.length > TAG_LIMIT && (
            <button
              onClick={() => setShowAllTags(!showAllTags)}
              className="mt-2 w-full text-center text-xs font-semibold text-[#1E90FF] hover:text-[#00FFE0] transition-colors"
            >
              {showAllTags ? 'Show Less Tags' : `Load ${uniqueTags.length - TAG_LIMIT} More Tags`}
            </button>
          )}
        </div>

        {/* Rating Filter */}
        <div>
          <h4 className="font-semibold text-sm mb-2 text-[#1E90FF]">Minimum Rating</h4>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={filters.minRating}
              onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-[#00FFE0]"
            />
            <span className="font-bold text-[#00FFE0]">{filters.minRating.toFixed(1)} <span className="text-sm text-[#A6A6A6]">stars</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Scoring function for Smart Search Relevance
 * Gives higher score to name matches, then category/tags, then description.
 * @param {object} model - The model object
 * @param {string} query - The search query
 * @returns {number} The relevance score
 */
const calculateRelevance = (model, query) => {
    const q = query.toLowerCase().trim();
    if (!q) return 0;

    let score = 0;
    const modelText = [
        model.name, 
        model.category, 
        ...model.tags, 
        model.description
    ].map(s => s.toLowerCase());

    // 1. Exact Name Match (Highest Priority)
    if (model.name.toLowerCase() === q) {
        score += 1000;
    }
    // 2. Name Starts With
    else if (model.name.toLowerCase().startsWith(q)) {
        score += 500;
    }
    // 3. Name Partial Match
    else if (model.name.toLowerCase().includes(q)) {
        score += 300;
    }

    // 4. Platform Match (New scoring field)
    if (model.platform.toLowerCase().includes(q)) {
        score += 200;
    }

    // 5. Category Match
    if (model.category.toLowerCase().includes(q)) {
        score += 150;
    }

    // 6. Tag Match
    if (model.tags.some(tag => tag.toLowerCase().includes(q))) {
        score += 100;
    }

    // 7. Description Match
    if (model.description.toLowerCase().includes(q)) {
        score += 50;
    }

    return score;
};


// --- Main Marketplace Component ---
export default function Marketplace() {
  const [allModels, setAllModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: [],
    tags: [],
    minRating: 0,
  });
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Added for Navbar
  const [showAIChatPopup, setShowAIChatPopup] = useState(false); // State for AI Chat popup
  const [aiChatPopupMessage, setAIChatPopupMessage] = useState(''); // State for AI Chat message
  
  // New state for pagination
  const [displayedModels, setDisplayedModels] = useState([]);
  const [pageSize] = useState(9); // Show 9 models at a time
  const [nextModelIndex, setNextModelIndex] = useState(0); // Index for lazy loading

  const currentTheme = colorScheme.dark;
  const isDark = true; // Hardcoded as only dark theme is defined here

  // --- AI Chat Popup Effects ---
  useEffect(() => {
    // Function to set message and start 30s auto-dismiss timer
    const setTimedAIChatPopup = (message) => {
        setAIChatPopupMessage(message);
        setShowAIChatPopup(true);

        const dismissTimer = setTimeout(() => {
            setShowAIChatPopup(false);
        }, 30000); // Popup disappears after 30 seconds

        return dismissTimer;
    };

    let timer1Dismiss, timer2Dismiss;
    
    // Message 1: Appears after 5 seconds
    const timer1 = setTimeout(() => {
        timer1Dismiss = setTimedAIChatPopup("Didn't find your required model? Train the model by just a simple prompt!");
    }, 5000);

    // Message 2: Appears after 3 minutes (180,000 ms)
    const timer2 = setTimeout(() => {
        timer2Dismiss = setTimedAIChatPopup("Need help choosing a model? Ask our AI Advisor!");
    }, 180000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer1Dismiss);
      clearTimeout(timer2Dismiss);
    };
  }, []);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/models/marketplace`);

        if (!response.ok) {
          throw new Error('Failed to fetch models from aggregator.');
        }

        const data = await response.json();
        
        // Ensure IDs are unique and numerical for use in comparison logic
        const modelsWithUniqueIds = data.map((model, index) => ({
            ...model,
            id: model.id || (index + 1), // Use existing ID or fall back to index
            // Ensure necessary fields exist for safety
            platform: model.platform || 'Unknown',
            tags: model.tags || [],
            performance: model.performance || 0,
            speed: model.speed || 0,
            downloads: model.downloads || 0,
            rating: model.rating || 0,
            reviews: model.reviews || 0,
        }));
        
        setAllModels(modelsWithUniqueIds);
        // Set initial displayed models
        setDisplayedModels(modelsWithUniqueIds.slice(0, pageSize));
        setNextModelIndex(pageSize);
      } catch (e) {
        console.error("Fetch Error:", e);
        setError(`Failed to load data. Using fallback models. Check backend URL: ${API_BASE_URL}`);
        // Use a small fallback set if the API fails
        setAllModels(FALLBACK_MODELS);
        setDisplayedModels(FALLBACK_MODELS.slice(0, pageSize));
        setNextModelIndex(pageSize);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []); // Run only on initial mount

  // Derive unique filter options based on the static data structure
  const uniqueCategories = useMemo(() => CATEGORY_DATA.map(cat => cat.short), []);
  const uniqueTags = useMemo(() => {
      const allTags = CATEGORY_DATA.flatMap(cat => cat.tags);
      return [...new Set(allTags)].sort(); // Sort tags alphabetically
  }, []);

  // Filtered model list and Smart Search
  const filteredModels = useMemo(() => {
    // FIX: Apply relevance filter only if searchTerm is not empty
    let models = allModels;

    if (searchTerm.trim() !== '') {
        models = allModels.map(model => ({
            ...model,
            relevance: calculateRelevance(model, searchTerm)
        })).filter(model => model.relevance > 0);
        // Sort by relevance (descending)
        models.sort((a, b) => b.relevance - a.relevance);
    } else {
      // If no search term, ensure relevance is 0 (or a neutral score) and skip the filter 
      models = allModels.map(model => ({ ...model, relevance: 0 }));
    }

    // Apply other filters to the (potentially) searched list
    models = models.filter(model => {
      // Category filter (uses short name)
      if (filters.category.length > 0 && !filters.category.includes(model.category)) return false;

      // Tag filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(selectedTag => model.tags.includes(selectedTag));
        if (!hasMatchingTag) return false;
      }
      
      // Rating filter
      if (model.rating < filters.minRating) return false;

      return true;
    });

    return models;
  }, [searchTerm, filters, allModels]);


  // Effect to reset pagination when filters or search terms change
  useEffect(() => {
    setDisplayedModels(filteredModels.slice(0, pageSize));
    setNextModelIndex(pageSize);
  }, [filteredModels, pageSize]);


  // Suggestion logic
  useEffect(() => {
    const q = searchTerm.toLowerCase().trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const suggested = allModels
      .map(model => ({
        name: model.name,
        score: calculateRelevance(model, q)
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Limit suggestions

    setSuggestions(suggested.map(s => s.name));
  }, [searchTerm, allModels]);

  // Handle Model Selection for Comparison
  const toggleCompare = (modelId) => {
    setSelectedForCompare(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else if (prev.length < 3) { // Limit comparison to 3 models
        return [...prev, modelId];
      }
      return prev; // Do nothing if already maxed out
    });
  };

  const handleLoadMore = () => {
    const newModels = filteredModels.slice(nextModelIndex, nextModelIndex + pageSize);
    setDisplayedModels(prev => [...prev, ...newModels]);
    setNextModelIndex(prev => prev + pageSize);
  };
  
  const clearAllFilters = () => {
    setFilters({ category: [], tags: [], minRating: 0 });
    setSearchTerm('');
    setShowFilterPopover(false);
  };
  
  // Placeholder for profile object (since the Marketplace doesn't manage it)
  const profile = { name: "Ravi Sharma", email: "ravi.s@example.com", company: "ModelNest Corp", role: "AI Developer" };
  
  // Placeholder for toggleTheme function
  const toggleTheme = () => { console.log("Theme Toggle Placeholder"); }; 


  if (loading) {
    return (
        <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} flex items-center justify-center relative overflow-hidden font-sans`}>
            <div className="text-center z-10">
                <div className="w-16 h-16 border-4 border-[#00FFE0]/20 border-t-[#00FFE0] rounded-full animate-spin mb-4 mx-auto" />
                <p className="text-xl text-[#00FFE0]">Fetching models from {API_BASE_URL}...</p>
                <p className="text-sm text-[#A6A6A6] mt-2">Aggregating data from multiple platforms...</p>
            </div>
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(0,255,224,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,224,0.04) 1px,transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>
        </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} relative overflow-hidden font-sans pt-20`}> {/* Added pt-20 to account for fixed navbar height */}
      {/* Navigation - Glassmorphism applied here (FIXED) */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${currentTheme.cardBg} border-b ${currentTheme.cardBorder} transition-colors duration-500`}>
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
              
              {/* Navigation Links */}
              {[
                { name: 'Home', url: '/mainpage', icon: Home },
                { name: 'MarketPlace', url: '/marketplace', icon: Search }, 
                { name: 'My Models', url: '#', icon: Zap }, 
                { name: 'Deployments', url: '#', icon: Box }
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  className={`hidden md:flex items-center space-x-1 ${currentTheme.textSecondary} hover:${
                    isDark ? 'text-[#00FFE0] hover:scale-105' : 'text-[#1E90FF] hover:scale-105'
                  } transition-all font-semibold`}
                >
                  {item.name}
                </a>
              ))}

              {/* Profile Menu (Placeholder) */}
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
                      <button
                        // Placeholder for opening settings modal
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

      {/* Background Grid (Fixed) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0,255,224,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,224,0.04) 1px,transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Comparison Modal */}
      {showCompareModal && (
        <ComparisonModal
          selectedModels={selectedForCompare}
          onClose={() => setShowCompareModal(false)}
          modelsData={allModels} // Pass all models for global max calculation
        />
      )}

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10 p-6 border-b border-[#00FFE0]/20">
          <h1 className="text-5xl font-extrabold mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] bg-clip-text text-transparent">Model Hub</span>
          </h1>
          <p className="text-xl text-[#A6A6A6]">Discover, filter, and compare cutting-edge AI models.</p>
          {error && (
            <div className="mt-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-sm text-red-300 flex items-center justify-between">
                <span>⚠️ {error}</span>
                <button 
                  onClick={clearAllFilters}
                  className="ml-4 px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-xs hover:bg-red-500/40 transition-all"
                >
                  Reset
                </button>
            </div>
          )}
        </header>

        {/* --- Search, Filter & Compare Controls (New Layout) --- */}
        <div className="mb-8 flex space-x-3">
          
          {/* 1. Filter Button & Popover */}
          <div className="relative z-40">
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={`p-3 rounded-full border ${currentTheme.cardBorder} hover:border-[#00FFE0] transition-all duration-300
                ${showFilterPopover || filters.category.length > 0 || filters.tags.length > 0 || filters.minRating > 0 
                    ? 'bg-[#00FFE0] text-black shadow-[0_0_15px_rgba(0,255,224,0.5)]' 
                    : 'bg-black/30 text-[#00FFE0]'}
              `}
              aria-label="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>

            {showFilterPopover && (
              <FilterPopover
                filters={filters}
                setFilters={setFilters}
                uniqueCategories={uniqueCategories}
                uniqueTags={uniqueTags}
                onClose={() => setShowFilterPopover(false)}
                currentTheme={currentTheme}
                CATEGORY_DATA={CATEGORY_DATA}
              />
            )}
          </div>

          {/* 2. Search Bar (Expands to fill space) */}
          <div className="relative flex-1 z-30">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => suggestions.length > 0 && setSuggestions(suggestions)} // Re-show suggestions on focus if populated
              placeholder={`Search across ${allModels.length} models...`}
              className={`w-full ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-full pl-12 pr-6 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.3)] transition-all`}
            />

            {/* Suggestions Dropdown */}
            {(suggestions.length > 0 && searchTerm.length >= 2) && (
                <div className={`absolute top-full mt-2 w-full ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl shadow-2xl overflow-hidden`}>
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setSearchTerm(suggestion);
                                setSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[#E6E6E6] hover:bg-[#1E90FF]/20 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
          </div>

          {/* 3. Compare Button */}
          <button
            onClick={() => setShowCompareModal(true)}
            disabled={selectedForCompare.length < 2}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-full text-black font-extrabold transition-all duration-300 shadow-lg 
              ${selectedForCompare.length >= 2
                ? 'bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(30,144,255,0.7)]'
                : 'bg-[#A6A6A6]/30 cursor-not-allowed opacity-60'
              }
            `}
          >
            <Shuffle className="w-5 h-5" />
            <span>Compare ({selectedForCompare.length}/3)</span>
          </button>
        </div>
        {/* --- End Controls --- */}

        {/* --- Model Cards --- */}
        <div className="flex-1">
          {displayedModels.length === 0 ? (
            <div className={`text-center p-12 mt-10 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl`}>
              <p className="text-xl text-[#A6A6A6] mb-4">No models match your current filters and search term.</p>
              <button 
                onClick={clearAllFilters}
                className="mt-4 px-6 py-2 bg-black/30 border border-[#9B59B6]/50 text-[#00FFE0] rounded-full hover:border-[#00FFE0] transition-all"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedModels.map((model) => {
                  const isSelected = selectedForCompare.includes(model.id);
                  const isMaxed = selectedForCompare.length === 3 && !isSelected;
                  
                  return (
                    <div
                      key={model.id}
                      className={`group ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] shadow-xl
                        ${isSelected 
                          ? 'border-[#00FFE0] ring-4 ring-[#00FFE0]/50 shadow-[0_0_30px_rgba(0,255,224,0.4)]' 
                          : isMaxed 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:border-[#9B59B6]/60 hover:shadow-[0_0_20px_rgba(155,89,182,0.3)]'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-xl flex items-center justify-center shadow-lg">
                            <Zap className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-[#00FFE0] transition-colors">{model.name}</h3>
                            {/* Display platform under category */}
                            <p className="text-sm font-semibold text-[#1E90FF]">{model.platform}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <div className={`${currentTheme.cardSecondaryBg} border border-[#9B59B6]/30 px-3 py-1 rounded-full flex items-center space-x-2`}>
                                <RatingStars rating={model.rating} />
                                <span className="text-sm font-bold text-[#E6E6E6]">{model.rating.toFixed(1)}</span>
                            </div>
                            <button 
                              onClick={() => toggleCompare(model.id)}
                              disabled={isMaxed && !isSelected}
                              className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200
                                ${isSelected 
                                  ? 'bg-[#00FFE0] text-black hover:bg-[#1E90FF] hover:text-white' 
                                  : isMaxed 
                                    ? 'bg-gray-700 text-gray-400' 
                                    : 'bg-black/30 text-[#00FFE0] border border-[#00FFE0] hover:bg-[#00FFE0] hover:text-black'
                                }
                              `}
                            >
                                {isSelected ? 'REMOVE' : 'COMPARE'}
                            </button>
                        </div>
                      </div>

                      <p className="text-sm mb-4 text-[#A6A6A6]">{model.description}</p>
                      
                      {/* Model Metrics */}
                      <div className="flex flex-wrap gap-4 border-t border-[#00FFE0]/20 pt-4">
                        <div className="flex items-center space-x-1 text-sm text-[#A6A6A6]">
                          <TrendingUp className="w-4 h-4 text-[#00FFE0]" />
                          <span className="font-bold text-white">{model.performance}%</span>
                          <span className="text-xs">(Acc)</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-[#A6A6A6]">
                          <Clock className="w-4 h-4 text-[#1E90FF]" />
                          <span className="font-bold text-white">{model.speed}ms</span>
                          <span className="text-xs">(Latency)</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-[#A6A6A6]">
                          <Users className="w-4 h-4 text-[#9B59B6]" />
                          <span className="font-bold text-white">{model.downloads}M</span>
                          <span className="text-xs">(Downloads)</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {model.tags && model.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-3 py-1 text-xs rounded-full bg-black/30 border border-[#1E90FF]/30 text-[#1E90FF] transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* View Model Link */}
                      <div className="mt-6 text-right">
                        <a 
                          href={model.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-[#9B59B6] to-[#1E90FF] rounded-full text-sm font-semibold text-white hover:scale-105 transition-all shadow-md hover:shadow-[0_0_15px_rgba(155,89,182,0.6)]"
                        >
                          <span>View Model</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Load More Button */}
              {nextModelIndex < filteredModels.length && (
                  <div className="text-center mt-12">
                      <button 
                          onClick={handleLoadMore}
                          className="px-8 py-3 bg-black/30 border border-[#00FFE0]/50 text-[#00FFE0] rounded-full text-lg font-semibold hover:bg-[#00FFE0]/20 transition-all"
                      >
                          Load More Models
                      </button>
                  </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* --- Floating AI Chat Button and Popup (FIXED POSITIONING, DYNAMIC WIDTH) --- */}
      <div className="fixed bottom-8 right-8 z-50">
        {/* Conditional popup message container (Slide-in transition) */}
<div 
  className={`absolute bottom-full right-0 mb-4 transition-all duration-300 ease-out 
              ${showAIChatPopup ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
>
  <div className={`p-4 inline-block ${currentTheme.cardBg} border border-[#00FFE0]/50 rounded-xl shadow-2xl whitespace-normal`}
       style={{ boxShadow: '0 0 20px rgba(0,255,224,0.5)', maxWidth: '280px' }} 
  >
    <div className="flex items-start space-x-2">
      <Zap className="w-5 h-5 text-[#00FFE0] flex-shrink-0 mt-0.5" />
      <p className="text-sm text-white leading-snug">{aiChatPopupMessage}</p>
    </div>
    <div className="flex justify-end mt-2">
      <button onClick={() => setShowAIChatPopup(false)} className="text-xs text-[#A6A6A6] hover:text-[#00FFE0] transition-colors">
        Dismiss
      </button>
    </div>
  </div>
</div>


        <button 
            onClick={() => {
                // Placeholder for opening chat interface
                console.log("AI Chat button clicked");
                setShowAIChatPopup(false); // Dismiss any current popups
            }}
            className="w-16 h-16 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 relative"
            style={{ 
                boxShadow: '0 0 20px rgba(0,255,224,0.8), 0 0 40px rgba(30,144,255,0.4)',
                animation: 'pulse 2s infinite'
            }}
        >
            <MessageSquare className="w-7 h-7 text-black fill-black" />
        </button>
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

        /* Neon Pulse Animation for Chat Button */
        @keyframes pulse {
            0% { box-shadow: 0 0 10px rgba(0,255,224,0.7), 0 0 20px rgba(30,144,255,0.3); }
            50% { box-shadow: 0 0 25px rgba(0,255,224,1), 0 0 50px rgba(30,144,255,0.7); }
            100% { box-shadow: 0 0 10px rgba(0,255,224,0.7), 0 0 20px rgba(30,144,255,0.3); }
        }
      `}</style>
    </div>
  );
}
