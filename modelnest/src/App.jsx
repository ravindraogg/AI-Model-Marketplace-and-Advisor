import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/landingpage";
import MainPage from "./pages/homepage";  
import Authentication from "./pages/auth";
import Marketplace from './pages/marketplace';
import ModelDetail from './pages/modeldetail';
import MyModels from './pages/mymodel';
import DeploymentPage from './pages/deploymentpage';
import ChatPage from './pages/chatpage';
import { Analytics } from "@vercel/analytics/react"
//Shared Theme and Color Configuration
const colorScheme = {
    light: {
        bgPrimary: 'bg-[#f5f5ed]',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600',
        cardBg: 'bg-white',
        cardSecondaryBg: 'bg-gray-50', 
        cardBorder: 'border-gray-200',
        highlightColor: '#1E90FF',
        brandColor: '#00FFE0',
        gridColor: 'rgba(30,144,255,0.08)',
        chipGradient: 'linear-gradient(135deg, rgba(30,144,255,0.25) 0%, rgba(155,89,182,0.25) 20%, rgba(0,255,224,0.2) 60%, rgba(0,255,224,0) 89%)',
        scrollbarThumb: '#1E90FF',
    },
    dark: {
        bgPrimary: 'bg-[#0D0D0D]',
        textPrimary: 'text-[#E6E6E6]',
        textSecondary: 'text-[#A6A6A6]',
        cardBg: 'bg-[#1A1A1A]',
        cardSecondaryBg: 'bg-[#0D0D0D]', 
        cardBorder: 'border-[#00FFE0]/20',
        highlightColor: '#00FFE0',
        brandColor: '#1E90FF',
        gridColor: 'rgba(0,255,224,0.03)',
        chipGradient: 'linear-gradient(135deg, rgba(30,144,255,0.2) 0%, rgba(155,89,182,0.2) 20%, rgba(0,255,224,0.2) 60%, rgba(0,255,224,0) 89%)',
        scrollbarThumb: '#00FFE0',
    }
};

function App() {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const currentTheme = colorScheme[theme];

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        
        <BrowserRouter>
        <Analytics />
            <Routes>
                <Route 
                    path="/" 
                    element={
                        <Landing 
                            theme={theme} 
                            currentTheme={currentTheme} 
                            toggleTheme={toggleTheme} 
                        />
                    } 
                />
                <Route path="/chatnew/:message" element={<ChatPage />} />

                <Route 
                    path="/mainpage" 
                    element={
                        <MainPage 
                            theme={theme} 
                            currentTheme={currentTheme} 
                            toggleTheme={toggleTheme} 
                        />
                    } 
                /> 
                <Route 
                    path="/marketplace" 
                    element={
                        <Marketplace 
                            theme={theme} 
                            currentTheme={currentTheme} 
                            toggleTheme={toggleTheme} 
                        />
                    } 
                /> 
                
                <Route 
                    path="/auth" 
                    element={
                        <AuthRoute 
                            theme={theme} 
                            currentTheme={currentTheme} 
                            toggleTheme={toggleTheme} 
                            Component={Authentication} 
                        />
                    } 
                />
                  <Route 
                    path="/mymodels" 
                    element={
                        <MyModels 
                            theme={theme} 
                            currentTheme={currentTheme} 
                            toggleTheme={toggleTheme} 
                        />
                    } 
                />
                <Route 
                    path="/deploy" 
                    element={
                        <DeploymentPage 
                            theme={theme} 
                            currentTheme={currentTheme} 
                            toggleTheme={toggleTheme} 
                        />
                    } 
                />
                <Route 
                    path="/chatnew"
                    element={
                        <ChatPage
                            theme={theme} 
                            currentTheme={currentTheme} 
                            toggleTheme={toggleTheme} 
                        />
                    } 
                /><Route 
                    path="/chat/:chatId" 
                    element={
                        <ChatPage
                            theme={theme} 
                            currentTheme={currentTheme} 
                            toggleTheme={toggleTheme} 
                        />
                    } 
                />
                 <Route path="/marketplace/:modelName" element={<ModelDetail theme={theme} />} />
            </Routes>
        </BrowserRouter>
    );
}


export default App;

function AuthRoute({ theme, currentTheme, toggleTheme, Component }) {
    const navigate = useNavigate();

    const handleAuthSuccess = (token) => {
        console.log("Authentication successful, token received:", token);
        navigate("/mainpage");
    };

    return (
        <Component 
            theme={theme} 
            currentTheme={currentTheme} 
            toggleTheme={toggleTheme} 
            onSuccess={handleAuthSuccess} 
        />
    );
}
