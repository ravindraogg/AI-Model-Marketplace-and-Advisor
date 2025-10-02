import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Zap, Box, Search, LineChart, Rocket, ChevronRight, Brain, Code, Cloud, Database, Cpu, Network } from 'lucide-react';
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Smart Discovery",
      description: "Browse 10,000+ AI models with intelligent search and filtering across all major platforms"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Advisor",
      description: "Chat with our Meta Llama-powered advisor for personalized model recommendations"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Cerebras Training",
      description: "Train custom models 100x faster with Cerebras wafer-scale acceleration"
    },
    {
      icon: <LineChart className="w-8 h-8" />,
      title: "Live Benchmarking",
      description: "Compare models on accuracy, speed, and resource usage in real-time"
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "One-Click Deploy",
      description: "Deploy to cloud, edge, or local with Docker containerization"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "3D Visualization",
      description: "Explore model architectures and training metrics in interactive 3D"
    }
  ];

  const topModels = [
    { name: "BERT-Large", category: "NLP", users: "45K", performance: "98.5%" },
    { name: "ResNet-152", category: "Vision", users: "38K", performance: "97.2%" },
    { name: "GPT-3.5", category: "Text Gen", users: "52K", performance: "96.8%" },
    { name: "YOLO v8", category: "Detection", users: "29K", performance: "99.1%" }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E6E6E6] overflow-hidden relative font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Geometric shapes that follow mouse */}
        <div 
          className="absolute w-96 h-96 border border-[#00FFE0]/20 rounded-full"
          style={{
            left: mousePos.x * 0.02 + 'px',
            top: mousePos.y * 0.02 + 'px',
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute w-64 h-64 border border-[#1E90FF]/20 rounded-full"
          style={{
            right: -mousePos.x * 0.015 + 'px',
            bottom: -mousePos.y * 0.015 + 'px'
          }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#00FFE0] rounded-full animate-pulse"
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
              opacity: 0.3
            }}
          />
        ))}

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,224,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,224,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 px-8 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-lg flex items-center justify-center relative">
              <Box className="w-7 h-7 text-white" />
              <div className="absolute inset-0 bg-[#00FFE0] opacity-0 group-hover:opacity-20 rounded-lg transition-opacity duration-300" />
            </div>
            <span className="text-3xl font-bold tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="text-[#00FFE0]">Model</span><span className="text-white">Nest</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-8">
            {['Features', 'Marketplace', 'Advisor', 'Deploy'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[#A6A6A6] hover:text-[#00FFE0] transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-[0_0_8px_rgba(0,255,224,0.8)] cursor-pointer"
              >
                {item}
              </a>
            ))}
            <Link to ="/mainpage">
            <button className="px-6 py-2 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-lg text-white font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(30,144,255,0.6)] transition-all duration-300">
              Get Started
            </button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 max-w-7xl mx-auto px-8 py-20">
         <div 
            className="absolute inset-0 w-full h-full"
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '250px',
                zIndex: -1,
                background: 'linear-gradient(135deg, rgba(30,144,255,0.2) 0%, rgba(155,89,182,0.2) 20%, rgba(0,255,224,0.2) 60%, rgba(0,255,224,0) 89%)',
                filter: 'blur(80px)',
                borderRadius: '50% 50% 50% 50%',
            }}
        />
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1A1A1A] border border-[#00FFE0]/30 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-[#00FFE0]" />
            <span className="text-sm text-[#00FFE0]">Next-Gen AI Model Platform</span>
          </div>
          
          <h1 className="text-7xl font-bold mb-6 leading-tight tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Your AI Model
            <br />
            <span className="bg-gradient-to-r from-[#1E90FF] via-[#00FFE0] to-[#9B59B6] bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>
          
          <p className="text-xl text-[#A6A6A6] mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover, train, and deploy AI models at lightning speed. Powered by Cerebras acceleration 
            and Meta Llama intelligence all in one futuristic platform.
          </p>

          <div className="flex items-center justify-center space-x-6">
            <button className="group relative px-10 py-5 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-xl text-lg font-bold overflow-hidden hover:scale-105 transition-all duration-300">
              <span className="relative z-10 flex items-center space-x-2">
                <Rocket className="w-5 h-5" />
                <span>Launch Platform</span>
              </span>
              <div className="absolute inset-0 bg-[#00FFE0] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute inset-0 shadow-[0_0_30px_rgba(0,255,224,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <button className="px-10 py-5 bg-[#1A1A1A] border-2 border-[#1E90FF]/50 rounded-xl text-lg font-bold hover:border-[#00FFE0] hover:shadow-[0_0_20px_rgba(0,255,224,0.4)] transition-all duration-300">
              Watch Demo
            </button>
          </div>

          {/* Floating 3D Element Placeholder */}
          <div className="mt-20 relative h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 relative animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-3xl opacity-20 blur-2xl" />
                <div className="absolute inset-4 bg-[#1A1A1A] border border-[#00FFE0]/30 rounded-3xl flex items-center justify-center">
                  <Cpu className="w-16 h-16 text-[#00FFE0]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="text-[#00FFE0]">Power</span> Features
          </h2>
          <p className="text-[#A6A6A6] text-lg">Everything you need to master AI model deployment</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-[#1A1A1A] border border-[#00FFE0]/20 rounded-2xl p-8 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00FFE0] hover:shadow-[0_0_30px_rgba(0,255,224,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E90FF]/0 to-[#9B59B6]/0 group-hover:from-[#1E90FF]/10 group-hover:to-[#9B59B6]/10 transition-all duration-300" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-[#A6A6A6] leading-relaxed">{feature.description}</p>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFE0]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </section>

      {/* ChatAdvisor Preview */}
      <section id="advisor" className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="bg-[#1A1A1A] border border-[#00FFE0]/20 rounded-3xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-12 flex flex-col justify-center">
              <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-[#00FFE0]">AI-Powered</span> Advisor
              </h2>
              <p className="text-[#A6A6A6] text-lg mb-8 leading-relaxed">
                Chat with our Meta Llama-powered advisor. Describe your project, and get instant model recommendations tailored to your specific needs.
              </p>
              <div className="space-y-4">
                {['Natural language queries', 'Real-time recommendations', 'Benchmark comparisons'].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <span className="text-[#E6E6E6]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0D0D0D] p-8 border-l border-[#00FFE0]/20">
              <div className="bg-[#1A1A1A] rounded-2xl p-4 mb-4 border border-[#1E90FF]/30">
                <p className="text-sm text-[#A6A6A6] mb-2">You:</p>
                <p className="text-[#E6E6E6]">I need a model for sentiment analysis on customer reviews</p>
              </div>
              <div className="bg-gradient-to-r from-[#1E90FF]/10 to-[#9B59B6]/10 rounded-2xl p-4 border border-[#00FFE0]/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4 text-[#00FFE0]" />
                  <p className="text-sm text-[#00FFE0]">AI Advisor:</p>
                </div>
                <p className="text-[#E6E6E6] mb-4">Based on your requirements, I recommend:</p>
                <div className="space-y-2">
                  {['BERT-Base (98.5% accuracy)', 'RoBERTa-Large (99.1% accuracy)'].map((model, i) => (
                    <div key={i} className="bg-[#1A1A1A] rounded-lg p-3 border border-[#00FFE0]/20 hover:border-[#00FFE0] transition-colors cursor-pointer">
                      <p className="text-sm text-[#E6E6E6]">{model}</p>
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
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="text-[#00FFE0]">Model</span> Marketplace
          </h2>
          <p className="text-[#A6A6A6] text-lg">10,000+ pre-trained models ready to deploy</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topModels.map((model, index) => (
            <div
              key={index}
              className="group bg-[#1A1A1A] border border-[#00FFE0]/20 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:border-[#FF4DFF] hover:shadow-[0_0_30px_rgba(255,77,255,0.4)]"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-xl mb-4 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{model.name}</h3>
              <p className="text-[#00FFE0] text-sm mb-4">{model.category}</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#A6A6A6]">{model.users} users</span>
                <span className="text-[#00FFE0]">{model.performance}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 py-20">
        <div className="bg-gradient-to-r from-[#1E90FF]/20 to-[#9B59B6]/20 backdrop-blur-sm rounded-3xl p-16 border border-[#00FFE0]/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFE0]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF4DFF]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-5xl font-bold mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Ready to <span className="text-[#00FFE0]">Transform</span> Your AI Workflow?
            </h2>
            <p className="text-[#A6A6A6] text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of developers building the future with ModelNest
            </p>
            <button className="px-12 py-5 bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] rounded-xl text-xl font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,224,0.6)] transition-all duration-300">
              Start Building Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#00FFE0]/10 mt-20">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-[#00FFE0]">Model</span><span className="text-white">Nest</span>
              </span>
            </div>
            <p className="text-[#A6A6A6]">© 2025 ModelNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}