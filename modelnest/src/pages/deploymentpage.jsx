import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Home, ChevronLeft, Package, Zap, Heart, Cloud, Code, User, Check, AlertTriangle, Loader2, ArrowRight, Github, Lock, Mail, Terminal, BarChart2, Bug } from 'lucide-react';
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

const STEPS = [
    { id: 1, name: 'Select Model', icon: Package },
    { id: 2, name: 'Authorize Docker Hub', icon: User },
    { id: 3, name: 'Generate Code', icon: Code },
    { id: 4, name: 'Build, Push & Deploy', icon: Cloud }, // Combined step for flow
    { id: 5, name: 'Deployment Complete', icon: Check }
];

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
    
    const defaultCode = "# Failed to generate code. Please run step 3.";

    return {
        dockerfile: dockerMatch ? dockerMatch[1].trim() : defaultCode,
        pythonCode: pythonMatch ? pythonMatch[1].trim() : defaultCode,
    };
};

// Mock Log Data for Llama Debugging
const mockBuildLogs = [
    "Step 1/10 : FROM python:3.9-slim",
    "Step 2/10 : WORKDIR /app",
    "Step 3/10 : COPY requirements.txt .",
    "Step 4/10 : RUN pip install --no-cache-dir -r requirements.txt",
    "ERROR: Could not find a version that satisfies the requirement missing_dep (from versions: none)",
    "ERROR: No matching distribution found for missing_dep",
    "Build failed: Exit code 1"
];

