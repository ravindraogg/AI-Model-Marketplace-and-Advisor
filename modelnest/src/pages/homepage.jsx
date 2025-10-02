import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, TrendingUp, Star, Box, Search, Filter, ArrowRight, Zap, Clock, Users, ChevronRight, Brain, Upload } from 'lucide-react';

export default function Homepage() {
  const [chatMessage, setChatMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState([
    { type: 'assistant', text: 'Welcome to ModelNest! Tell me about your AI project, and I\'ll recommend the perfect model or help you train a custom one.' }
  ]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E6E6E6] relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 border border-[#00FFE0]/10 rounded-full"
          style={{
            left: mousePos.x * 0.015 + 'px',
            top: mousePos.y * 0.015 + 'px',
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,224,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,224,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Navigation */}
      <nav className="z-50 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-[#00FFE0]/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-[#00FFE0]">Model</span><span className="text-white">Nest</span>
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-[#A6A6A6] hover:text-[#00FFE0] transition-colors hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(0,255,224,0.6)]">
                Dashboard
              </button>
              <button className="text-[#A6A6A6] hover:text-[#00FFE0] transition-colors hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(0,255,224,0.6)]">
                My Models
              </button>
              <button className="text-[#A6A6A6] hover:text-[#00FFE0] transition-colors hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(0,255,224,0.6)]">
                Deployments
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center text-white font-bold border-2 border-[#00FFE0]/30 hover:border-[#00FFE0] transition-colors cursor-pointer">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Welcome back, <span className="text-[#00FFE0]">Developer</span> 👋
          </h1>
          <p className="text-[#A6A6A6] text-lg">What AI solution will you build today?</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Chat Box for Custom Model Training */}
          <div className="bg-[#1A1A1A] border border-[#00FFE0]/20 rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-280px)] hover:border-[#00FFE0]/40 transition-all duration-300">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFE0]/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-center space-x-4">
                <div className="w-14 h-14 bg-[#0D0D0D]/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-[#00FFE0]/30">
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

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] text-white shadow-[0_0_20px_rgba(30,144,255,0.3)]' 
                      : 'bg-[#0D0D0D] border border-[#00FFE0]/20 text-[#E6E6E6]'
                  }`}>
                    {msg.type === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#00FFE0]" />
                        <span className="text-xs text-[#00FFE0] font-semibold">AI Advisor</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: '🎯', text: 'Image Classification' },
                  { icon: '📝', text: 'Text Analysis' },
                  { icon: '🔊', text: 'Audio Processing' },
                  { icon: '🎬', text: 'Video Detection' }
                ].map((action, i) => (
                  <button
                    key={i}
                    className="px-4 py-2 bg-[#0D0D0D] hover:bg-gradient-to-r hover:from-[#1E90FF]/20 hover:to-[#9B59B6]/20 border border-[#00FFE0]/20 hover:border-[#00FFE0] rounded-full text-xs text-[#A6A6A6] hover:text-[#E6E6E6] transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,224,0.3)]"
                  >
                    {action.icon} {action.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-[#00FFE0]/10">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Describe your project or upload a dataset..."
                  className="flex-1 bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-full px-6 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
                />
                <button className="w-12 h-12 bg-[#0D0D0D] border border-[#00FFE0]/20 hover:border-[#00FFE0] rounded-full flex items-center justify-center transition-all hover:shadow-[0_0_15px_rgba(0,255,224,0.4)]">
                  <Upload className="w-5 h-5 text-[#00FFE0]" />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="w-12 h-12 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,224,0.5)] transition-all duration-300"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: AI Model Marketplace Preview */}
          <div className="bg-[#1A1A1A] border border-[#00FFE0]/20 rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-280px)] hover:border-[#00FFE0]/40 transition-all duration-300">
            {/* Marketplace Header */}
            <div className="p-6 border-b border-[#00FFE0]/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Model <span className="text-[#00FFE0]">Marketplace</span>
                  </h2>
                  <p className="text-[#A6A6A6] text-sm">10,000+ pre-trained models</p>
                </div>
                <button className="group px-6 py-2 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-full text-white text-sm font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,224,0.4)] transition-all duration-300 flex items-center space-x-2">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by task, model name, or category..."
                  className="w-full bg-[#0D0D0D] border border-[#00FFE0]/20 rounded-full pl-12 pr-12 py-3 text-[#E6E6E6] placeholder-[#A6A6A6] focus:outline-none focus:border-[#00FFE0] focus:shadow-[0_0_15px_rgba(0,255,224,0.2)] transition-all"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#1A1A1A] hover:bg-gradient-to-r hover:from-[#1E90FF]/20 hover:to-[#9B59B6]/20 border border-[#00FFE0]/20 hover:border-[#00FFE0] rounded-full transition-all">
                  <Filter className="w-4 h-4 text-[#00FFE0]" />
                </button>
              </div>
            </div>

            {/* Popular Models Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#00FFE0]" />
                  <span>Most Popular This Week</span>
                </h3>
              </div>

              <div className="space-y-4">
                {popularModels.map((model, index) => (
                  <div
                    key={index}
                    className="group bg-[#0D0D0D] hover:bg-gradient-to-r hover:from-[#1E90FF]/5 hover:to-[#9B59B6]/5 border border-[#00FFE0]/20 hover:border-[#FF4DFF] rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(255,77,255,0.3)]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg group-hover:text-[#00FFE0] transition-colors">
                            {model.name}
                          </h4>
                          <p className="text-[#00FFE0] text-xs font-semibold">{model.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 bg-[#1A1A1A] border border-[#00FFE0]/20 px-3 py-1 rounded-full">
                        <Star className="w-3 h-3 text-[#00FFE0] fill-[#00FFE0]" />
                        <span className="text-[#00FFE0] text-xs font-bold">{model.rating}</span>
                      </div>
                    </div>

                    <p className="text-[#A6A6A6] text-sm mb-4 leading-relaxed">{model.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {model.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-3 py-1 bg-[#1A1A1A] border border-[#00FFE0]/20 rounded-full text-xs text-[#A6A6A6]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#00FFE0]/10">
                      <div className="flex items-center space-x-4 text-xs text-[#A6A6A6]">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-[#00FFE0]" />
                          <span>{model.downloads}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-[#00FFE0]" />
                          <span>{model.performance}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-[#00FFE0]" />
                          <span>{model.speed}</span>
                        </div>
                      </div>
                      <button className="px-4 py-1.5 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-full text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-105">
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0D0D0D;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00FFE0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1E90FF;
        }
      `}</style>
    </div>
  );
}