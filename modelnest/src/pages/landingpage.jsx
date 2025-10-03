import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Sparkles, Zap, Box, Search, LineChart, Rocket, ChevronRight, Brain, Code, Cloud, Database, Cpu, Network, TrendingUp, Star, Clock, Users } from 'lucide-react';
import { Link } from "react-router-dom";

// Component for the model details tooltip
const ModelDetailsTooltip = ({ model, mousePos, theme, currentTheme }) => {
  if (!model) return null;

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-[#1A1A1A]' : 'bg-white';
  const borderColor = isDark ? 'border-[#00FFE0]/50' : 'border-[#1E90FF]/50';

  return (
    <div
      className={`fixed z-[100] p-4 rounded-xl shadow-2xl border ${bgColor} ${borderColor} max-w-xs transition-opacity duration-100 pointer-events-none`}
      style={{
        left: `${mousePos.x + 20}px`,
        top: `${mousePos.y + 20}px`,
      }}
    >
      <h4 className={`text-xl font-bold mb-1 ${currentTheme.textPrimary}`}>{model.name}</h4>
      <p className="text-[#1E90FF] text-sm mb-3 font-semibold">{model.category}</p>
      
      <p className={`text-sm mb-4 ${currentTheme.textSecondary}`}>{model.description}</p>

      <div className="space-y-2 border-t pt-3 mt-3 border-gray-500/20">
        <div className="flex items-center justify-between text-sm">
          <span className={`flex items-center space-x-2 ${currentTheme.textPrimary}`}>
            <Star className="w-4 h-4 text-[#00FFE0] fill-[#00FFE0]" />
            <span>Rating:</span>
          </span>
          <span className="font-bold text-[#00FFE0]">{model.rating}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className={`flex items-center space-x-2 ${currentTheme.textPrimary}`}>
            <Users className="w-4 h-4 text-[#1E90FF]" />
            <span>Downloads:</span>
          </span>
          <span className={`font-bold ${currentTheme.textPrimary}`}>{model.users}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className={`flex items-center space-x-2 ${currentTheme.textPrimary}`}>
            <TrendingUp className="w-4 h-4 text-[#1E90FF]" />
            <span>Performance:</span>
          </span>
          <span className={`font-bold ${currentTheme.textPrimary}`}>{model.performance}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-500/20">
        {model.tags && model.tags.map((tag, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-[#0D0D0D] text-[#A6A6A6] border border-[#00FFE0]/20' : 'bg-gray-100 text-gray-600'}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function LandingPage() {
  // Initialize theme from localStorage, default to 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredModel, setHoveredModel] = useState(null); // New state for tooltip
  const heroRef = useRef(null);

  // Define color schemes for dynamic switching
  const colorScheme = {
    light: {
      bgPrimary: 'bg-[#f5f5ed]',
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-600',
      cardBg: 'bg-white',
      cardBorder: 'border-gray-200',
      navBg: 'bg-[#f5f5ed]',
      gridColor: 'rgba(30,144,255,0.08)',
      highlightColor: '#1E90FF',
      // Hero chip light gradient
      chipGradient: 'linear-gradient(135deg, rgba(30,144,255,0.25) 0%, rgba(155,89,182,0.25) 20%, rgba(0,255,224,0.2) 60%, rgba(0,255,224,0) 89%)',
      // Card hover/glow colors
      glowPrimary: 'shadow-[0_0_30px_rgba(30,144,255,0.3)]',
      glowSecondary: 'shadow-[0_0_30px_rgba(155,89,182,0.4)]',
    },
    dark: {
      bgPrimary: 'bg-[#0D0D0D]',
      textPrimary: 'text-[#E6E6E6]',
      textSecondary: 'text-[#A6A6A6]',
      cardBg: 'bg-[#1A1A1A]',
      cardBorder: 'border-[#00FFE0]/20',
      navBg: 'bg-[#0D0D0D]',
      gridColor: 'rgba(0,255,224,0.03)',
      highlightColor: '#00FFE0',
      // Hero chip dark gradient (original)
      chipGradient: 'linear-gradient(135deg, rgba(30,144,255,0.2) 0%, rgba(155,89,182,0.2) 20%, rgba(0,255,224,0.2) 60%, rgba(0,255,224,0) 89%)',
      // Card hover/glow colors
      glowPrimary: 'hover:shadow-[0_0_30px_rgba(0,255,224,0.3)]',
      glowSecondary: 'hover:shadow-[0_0_30px_rgba(255,77,255,0.4)]',
    }
  };

  const currentTheme = colorScheme[theme];

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };


  useEffect(() => {
    setIsVisible(true);
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [theme]); // Rerun effect when theme changes to save preference

  const features = [
    {
      icon: <Search className={`w-8 h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />,
      title: "Smart Discovery",
      description: "Browse 10,000+ AI models with intelligent search and filtering across all major platforms"
    },
    {
      icon: <Brain className={`w-8 h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />,
      title: "AI Advisor",
      description: "Chat with our Meta Llama-powered advisor for personalized model recommendations"
    },
    {
      icon: <Zap className={`w-8 h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />,
      title: "Cerebras Training",
      description: "Train custom models 100x faster with Cerebras wafer-scale acceleration"
    },
    {
      icon: <LineChart className={`w-8 h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />,
      title: "Live Benchmarking",
      description: "Compare models on accuracy, speed, and resource usage in real-time"
    },
    {
      icon: <Cloud className={`w-8 h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />,
      title: "One-Click Deploy",
      description: "Deploy to cloud, edge, or local with Docker containerization"
    },
    {
      icon: <Network className={`w-8 h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />,
      title: "3D Visualization",
      description: "Explore model architectures and training metrics in interactive 3D"
    }
  ];

  const topModels = [
    { name: "BERT-Large", category: "NLP", users: "45K", performance: "98.5%", rating: 4.8, description: "State-of-the-art transformer for text classification and Named Entity Recognition (NER).", tags: ["NLP", "Transformer", "Classification"] },
    { name: "ResNet-152", category: "Vision", users: "38K", performance: "97.2%", rating: 4.5, description: "Deep residual network optimized for highly accurate image recognition tasks on large datasets.", tags: ["CNN", "ImageNet", "Transfer Learning"] },
    { name: "GPT-3.5", category: "Text Gen", users: "52K", performance: "96.8%", rating: 4.9, description: "Powerful generative language model for conversational AI, summarization, and code generation.", tags: ["Generative", "LLM", "API"] },
    { name: "YOLO v8", category: "Detection", users: "29K", performance: "99.1%", rating: 4.7, description: "Cutting-edge model providing real-time, high-accuracy object detection across diverse environments.", tags: ["Detection", "Real-time", "Vision"] }
  ];

  return (
    <div className={`min-h-screen overflow-hidden relative font-sans ${currentTheme.bgPrimary} ${currentTheme.textPrimary}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Geometric shapes that follow mouse */}
        <div 
          className={`absolute w-96 h-96 border ${theme === 'light' ? 'border-[#1E90FF]/30' : 'border-[#00FFE0]/20'} rounded-full`}
          style={{
            left: mousePos.x * 0.02 + 'px',
            top: mousePos.y * 0.02 + 'px',
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute w-64 h-64 border border-[#9B59B6]/30 rounded-full"
          style={{
            right: -mousePos.x * 0.015 + 'px',
            bottom: -mousePos.y * 0.015 + 'px'
          }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 ${theme === 'light' ? 'bg-[#1E90FF]' : 'bg-[#00FFE0]'} rounded-full animate-pulse`}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
              opacity: 0.3
            }}
          />
        ))}

        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px,transparent 1px),linear-gradient(90deg,${currentTheme.gridColor} 1px,transparent 1px)`,
            backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Model Details Tooltip (outside main content flow, fixed position) */}
      <ModelDetailsTooltip model={hoveredModel} mousePos={mousePos} theme={theme} currentTheme={currentTheme} />

      {/* Header */}
      <header className={`relative z-50 px-8 py-6 ${currentTheme.navBg} border-b ${theme === 'light' ? 'border-gray-200' : 'border-[#00FFE0]/10'}`}>
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-lg flex items-center justify-center relative">
              <Box className="w-7 h-7 text-white" />
              <div className="absolute inset-0 bg-[#00FFE0] opacity-0 group-hover:opacity-20 rounded-lg transition-opacity duration-300" />
            </div>
            <span className="text-3xl font-bold tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="text-[#1E90FF]">Model</span><span className={currentTheme.textPrimary}>Nest</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-8">
            {['Features', 'Marketplace', 'Advisor', 'Deploy'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                // Using dynamic color variables for hover effects
                className={`${currentTheme.textSecondary} hover:text-[${currentTheme.highlightColor}] transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-[0_0_8px_rgba(30,144,255,0.8)] cursor-pointer`}
              >
                {item}
              </a>
            ))}
            {/* Theme Switcher Button */}
            <button
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-colors duration-300 ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-[#1A1A1A] hover:bg-gray-800 text-[#00FFE0]'}`}
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Link to = "/auth">
            <button className="px-6 py-2 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-lg text-white font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(30,144,255,0.6)] transition-all duration-300">
              Get Started
            </button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Glowing Chip Component (Positioned behind text) */}
          <div 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                  // Centralize the chip on the text area
                  position: 'absolute',
                  top: '40%', // Slightly adjust to align with text
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '700px', // Larger width to cover the whole header
                  height: '300px', // Adjusted height
                  zIndex: 0, // Ensure it is behind the z-10 text
                  // Diagonal gradient from bottom-left (89% transparent) to top-right (0% transparent)
                  background: currentTheme.chipGradient,
                  filter: 'blur(100px)', // Increased blur for a softer glow
                  borderRadius: '30% 70% 50% 50%', // Oval/Chip shape
              }}
          />
          {/* End Glowing Chip Component */}

          <div className={`inline-flex items-center space-x-2 px-4 py-2 ${theme === 'light' ? 'bg-white border-[#1E90FF]/30 shadow-lg' : 'bg-[#1A1A1A] border-[#00FFE0]/30'} rounded-full mb-8 relative z-10 border`}>
            <Sparkles className={`w-4 h-4 ${theme === 'light' ? 'text-[#1E90FF]' : 'text-[#00FFE0]'}`} />
            <span className={`text-sm ${theme === 'light' ? 'text-[#1E90FF]' : 'text-[#00FFE0]'}`}>Next-Gen AI Model Platform</span>
          </div>
          
          <h1 className={`text-7xl font-bold mb-6 leading-tight tracking-tight relative z-10 ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Your AI Model
            <br />
            <span className="bg-gradient-to-r from-[#1E90FF] via-[#00FFE0] to-[#9B59B6] bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>
          
          <p className={`text-xl mb-12 max-w-3xl mx-auto leading-relaxed relative z-10 ${currentTheme.textSecondary}`}>
            Discover, train, and deploy AI models at lightning speed. Powered by Cerebras acceleration 
            and Meta Llama intelligence—all in one futuristic platform.
          </p>

          <div className="flex items-center justify-center space-x-6 relative z-10">
            <button className="group relative px-10 py-5 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-xl text-lg font-bold text-white overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl">
              <span className="relative z-10 flex items-center space-x-2">
                <Rocket className="w-5 h-5" />
                <span>Launch Platform</span>
              </span>
              <div className="absolute inset-0 bg-[#00FFE0] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute inset-0 shadow-[0_0_30px_rgba(30,144,255,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <button className={`px-10 py-5 ${currentTheme.cardBg} border-2 ${theme === 'light' ? 'border-gray-300 text-gray-800 hover:border-[#1E90FF] hover:shadow-[0_0_20px_rgba(30,144,255,0.4)]' : 'border-[#1E90FF]/50 text-[#E6E6E6] hover:border-[#00FFE0] hover:shadow-[0_0_20px_rgba(0,255,224,0.4)]'} rounded-xl text-lg font-bold transition-all duration-300`}>
              Watch Demo
            </button>
          </div>

          {/* Floating 3D Element Placeholder */}
          <div className="mt-20 relative h-64 z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 relative animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-3xl opacity-20 blur-2xl" />
                <div className={`absolute inset-4 ${currentTheme.cardBg} border ${theme === 'light' ? 'border-[#1E90FF]/50 shadow-lg' : 'border-[#00FFE0]/30'} rounded-3xl flex items-center justify-center`}>
                  <Cpu className={`w-16 h-16 ${theme === 'light' ? 'text-[#1E90FF]' : 'text-[#00FFE0]'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className={`text-5xl font-bold mb-4 ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="text-[#1E90FF]">Power</span> Features
          </h2>
          <p className={`text-lg ${currentTheme.textSecondary}`}>Everything you need to master AI model deployment</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl p-8 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#1E90FF] ${theme === 'light' ? 'shadow-md hover:shadow-[0_0_30px_rgba(30,144,255,0.3)]' : 'hover:shadow-[0_0_30px_rgba(0,255,224,0.3)]'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E90FF]/0 to-[#9B59B6]/0 group-hover:from-[#1E90FF]/10 group-hover:to-[#9B59B6]/10 transition-all duration-300" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-white">
                  {/* Icons are already white inside the gradient background */}
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${currentTheme.textPrimary}`}>{feature.title}</h3>
                <p className={`leading-relaxed ${currentTheme.textSecondary}`}>{feature.description}</p>
              </div>

              <div className={`absolute top-0 right-0 w-32 h-32 ${theme === 'light' ? 'bg-[#1E90FF]/5' : 'bg-[#00FFE0]/5'} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </section>

      {/* ChatAdvisor Preview */}
      <section id="advisor" className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl overflow-hidden ${theme === 'light' ? 'shadow-xl' : ''}`}>
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-12 flex flex-col justify-center">
              <h2 className={`text-4xl font-bold mb-6 ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-[#1E90FF]">AI-Powered</span> Advisor
              </h2>
              <p className={`text-lg mb-8 leading-relaxed ${currentTheme.textSecondary}`}>
                Chat with our Meta Llama-powered advisor. Describe your project, and get instant model recommendations tailored to your specific needs.
              </p>
              <div className="space-y-4">
                {['Natural language queries', 'Real-time recommendations', 'Benchmark comparisons'].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center text-white">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <span className={currentTheme.textPrimary}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${theme === 'light' ? 'bg-gray-50 border-l border-gray-200' : 'bg-[#0D0D0D] border-l border-[#00FFE0]/20'} p-8`}>
              <div className={`${theme === 'light' ? 'bg-gray-200 border-gray-300' : 'bg-[#1A1A1A] border-[#1E90FF]/30'} rounded-2xl p-4 mb-4 border`}>
                <p className={`text-sm ${currentTheme.textSecondary} mb-2`}>You:</p>
                <p className={currentTheme.textPrimary}>I need a model for sentiment analysis on customer reviews</p>
              </div>
              <div className={`
                ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-gradient-to-r from-[#1E90FF]/10 to-[#9B59B6]/10 border-[#00FFE0]/30'} 
                rounded-2xl p-4 border`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className={`w-4 h-4 ${theme === 'light' ? 'text-[#1E90FF]' : 'text-[#00FFE0]'}`} />
                  <p className={`text-sm ${theme === 'light' ? 'text-[#1E90FF]' : 'text-[#00FFE0]'}`}>AI Advisor:</p>
                </div>
                <p className={`${currentTheme.textPrimary} mb-4`}>Based on your requirements, I recommend:</p>
                <div className="space-y-2">
                  {['BERT-Base (98.5% accuracy)', 'RoBERTa-Large (99.1% accuracy)'].map((model, i) => (
                    <div key={i} className={`${currentTheme.cardBg} rounded-lg p-3 border ${theme === 'light' ? 'border-gray-200 hover:border-[#1E90FF] shadow-sm' : 'border-[#00FFE0]/20 hover:border-[#00FFE0]'} transition-colors cursor-pointer ${currentTheme.textPrimary}`}>
                      <p className="text-sm">{model}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section id="marketplace" className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold mb-4 ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="text-[#1E90FF]">Model</span> Marketplace
          </h2>
          <p className={`text-lg ${currentTheme.textSecondary}`}>10,000+ pre-trained models ready to deploy</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topModels.map((model, index) => (
            <div
              key={index}
              className={`group ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:border-[#9B59B6] ${theme === 'light' ? 'shadow-md hover:shadow-[0_0_30px_rgba(155,89,182,0.4)]' : 'hover:shadow-[0_0_30px_rgba(255,77,255,0.4)]'}`}
              onMouseEnter={() => setHoveredModel({ ...model, id: index })}
              onMouseLeave={() => setHoveredModel(null)}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-xl mb-4 flex items-center justify-center text-white">
                <Database className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-2`}>{model.name}</h3>
              <p className="text-[#1E90FF] text-sm mb-4">{model.category}</p>
              <div className="flex justify-between text-sm">
                <span className={currentTheme.textSecondary}>{model.users} users</span>
                <span className="text-[#1E90FF]">{model.performance}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 py-20">
        <div className="bg-gradient-to-r from-[#1E90FF]/20 to-[#9B59B6]/20 backdrop-blur-sm rounded-3xl p-16 border border-[#1E90FF]/30 text-center relative overflow-hidden shadow-2xl">
          <div className={`absolute top-0 right-0 w-64 h-64 ${theme === 'light' ? 'bg-[#1E90FF]/10' : 'bg-[#00FFE0]/10'} rounded-full blur-3xl`} />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9B59B6]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className={`text-5xl font-bold mb-6 ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Ready to <span className="text-[#1E90FF]">Transform</span> Your AI Workflow?
            </h2>
            <p className={`text-xl mb-10 max-w-2xl mx-auto ${currentTheme.textSecondary}`}>
              Join thousands of developers building the future with ModelNest
            </p>
            <button className="px-12 py-5 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-xl text-xl font-bold text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(30,144,255,0.6)] transition-all duration-300 shadow-xl">
              Start Building Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 border-t ${theme === 'light' ? 'border-gray-300' : 'border-[#00FFE0]/10'} mt-20`}>
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-lg flex items-center justify-center text-white">
                <Box className="w-6 h-6" />
              </div>
              <span className={`text-2xl font-bold ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-[#1E90FF]">Model</span><span className={currentTheme.textPrimary}>Nest</span>
              </span>
            </div>
            <p className={currentTheme.textSecondary}>© 2025 ModelNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