// --- Main Component ---
export default function DeploymentPage({ theme, toggleTheme }) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [models, setModels] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // Deployment State
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedModel, setSelectedModel] = useState(null);
    const [authStatus, setAuthStatus] = useState('pending');
    const [dockerUsername, setDockerUsername] = useState('');
    const [dockerPassword, setDockerPassword] = useState('');
    const [authError, setAuthError] = useState(null);    
    const [generatedCode, setGeneratedCode] = useState({ dockerfile: '', pythonCode: '' });
    
    // New granular deployment status
    const [deploymentStatus, setDeploymentStatus] = useState('idle'); // idle | generating | building | pushing | deploying | failed | complete
    const [deploymentLogs, setDeploymentLogs] = useState([]);
    const [llamaDebugSuggestion, setLlamaDebugSuggestion] = useState(null); // Suggested fix from Llama
    
    const currentTheme = colorScheme[theme || 'dark'];
    const isDark = theme === 'dark';

    const renderAvatarInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    // Load Profile and Models on Mount
    const fetchUserData = useCallback(async () => {
        setLoading(true);
        try {
            const storedProfile = sessionStorage.getItem('userProfile');
            if (storedProfile) {
                setProfile(JSON.parse(storedProfile));
            }

            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("User not authenticated.");

            const [favResponse, trainedResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/models/favorites`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/api/models/trained`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const favorites = favResponse.ok ? await favResponse.json() : [];
            const trained = trainedResponse.ok ? await trainedResponse.json() : [];
            
            const mappedFavorites = favorites.map(fav => ({
                ...fav, isFavorite: true, source: fav.platform || 'Marketplace',
                description: fav.description || `Favorited model from the ${fav.platform || 'Marketplace'} ecosystem.`
            }));
            
            const combinedModels = [...trained.map(t => ({ ...t, source: 'Trained', isTrained: true })), ...mappedFavorites];
            const uniqueModels = Array.from(new Map(combinedModels.map(item => [item.modelName || item.name, item])).values());
            
            setModels(uniqueModels);

        } catch (error) {
            console.error("Error fetching deployment data:", error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Step 2 Logic: Docker Authorization Handler
    const handleAuthorize = async () => {
        setAuthError(null);
        if (dockerUsername.length < 3 || dockerPassword.length < 8) {
            setAuthError("Please provide a valid Docker Hub Username and Password/Token (min 8 characters).");
            setAuthStatus('failed');
            return;
        }

        setDeploymentStatus('deploying');
        setAuthStatus('pending');

        try {
            // MOCK: Simulate network delay and Docker Hub API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // MOCK: Simulate successful API token response
            if (dockerPassword.toLowerCase().includes('dockertoken') || dockerPassword.length > 20) {
                const token = "DOCKER_HUB_JWT_TOKEN_RECEIVED";
                
                // Store the simulated token and user details in session storage for Step 4 consumption
                sessionStorage.setItem('dockerAuthToken', token);
                sessionStorage.setItem('dockerUsername', dockerUsername);

                setAuthStatus('authorized');
                setDeploymentStatus('idle');
                console.log("Docker Hub Authentication Successful. Token stored securely (simulated).");
                setCurrentStep(3);
            } else {
                throw new Error("Invalid credentials received from Docker Hub. Check your username and PAT/password.");
            }

        } catch (error) {
            setAuthStatus('failed');
            setDeploymentStatus('idle');
            setAuthError(error.message || "A network error occurred while reaching the Docker Hub proxy.");
        }
    };
    
    // Step 3 Logic: Generate Deployment Code
    const handleGenerateCode = useCallback(async (isRetry = false) => {
        if (!selectedModel) return;

        setDeploymentStatus('generating');
        const token = localStorage.getItem('authToken');
        
        const modelIdentifier = selectedModel.modelName || selectedModel.name; 
        const platform = selectedModel.platform || 'Custom/Hugging Face'; 
        const authenticatedUsername = sessionStorage.getItem('dockerUsername') || dockerUsername; 

        let userPrompt = `Generate a production-ready Dockerfile and a Python (FastAPI) deployment file (app.py) for the model named "${modelIdentifier}" from the source ${platform}. 
The generated Dockerfile MUST use the Docker Hub username "${authenticatedUsername}" in a comment or placeholder to define the final image tag (e.g., # Image tag: ${authenticatedUsername}/${modelIdentifier}:latest).
The Python file MUST include FastAPI code that initializes the model, exposes a POST endpoint for inference, and is ready for production use. 
IMPORTANT: Provide the Dockerfile inside a \`\`\`dockerfile\n...\n\`\`\` block and the Python code inside a \`\`\`python\n...\n\`\`\` block. 
DO NOT include any text, explanations, or formatting outside these two code blocks.`;

        if (isRetry && llamaDebugSuggestion) {
            // Add Llama's suggested fix to the prompt for code regeneration
            userPrompt += `\n\n[RETRY REQUEST]: A previous build failed with dependency issues. Please ensure the Dockerfile includes the following dependency or fix: ${llamaDebugSuggestion.fixSuggestion}`;
        }


        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: userPrompt })
            });

            if (!response.ok) throw new Error('AI service failed to generate code.');

            const result = await response.json();
            const aiText = result.reply || "Error: No reply received.";
            
            const extracted = extractCode(aiText);
            setGeneratedCode(extracted);
            setLlamaDebugSuggestion(null); // Clear suggestion on success
            setCurrentStep(4);
            
        } catch (error) {
            console.error("Error fetching AI code:", error);
            setDeploymentStatus('failed');
        } finally {
            setDeploymentStatus('idle');
        }
    }, [selectedModel, dockerUsername, llamaDebugSuggestion]);
    
    // Step 4 Logic: Build, Push, and Deploy E2E Flow
    const handleE2EDeployment = () => {
        setDeploymentLogs([]);
        setLlamaDebugSuggestion(null);
        
        const authenticatedUsername = sessionStorage.getItem('dockerUsername');
        const modelTag = `${authenticatedUsername}/${selectedModel.modelName || selectedModel.name}:latest`;

        // 1. Simulate Docker Build
        setDeploymentStatus('building');
        let buildSuccess = true;

        const logBuild = (message, delay, isError = false) => {
            setTimeout(() => {
                setDeploymentLogs(prev => [...prev, { message, isError }]);
                if (isError) buildSuccess = false;
            }, delay);
        };
        
        logBuild(`[DOCKER LOGIN] Attempting login for ${authenticatedUsername} using JWT...`, 500);
        logBuild(`[DOCKER LOGIN] Login succeeded.`, 1000);
        logBuild(`[DOCKER BUILD] Building image: ${modelTag}`, 1500);

        // Simulate build logs, incorporating a deliberate error on the first attempt
        mockBuildLogs.forEach((log, index) => {
            logBuild(log, 2000 + index * 300, log.startsWith('ERROR'));
        });
        
        // Final build status check
        setTimeout(() => {
            if (!buildSuccess) {
                setDeploymentStatus('failed');
                logBuild(`[BUILD FAILED] Image build failed. Checking logs...`, 2000 + mockBuildLogs.length * 300 + 500, true);
                
                // Trigger Llama Debugging simulation
                handleLlamaDebugging(modelTag, mockBuildLogs);
            } else {
                // 2. Simulate Docker Push (Only if build succeeds)
                logBuild(`[DOCKER BUILD] Build successful. Image tagged: ${modelTag}`, 4500);
                setDeploymentStatus('pushing');
                
                logBuild(`[DOCKER PUSH] Pushing image to registry ${authenticatedUsername}...`, 5500);
                
                // 3. Simulate Deployment
                setTimeout(() => {
                    setDeploymentStatus('deploying');
                    logBuild(`[DEPLOYMENT] Pushing complete. Simulating creation of K8s/ECS manifest...`, 6500);
                    logBuild(`[DEPLOYMENT] Launching container on production cluster...`, 7500);
                }, 7500);

                // 4. Final Completion
                setTimeout(() => {
                    setDeploymentStatus('complete');
                    setCurrentStep(5);
                    logBuild(`[SUCCESS] Deployment complete. Endpoint ready.`, 8500);
                }, 8500);
            }
        }, 2000 + mockBuildLogs.length * 300 + 1000); // Wait for all mock logs to finish
    };
    
    // Step 7 Logic: Llama Debugging
    const handleLlamaDebugging = async (modelTag, logs) => {
        setDeploymentStatus('debugging');

        // Create a summary of the failure logs for Llama
        const failureSummary = logs.filter(log => log.includes('ERROR') || log.includes('Could not find')).join('\n');
        
        const debugPrompt = `The Docker build for model "${modelTag}" failed. Analyze the following logs and provide a concise, single-paragraph suggested fix for the Dockerfile, specifically addressing missing dependencies or configuration errors.
        
        FAILURE LOGS:\n${failureSummary}`;
        
        const token = localStorage.getItem('authToken');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: debugPrompt })
            });

            if (!response.ok) throw new Error('AI debugging service failed.');

            const result = await response.json();
            const fixSuggestion = result.reply || "AI could not generate a fix.";
            
            setLlamaDebugSuggestion({
                logs: failureSummary,
                fixSuggestion: fixSuggestion,
            });
            setDeploymentStatus('failed'); // Stay on failed state until user retries

        } catch (error) {
            console.error("Llama Debugging Error:", error);
            setLlamaDebugSuggestion({ logs: failureSummary, fixSuggestion: "Failed to connect to debugging agent." });
            setDeploymentStatus('failed');
        }
    };

    // Retry function
    const handleRetryWithFix = () => {
        setDeploymentLogs([]);
        setDeploymentStatus('idle');
        
        // Simulate regenerating code with the fix
        handleGenerateCode(true); 
    };

    useEffect(() => {
        fetchUserData();
        setGeneratedCode({ dockerfile: '', pythonCode: '' });
        setDeploymentStatus('idle');
        
        // Check session storage on load to persist authorization status
        if (sessionStorage.getItem('dockerAuthToken') && sessionStorage.getItem('dockerUsername')) {
            setAuthStatus('authorized');
            setDockerUsername(sessionStorage.getItem('dockerUsername'));
        } else {
             setAuthStatus('pending');
        }
        
    }, [fetchUserData]);

    
    const ModelSelectPanel = () => (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.length > 0 ? (
                models.map((model, index) => {
                    const modelName = model.modelName || model.name;
                    return (
                        <button
                            key={index}
                            onClick={() => {
                                setSelectedModel(model);
                                setCurrentStep(2);
                            }}
                            className={`p-5 rounded-2xl text-left border-2 transition-all duration-300 ${
                                selectedModel?.modelName === modelName ? 'border-[#00FFE0] bg-[#00FFE0]/20 shadow-[0_0_20px_rgba(0,255,224,0.5)]' : `${currentTheme.cardSecondaryBg} ${currentTheme.cardBorder} hover:border-[#1E90FF]/60 hover:scale-[1.02]`
                            }`}
                        >
                            <div className="flex items-center space-x-3 mb-2">
                                <Zap className={`w-5 h-5 ${selectedModel?.modelName === modelName ? 'text-[#00FFE0]' : currentTheme.textPrimary}`} />
                                <h3 className={`font-bold text-lg ${currentTheme.textPrimary} truncate`}>{modelName}</h3>
                            </div>
                            <p className={`text-xs ${currentTheme.textSecondary}`}>{model.description?.substring(0, 80)}...</p>
                            <div className="mt-3 flex space-x-3">
                                <span className={`text-xs px-3 py-1 rounded-full border ${model.isTrained ? 'border-[#9B59B6] text-[#9B59B6]' : 'border-[#1E90FF] text-[#1E90FF]'}`}>
                                    {model.source}
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-full border ${currentTheme.cardBorder} ${currentTheme.textSecondary}`}>
                                    {model.category || 'N/A'}
                                </span>
                            </div>
                        </button>
                    );
                })
            ) : (
                <p className={`${currentTheme.textSecondary} md:col-span-3 text-center p-8`}>
                    No saved or trained models found. Please save a model from the Marketplace or log a Trained Model.
                </p>
            )}
        </div>
    );
    
    const AuthorizationPanel = () => (
        <div className={`p-8 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl`}>
            <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>Docker Hub Authentication</h3>
            <p className={`text-sm ${currentTheme.textSecondary} mb-6`}>
                Enter your **Docker Hub credentials** to obtain a JWT write token. This token is required by the agent to authenticate and push the final image to your private registry (e.g., `docker.io/{dockerUsername}`).
            </p>
            
            <div className={`space-y-4 mb-6 ${authStatus === 'authorized' ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Username Input */}
                <div className="relative">
                    <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
                    <input
                        type="text"
                        value={dockerUsername}
                        onChange={(e) => {
                            setDockerUsername(e.target.value);
                            setAuthStatus('pending');
                            setAuthError(null);
                        }}
                        placeholder="Docker Hub Username"
                        className={`w-full ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl px-4 pl-12 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all duration-300`}
                    />
                </div>
                
                {/* Password/Token Input */}
                <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
                    <input
                        type="password"
                        value={dockerPassword}
                        onChange={(e) => {
                            setDockerPassword(e.target.value);
                            setAuthStatus('pending');
                            setAuthError(null);
                        }}
                        placeholder="Password or Personal Access Token (PAT)"
                        className={`w-full ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl px-4 pl-12 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all duration-300`}
                    />
                </div>
                
                {authError && (
                    <div className="p-3 bg-red-600/20 text-red-400 border border-red-500 rounded-lg flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm">{authError}</span>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-3">
                        {authStatus === 'authorized' ? (
                            <Check className="w-6 h-6 text-green-400" />
                        ) : (
                            <Mail className="w-6 h-6 text-[#1E90FF]" />
                        )}
                        <span className={`font-semibold ${authStatus === 'authorized' ? 'text-green-400' : currentTheme.textPrimary}`}>
                            {authStatus === 'authorized' ? 'Authorization Successful.' : 'Awaiting Credentials'}
                        </span>
                    </div>
                    <button
                        onClick={handleAuthorize}
                        disabled={authStatus === 'authorized' || deploymentStatus !== 'idle' || dockerUsername.length === 0 || dockerPassword.length === 0}
                        className="px-6 py-2 bg-gradient-to-r from-[#1E90FF] to-[#00FFE0] rounded-full text-black text-sm font-bold hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {deploymentStatus === 'deploying' ? (
                            <span className="flex items-center space-x-2"><Loader2 className="w-4 h-4 animate-spin" /><span>AUTHENTICATING...</span></span>
                        ) : (
                            <span>Get Deployment Token</span>
                        )}
                    </button>
                </div>
            </div>
            
            <button
                onClick={() => setCurrentStep(1)}
                className={`text-sm text-[#9B59B6] hover:text-[#00FFE0] transition-colors`}
            >
                &larr; Change Selected Model
            </button>
        </div>
    );
    
    const CodeGenerationPanel = () => (
        <div className="space-y-6">
            <div className={`p-8 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl`}>
                <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>Model Details</h3>
                <p className={`text-lg font-semibold ${currentTheme.textPrimary}`}>{selectedModel.modelName || selectedModel.name}</p>
                <p className={`text-sm ${currentTheme.textSecondary}`}>{selectedModel.platform || 'Custom Model'}</p>
                <p className={`text-xs mt-2 ${currentTheme.textSecondary}`}>{selectedModel.description || 'No description available.'}</p>
            </div>

            <div className={`p-8 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl`}>
                <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>Generate Deployment Code (AI Agent)</h3>
                <p className={`text-sm ${currentTheme.textSecondary} mb-6`}>
                    The AI Agent generates a **FastAPI Python server** and an optimized **Dockerfile** tagged for your registry: **`{dockerUsername}/{selectedModel.modelName || selectedModel.name}:latest`**.
                </p>
                <button
                    onClick={() => handleGenerateCode()}
                    disabled={deploymentStatus !== 'idle'}
                    className="w-full py-3 bg-gradient-to-r from-[#9B59B6] to-[#1E90FF] rounded-xl text-black font-extrabold hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                    {deploymentStatus === 'generating' ? (
                        <span className="flex items-center justify-center space-x-2"><Loader2 className="w-5 h-5 animate-spin" /><span>GENERATING CODE...</span></span>
                    ) : (
                        <span>GENERATE DEPLOYMENT CODE</span>
                    )}
                </button>
            </div>
            <button
                onClick={() => setCurrentStep(2)}
                className={`text-sm text-[#9B59B6] hover:text-[#00FFE0] transition-colors px-2`}
            >
                &larr; Review Authentication Status
            </button>
        </div>
    );
    
    const DeploymentReviewPanel = () => (
        <div className="space-y-6">
            <div className={`p-8 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl`}>
                <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-4`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Deployment Review & E2E Flow
                </h2>
                
                {/* Deployment Status & Logs */}
                <div className={`p-4 mb-6 rounded-xl border-2 ${
                    deploymentStatus === 'building' || deploymentStatus === 'pushing' || deploymentStatus === 'deploying'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : deploymentStatus === 'failed' ? 'border-red-500 bg-red-500/10' : 'border-gray-500/30'
                }`}>
                    <div className="flex items-center space-x-2 font-bold mb-2">
                        {deploymentStatus === 'building' && <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />}
                        {deploymentStatus === 'pushing' && <Cloud className="w-4 h-4 animate-pulse text-yellow-500" />}
                        {deploymentStatus === 'deploying' && <BarChart2 className="w-4 h-4 animate-bounce text-yellow-500" />}
                        {deploymentStatus === 'failed' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        <span className={deploymentStatus === 'failed' ? 'text-red-500' : 'text-yellow-500'}>
                            {deploymentStatus.toUpperCase()}...
                        </span>
                    </div>
                    <div className={`h-40 overflow-y-auto font-mono text-xs p-2 ${currentTheme.cardSecondaryBg} rounded-lg border ${currentTheme.cardBorder} scrollbar-thin`}>
                        {deploymentLogs.map((log, index) => (
                            <div key={index} className={log.isError ? 'text-red-400' : currentTheme.textSecondary}>
                                {log.message}
                            </div>
                        ))}
                        {deploymentLogs.length === 0 && <span className={currentTheme.textSecondary}>Awaiting deployment initiation...</span>}
                    </div>
                </div>

                {/* Code Viewers */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className={`font-semibold text-lg ${currentTheme.textPrimary} flex items-center space-x-2 mb-2`}>
                            <Code className="w-5 h-5 text-[#00FFE0]" />
                            <span>Dockerfile</span>
                        </h3>
                        <div className={`p-4 ${currentTheme.cardSecondaryBg} rounded-xl overflow-x-auto border ${currentTheme.cardBorder}`}>
                            <pre className={`text-sm ${currentTheme.textSecondary}`}>{generatedCode.dockerfile}</pre>
                            <button
                                onClick={() => downloadFile(generatedCode.dockerfile, 'Dockerfile', 'text/plain')}
                                className="mt-2 w-full py-1.5 bg-gradient-to-r from-[#00FFE0]/20 to-[#1E90FF]/20 rounded-lg text-xs font-bold text-[#00FFE0] hover:bg-opacity-80 transition-all"
                            >
                                Download
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 className={`font-semibold text-lg ${currentTheme.textPrimary} flex items-center space-x-2 mb-2`}>
                            <Terminal className="w-5 h-5 text-[#1E90FF]" />
                            <span>Python API (`app.py`)</span>
                        </h3>
                        <div className={`p-4 ${currentTheme.cardSecondaryBg} rounded-xl overflow-x-auto border ${currentTheme.cardBorder}`}>
                            <pre className={`text-sm ${currentTheme.textSecondary}`}>{generatedCode.pythonCode}</pre>
                             <button
                                onClick={() => downloadFile(generatedCode.pythonCode, 'app.py', 'text/python')}
                                className="mt-2 w-full py-1.5 bg-gradient-to-r from-[#00FFE0]/20 to-[#1E90FF]/20 rounded-lg text-xs font-bold text-[#1E90FF] hover:bg-opacity-80 transition-all"
                            >
                                Download
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Llama Debugging / Retry Section */}
                {deploymentStatus === 'failed' && llamaDebugSuggestion && (
                    <div className="mt-8 p-6 bg-red-800/20 border border-red-500 rounded-xl">
                        <h3 className="flex items-center space-x-2 font-bold text-lg text-red-400 mb-3">
                            <Bug className="w-5 h-5" />
                            <span>AI Debugging Suggestion</span>
                        </h3>
                        <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
                            {llamaDebugSuggestion.fixSuggestion}
                        </p>
                        <button
                            onClick={handleRetryWithFix}
                            className="w-full py-3 bg-green-600 rounded-xl text-white font-extrabold hover:bg-green-700 transition-all"
                        >
                            APPLY FIX & RETRY BUILD (Step 3)
                        </button>
                    </div>
                )}


                <div className="mt-8">
                    <button
                        onClick={handleE2EDeployment}
                        disabled={deploymentStatus !== 'idle'}
                        className="w-full py-3 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-xl text-black font-extrabold hover:scale-[1.01] transition-all disabled:opacity-50"
                    >
                        {deploymentStatus === 'idle' ? (
                            <span>INITIATE BUILD, PUSH & DEPLOY</span>
                        ) : deploymentStatus === 'failed' ? (
                             <span>BUILD FAILED - REVIEW LOGS ABOVE</span>
                        ) : (
                            <span className="flex items-center justify-center space-x-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{deploymentStatus.toUpperCase()}...</span>
                            </span>
                        )}
                    </button>
                </div>
            </div>
            
            <button
                onClick={() => setCurrentStep(3)}
                className={`text-sm text-[#9B59B6] hover:text-[#00FFE0] transition-colors px-2`}
            >
                &larr; Go Back to Generate Code
            </button>
        </div>
    );

    const DeploymentCompletePanel = () => {
        const deployedImageTag = `${sessionStorage.getItem('dockerUsername') || 'your_username'}/${selectedModel.modelName || selectedModel.name}:latest`;

        // Clear session storage of Docker auth on successful deployment completion
        useEffect(() => {
            // Note: In a real app, you might only clear the JWT token, not the username/password
            // to allow for easier redeployment, but clearing here ensures security if the session ends.
            sessionStorage.removeItem('dockerAuthToken');
            sessionStorage.removeItem('dockerUsername');
        }, []);
        
        return (
            <div className={`p-10 text-center ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl shadow-2xl`}>
                <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className={`text-3xl font-extrabold ${currentTheme.textPrimary} mb-2`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Deployment Successful!
                </h2>
                <p className={`text-lg ${currentTheme.textSecondary} mb-6`}>
                    The Docker image was successfully built and pushed to your Docker Hub registry.
                </p>
                <div className={`p-4 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl mb-6 inline-block`}>
                    <p className={`${currentTheme.textPrimary} font-mono text-sm`}>
                        Image Tag: **{deployedImageTag}**
                    </p>
                </div>
                
                <div className="mt-8 flex justify-center space-x-4">
                    <Link
                        to="/mymodels"
                        className="px-6 py-3 bg-gradient-to-r from-[#9B59B6] to-[#1E90FF] rounded-full text-white font-bold hover:scale-105 transition-all"
                    >
                        View My Models
                    </Link>
                    <button
                        onClick={() => {
                            setCurrentStep(1);
                            setSelectedModel(null);
                            setAuthStatus('pending'); 
                            setDockerUsername('');
                            setDockerPassword('');
                            setAuthError(null);
                        }}
                        className={`px-6 py-3 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-full ${currentTheme.textPrimary} font-bold hover:border-[#00FFE0] transition-all`}
                    >
                        Deploy Another Model
                    </button>
                </div>
            </div>
        );
    };


    // --- Render Logic ---

    if (loading) {
        return (
            <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} flex items-center justify-center`}>
                <div className="text-center z-10">
                    <div className="w-16 h-16 border-4 border-[#00FFE0]/20 border-t-[#00FFE0] rounded-full animate-spin mb-4 mx-auto" />
                    <p className="text-xl text-[#00FFE0]">Initializing Deployment Agent...</p>
                </div>
            </div>
        );
    }

    const renderStepContent = () => {
        // Enforce sequential steps and authentication status
        
        // If Model hasn't been selected, go to Step 1
        if (!selectedModel) return ModelSelectPanel();
        
        // If Auth isn't done, but user tries to jump to 3 or 4, go to Step 2
        if (currentStep >= 2 && authStatus !== 'authorized') return AuthorizationPanel();
        
        switch (currentStep) {
            case 1:
                return ModelSelectPanel();
            case 2:
                return AuthorizationPanel();
            case 3:
                return CodeGenerationPanel();
            case 4:
                return DeploymentReviewPanel();
            case 5:
                return DeploymentCompletePanel();
            default:
                return ModelSelectPanel();
        }
    };


    return (
        <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} relative overflow-hidden font-sans pt-20`}>
            
            {/* Navigation Bar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 ${currentTheme.cardBg} border-b ${currentTheme.cardBorder} transition-colors duration-500`}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link to="/mainpage" className={`p-2 rounded-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} hover:border-[#00FFE0] transition-colors`} aria-label="Go Back to Home">
                                <ChevronLeft className={`w-6 h-6 ${currentTheme.textPrimary}`} />
                            </Link>
                            <span className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                <span className="text-[#00FFE0]">Model</span><span className={currentTheme.textPrimary}>Nest / </span>
                                <span className="text-[#1E90FF]">Deployments</span>
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
                            <div className={`w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center text-white font-bold text-lg border-2 ${currentTheme.cardBorder}`}>
                                {renderAvatarInitial(profile?.name || "User")}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Background Grid */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0" style={{
                    backgroundImage: isDark ? 'linear-gradient(rgba(0,255,224,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,224,0.04) 1px,transparent 1px)' : 'linear-gradient(rgba(30,144,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(30,144,255,0.08) 1px,transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                <h1 className={`text-4xl font-extrabold mb-8 ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    <span className="text-[#1E90FF]">AI Deployment </span><span className="text-[#00FFE0]">Agent</span>
                </h1>
                
                {/* Deployment Steps Indicator */}
                <div className={`mb-10 p-6 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl`}>
                    <div className="flex justify-between items-center relative">
                        {/* Line connector */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-600/50 -translate-y-1/2 mx-10">
                            <div className={`h-full bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] transition-all duration-500`}
                                style={{ width: `${(currentStep - 1) / (STEPS.length - 1) * 100}%` }}>
                            </div>
                        </div>
                        
                        {STEPS.map((step) => (
                            <div 
                                key={step.id} 
                                className="z-10 flex flex-col items-center cursor-pointer"
                                onClick={() => {
                                    // Only allow navigation to steps that are completed or the current step
                                    if (step.id <= currentStep) {
                                        setCurrentStep(step.id);
                                    }
                                }} 
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    currentStep >= step.id 
                                        ? 'bg-gradient-to-br from-[#00FFE0] to-[#1E90FF] border-transparent text-black shadow-lg shadow-[#00FFE0]/50'
                                        : `${currentTheme.cardSecondaryBg} border-gray-500 ${currentTheme.textSecondary}`
                                }`}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <span className={`mt-2 text-xs font-semibold text-center hidden sm:block ${currentTheme.textSecondary} ${currentStep >= step.id ? 'text-[#00FFE0]' : ''}`}>
                                    {step.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content Panel */}
                <div className="max-w-4xl mx-auto">
                    {renderStepContent()}
                </div>
            </div>
            
            <style jsx="true">{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
                
                .font-sans {
                    font-family: 'Inter', sans-serif;
                }
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: ${currentTheme.scrollbarThumb || '#00FFE0'};
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
}
