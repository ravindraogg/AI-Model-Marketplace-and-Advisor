import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Sun, Moon, Brain, MessageSquare, Send, Upload, Edit2, Trash2, X, AlertTriangle, Loader2, Save, FileText, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// FIX: Using a fallback for import.meta.env to resolve compilation warnings
const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const POLLING_INTERVAL_MS = 2000; 

const colorScheme = {
  dark: {
    bgPrimary: 'bg-[#050505]',
    textPrimary: 'text-[#E6E6E6]',
    textSecondary: 'text-[#A6A6A6]',
    cardBg: 'bg-black/30 backdrop-blur-xl',
    cardSecondaryBg: 'bg-black/15 backdrop-blur-lg',
    cardBorder: 'border-[#00FFE0]/30',
    navBg: 'bg-black/20',
    sidebarBg: 'bg-black/50 backdrop-blur-lg'
  },
  light: {
    bgPrimary: 'bg-[#f5f5ed]',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    cardBg: 'bg-white/80 backdrop-blur-lg',
    cardSecondaryBg: 'bg-gray-100/80 backdrop-blur-md',
    cardBorder: 'border-gray-300',
    navBg: 'bg-white/80',
    sidebarBg: 'bg-white/90 backdrop-blur-lg'
  },
};

// --- Custom Modal Component (omitted for brevity) ---
const CustomModal = ({ currentTheme, title, children, primaryAction, primaryLabel, onClose, isDanger = false, defaultValue = '', isInput = false, isInfo = false }) => {
    const [inputValue, setInputValue] = useState(defaultValue);

    const handleSubmit = () => {
        if (isInfo) {
            onClose(); 
            return;
        }

        if (isInput) {
            primaryAction(inputValue.trim());
        } else {
            primaryAction();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className={`${currentTheme.cardBg} border ${isDanger ? 'border-red-500/50' : currentTheme.cardBorder} rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in`}>
                <h3 className={`text-xl font-extrabold ${isDanger ? 'text-red-400' : (isInfo ? 'text-[#1E90FF]' : currentTheme.textPrimary)} mb-4 flex items-center`}>
                    {isInfo && <AlertTriangle className="w-5 h-5 mr-2" />}
                    {title}
                </h3>
                <div className={`text-sm ${currentTheme.textSecondary} mb-6`}>
                    {children}
                </div>
                
                {isInput && (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && inputValue.trim() && handleSubmit()}
                        className={`w-full mb-6 px-4 py-3 rounded-xl ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all`}
                        placeholder="Enter new chat title"
                        autoFocus
                    />
                )}

                <div className="flex justify-end space-x-3">
                    {!isInfo && (
                        <button 
                            onClick={onClose} 
                            className={`px-6 py-2.5 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl ${currentTheme.textPrimary} hover:border-[#00FFE0] transition-all`}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isInput && !inputValue.trim()}
                        className={`px-6 py-2.5 rounded-xl text-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDanger 
                                ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/50' 
                                : 'bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] hover:shadow-lg hover:shadow-[#00FFE0]/50'
                        }`}
                    >
                        {isInfo ? 'Got It' : primaryLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Training Modal (omitted for brevity) ---
const TrainingModal = ({ currentTheme, onClose, onSubmit, isSubmitting, fileName }) => {
    const [modelName, setModelName] = useState('llama-3.1-8b');
    const [taskDescription, setTaskDescription] = useState('');

    const inputStyle = `w-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl px-4 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all duration-300`;

    const handleSubmit = () => {
        if (!taskDescription.trim()) return;
        onSubmit({ modelName, taskDescription });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-scale-in`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-2xl font-extrabold ${currentTheme.textPrimary}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        <FileText className="w-6 h-6 inline-block mr-2 text-[#00FFE0]" />
                        Generate Kaggle Script
                    </h3>
                    <button onClick={onClose} className={`p-2 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-full hover:border-red-500 transition-all`}>
                        <X className="w-5 h-5 text-red-500" />
                    </button>
                </div>
                
                <div className={`mb-4 p-3 rounded-lg border ${currentTheme.cardBorder} ${currentTheme.cardSecondaryBg}`}>
                    <p className={`text-sm ${currentTheme.textSecondary} flex items-center space-x-2`}>
                        <FileText className="w-4 h-4 text-[#1E90FF]" />
                        <span className='font-semibold'>{fileName}</span>
                        <span className="text-xs text-green-400 ml-2">(Data Loaded to client)</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm mb-2 ${currentTheme.textSecondary} font-medium`}>Base Model</label>
                        <select value={modelName} onChange={(e) => setModelName(e.target.value)} className={inputStyle}>
                            <option value="llama-3.1-8b">LLaMA 3.1 8B (Recommended)</option>
                            <option value="llama-3.3-70b">LLaMA 3.3 70B (High Capability)</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm mb-2 ${currentTheme.textSecondary} font-medium`}>Training Objective (Required)</label>
                        <textarea
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            placeholder="e.g., Train the model to classify customer reviews into positive and negative sentiment..."
                            className={`${inputStyle} h-32 resize-none`}
                        />
                        <p className={`text-xs mt-1 ${currentTheme.textSecondary}`}>Describe what the model should learn. The AI will generate the PyTorch code for this task.</p>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !taskDescription.trim()}
                    className={`w-full mt-6 py-3 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-xl text-black font-extrabold hover:shadow-lg hover:shadow-[#00FFE0]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center space-x-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>GENERATING SCRIPT...</span>
                        </span>
                    ) : (
                        <span className="flex items-center justify-center space-x-2">
                            <Save className="w-5 h-5" />
                            <span>GENERATE KAGGLE SCRIPT</span>
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function ChatPage({ theme, toggleTheme }) {
    const navigate = useNavigate();
    const { chatId } = useParams(); // Get chatId from URL parameter
    
    const [profile, setProfile] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    // Initialize currentChatId from URL param. It will be null/undefined on /chatnew.
    const [currentChatId, setCurrentChatId] = useState(chatId || null); 
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showTrainingModal, setShowTrainingModal] = useState(false);
    const [dailyLimit, setDailyLimit] = useState({ remaining: 5, used: 0 });
    
    // Dataset storage: stores { name: string, content: string }
    const [datasetFile, setDatasetFile] = useState(null); 
    
    const [modal, setModal] = useState(null); 

    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    // REF: Tracks if the initial message logic has been attempted
    const isInitialSendAttempted = useRef(false); 

    const currentTheme = colorScheme[theme || 'dark'];
    const isDark = theme === 'dark';

    // State to track if the user has manually scrolled up
    const [isUserScrolling, setIsUserScrolling] = useState(false); 
    // State to track if the chat history is initially loaded
    const [isChatHistoryReady, setIsChatHistoryReady] = useState(false);


    // --- DAILY LIMIT FETCH FUNCTION (made local and memoized for startNewChat to call) ---
    const fetchDailyLimit = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/chats/daily-limit`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDailyLimit(data);
            }
        } catch (error) {
            console.error("Error fetching daily limit:", error);
        }
    }, []);

    // Polling for Daily Limit
    useEffect(() => {
        fetchDailyLimit();
        const intervalId = setInterval(fetchDailyLimit, 60000); // Check every minute
        return () => clearInterval(intervalId);
    }, [fetchDailyLimit]);

    // --- INITIAL MESSAGE HANDLER ---
    useEffect(() => {
        // Only run if we are on the /chatnew route (no chatId in URL) AND haven't attempted yet
        if (!chatId && !isInitialSendAttempted.current) {
            const initialMessage = sessionStorage.getItem('initialChatMessage');
            
            if (initialMessage) {
                isInitialSendAttempted.current = true; // Mark as attempted
                sessionStorage.removeItem('initialChatMessage');
                
                // Use a slight delay to ensure the component is fully rendered before state updates/sends are triggered
                setTimeout(() => {
                    handleSendMessage(initialMessage);
                }, 100); 
            }
        }
    }, [chatId]); // No dependencies needed other than chatId if handleSendMessage is stable

    // --- URL SYNC EFFECT ---
    // Update internal state when URL parameter changes (user navigates via browser or link)
    useEffect(() => {
        const newChatId = chatId || null;
        if (newChatId !== currentChatId) {
            setCurrentChatId(newChatId);
            setMessages([]); // Clear messages immediately on navigation
            
            // Clear dataset state if navigating to a new chat session
            if (!newChatId) { 
                setDatasetFile(null);
                sessionStorage.removeItem('datasetFileContent');
            }
        }
        setIsUserScrolling(false); // Reset scroll position when URL changes
    }, [chatId]);


    // --- AUTH ---
    useEffect(() => {
        const storedProfile = sessionStorage.getItem('userProfile');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
    }, []);

    // --- FETCH FUNCTIONS ---
    const fetchChatHistory = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/chats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const history = await response.json();
                setChatHistory(history);

                // Check if the current chat ID is valid/exists in the history
                if (currentChatId && !history.some(chat => chat.id === currentChatId)) {
                    // If the chat was deleted externally, navigate to a new chat
                    navigate('/chatnew');
                    setCurrentChatId(null);
                    setMessages([]);
                }
                
                setIsChatHistoryReady(true);
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    }, [currentChatId, navigate]);

    const fetchMessages = useCallback(async (idToFetch) => {
        const token = localStorage.getItem('authToken');

        if (!token || !idToFetch) {
            setMessages([]);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/chats/${idToFetch}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const messagesData = await response.json();
                messagesData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                setMessages(messagesData);
            } else {
                if (response.status === 404) {
                    // Chat ID in URL is invalid/not found, force new chat
                    navigate('/chatnew');
                }
                throw new Error(`Failed to fetch messages: ${response.status}`);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }, [navigate]);

    // Polling for Chat History (Only starts after the user's initial auth check)
    useEffect(() => {
        fetchChatHistory();
        const intervalId = setInterval(fetchChatHistory, POLLING_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, [fetchChatHistory]);

    // Dedicated effect to load messages immediately when a chat is selected
    useEffect(() => {
        // Only load messages if history is ready and a chat is selected
        if (isChatHistoryReady && currentChatId) {
            fetchMessages(currentChatId);
        } else if (isChatHistoryReady && !currentChatId) {
            // Explicitly clear messages if no chat is selected (New Chat state)
            setMessages([]);
        }
    }, [currentChatId, isChatHistoryReady]); 

    // Polling for Messages in the current chat
    useEffect(() => {
        let intervalId;
        // Only poll if a chat is selected
        if (currentChatId) {
            intervalId = setInterval(() => fetchMessages(currentChatId), POLLING_INTERVAL_MS);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [currentChatId, fetchMessages]);


    // --- API ACTIONS (Memoized) ---
    // Note: handleSendMessage needs saveMessage, startNewChat, fetchDailyLimit, setMessages, etc. 
    // To make handleSendMessage callable in useEffect (for initial message send), 
    // we need to make sure all its dependencies are stable.

    const saveMessage = useCallback(async (chatId, role, text, newTitle = null) => {
        const token = localStorage.getItem('authToken');
        
        if (!token || !chatId) return;
        
        const messagePromise = fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role, text })
        });

        let titlePromise = Promise.resolve();
        if (newTitle) {
             titlePromise = fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: newTitle })
            });
        }
        
        await Promise.all([messagePromise, titlePromise]);
        
        fetchMessages(chatId); 
        fetchChatHistory();
    }, [fetchMessages, fetchChatHistory]);

    const startNewChat = useCallback(async (userMessage) => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        try {
            const tempTitle = userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '');

            const chatResponse = await fetch(`${API_BASE_URL}/api/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: tempTitle })
            });

            if (chatResponse.status === 429) {
                const errorData = await chatResponse.json();
                setModal({ type: 'info', message: errorData.message });
                return null;
            }

            if (!chatResponse.ok) {
                throw new Error('Failed to create chat');
            }

            const chatData = await chatResponse.json();
            
            // Navigate to the new chat URL instead of just setting state
            navigate(`/chat/${chatData.id}`);

            await saveMessage(chatData.id, 'user', userMessage, userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')); 
            
            // INSTANT UPDATE: Call fetchDailyLimit immediately after creation
            fetchDailyLimit();

            return chatData.id;
        } catch (error) {
            console.error("Error starting new chat:", error);
            setModal({ type: 'info', message: "Failed to create new chat. Please try again." });
            return null;
        }
    }, [navigate, saveMessage, fetchDailyLimit]);

    const handleSendMessage = useCallback(async (userMessage = chatInput, isRetry = false) => {
        // Use a local copy of chatInput if no message is provided (normal send button click)
        const messageToSend = userMessage === chatInput ? chatInput : userMessage;

        if (!messageToSend.trim() || isThinking) return;

        let chatIdForSend = currentChatId;
        
        // Temporarily display the user message locally while waiting for the response
        if (!isRetry && chatIdForSend) { // Only display user message if existing chat (new chat handles it in startNewChat)
             setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: messageToSend, timestamp: new Date().toISOString() }]);
        }


        // If no chat ID exists (i.e., we are on /chatnew), start a new chat
        if (!chatIdForSend) {
            // This call creates the chat, navigates to /chat/:id, and saves the first user message
            const newChatId = await startNewChat(messageToSend);
            if (!newChatId) {
                setIsThinking(false);
                return;
            }
            chatIdForSend = newChatId;
        } else if (!isRetry) {
             // If chat exists, just save the user message
             await saveMessage(chatIdForSend, 'user', messageToSend);
        }
        
        if (!chatIdForSend) {
             console.error("Failed to acquire valid chat ID for sending message.");
             setIsThinking(false);
             return;
        }

        // --- Critical Fix for Auto-Scrolling ---
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop <= clientHeight + 1;
            if (isAtBottom) {
                setIsUserScrolling(false); // Enable auto-scroll only if already near bottom
            }
        }
        
        setIsThinking(true);
        setChatInput('');
        const token = localStorage.getItem('authToken');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: messageToSend })
            });

            let result;
            if (response.ok) {
                result = await response.json();
            } else {
                const errorText = await response.text();
                throw new Error(`AI service failed (Status: ${response.status}). Response: ${errorText.substring(0, 100)}...`);
            }

            const aiText = result.reply || "Sorry, I couldn't get a proper response.";
            await saveMessage(chatIdForSend, 'assistant', aiText.trim());

        } catch (error) {
            console.error("Error fetching AI response:", error);
            await saveMessage(chatIdForSend, 'assistant', `⚠️ Error: ${error.message}. Please try sending the message again.`);
        } finally {
            setIsThinking(false);
        }
    }, [chatInput, currentChatId, isThinking, saveMessage, startNewChat]); // Dependency array updated

    // Re-trigger useEffect for initial message after handleSendMessage is stable
    useEffect(() => {
        // Only run if we are on the /chatnew route (no chatId in URL) AND haven't attempted yet
        if (!chatId && !isInitialSendAttempted.current) {
            const initialMessage = sessionStorage.getItem('initialChatMessage');
            
            if (initialMessage) {
                isInitialSendAttempted.current = true; // Mark as attempted
                sessionStorage.removeItem('initialChatMessage');
                
                // Use the memoized handleSendMessage function
                // setChatInput(initialMessage); // Cosmetic, not strictly needed
                setTimeout(() => {
                    handleSendMessage(initialMessage);
                }, 100); 
            }
        }
    }, [chatId, handleSendMessage]);


    // --- SIDEBAR ACTIONS ---
    const handleNewChat = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            // Check daily limit first
            const limitResponse = await fetch(`${API_BASE_URL}/api/chats/daily-limit`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (limitResponse.ok) {
                const limitData = await limitResponse.json();
                if (limitData.remaining === 0) {
                    setModal({ 
                        type: 'info', 
                        message: `Daily chat limit reached (${limitData.used}/5). You can create new chats again tomorrow.` 
                    });
                    return;
                }
            }
            
            // Reset the flag for the new chat session
            isInitialSendAttempted.current = false;
            // CRITICAL CHANGE: Navigate to the new chat route. State cleanup handled by useEffect.
            navigate('/chatnew');

        } catch (error) {
            console.error("Error in handleNewChat:", error);
        }
    };

    const handleSelectChat = (selectedChatId) => {
        // CRITICAL CHANGE: Navigate to the specific chat URL
        if (selectedChatId === currentChatId) return;

        // Reset the flag since this is an *existing* chat
        isInitialSendAttempted.current = true; 
        navigate(`/chat/${selectedChatId}`);

        // Ensure dataset is cleared when switching chats
        setDatasetFile(null);
        sessionStorage.removeItem('datasetFileContent');
        setIsUserScrolling(false); // Reset scroll position when switching
    };

    const renameChat = async (chatId, newName) => {
        if (!newName || !newName.trim() || !chatId) return;
        
        const currentChat = chatHistory.find(c => c.id === chatId);
        if (newName.trim() === currentChat?.title) return;

        const token = localStorage.getItem('authToken');
        try {
            await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: newName.trim() })
            });
            fetchChatHistory();
        } catch (e) {
            console.error("Error renaming chat:", e);
        }
    };

    const deleteChat = async (chatId) => {
        const token = localStorage.getItem('authToken');
        
        if (!chatId) return;

        try {
            await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (currentChatId === chatId) {
                // Navigate to new chat route after deleting current one
                navigate('/chatnew');
            }

            fetchChatHistory();
        } catch (e) {
            console.error("Error deleting chat:", e);
        }
    };
    
    // Helper to open rename modal
    const openRenameModal = (chatId, currentName) => {
        setModal({ type: 'rename', chatId, currentName });
    };

    // Helper to open delete modal
    const openDeleteModal = (chatId) => {
        setModal({ type: 'delete', chatId });
    };

    // --- TRAINING (MODIFIED) ---
    const handleStartTraining = async ({ modelName, taskDescription }) => {
        const datasetData = sessionStorage.getItem('datasetFileContent');
        
        if (!datasetFile || !datasetData) {
             showInfoModal("No dataset file detected. Please upload a file before starting training.");
             return;
        }

        setShowTrainingModal(false);
        setIsThinking(true);

        const userMessage = `Generate Kaggle PyTorch script for dataset: "${datasetFile.name}" with objective: ${taskDescription}. Model: ${modelName}`;
        let chatIdForSend = currentChatId;
        
        if (!chatIdForSend) {
            // This call creates the chat, navigates to /chat/:id, and saves the first user message
            const newChatId = await startNewChat(userMessage);
             if (!newChatId) {
                setIsThinking(false);
                return;
            }
            chatIdForSend = newChatId;
        } else {
            await saveMessage(chatIdForSend, 'user', userMessage);
        }
        
        if (!chatIdForSend) {
             console.error("Failed to acquire valid chat ID for training.");
             setIsThinking(false);
             return;
        }

        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`${API_BASE_URL}/api/train-model`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    fileName: datasetFile.name, 
                    // We pass the data content, though the backend LLM only uses file name/objective
                    fileContentBase64: datasetData, 
                    modelName: modelName.toLowerCase(),
                    taskDescription: taskDescription,
                })
            });

            let result;
            if (response.ok) {
                result = await response.json();
            } else {
                const errorText = await response.text();
                throw new Error(`Script generation failed (Status: ${response.status}). Server Response: ${errorText.substring(0, 100)}...`);
            }
            
            const aiScript = result.ai_script || "Script generation failed. Please try a different prompt.";
            
            // Construct the AI response message with guidance and the code block
            // NOTE: Using inline Tailwind/styles that ReactMarkdown supports for the custom note
            const aiText = `✅ **Training Script Generated!**

The Llama-powered MLOps Advisor has analyzed your request and generated a full PyTorch training script tailored for a Kaggle Notebook environment.

**NEXT STEPS:**
1.  **Upload Data:** Upload your file, \`${result.fileName}\`, to Kaggle as a new Dataset.
2.  **New Notebook:** Create a new Kaggle Notebook and add the dataset as an input.
3.  **Run Code:** Copy the script below into a code cell and execute it.
    
The script is designed to perform the training, save the graphical report as \`training_report.png\`, and export your trained PyTorch model as \`trained_model.pth\` to the Kaggle working directory, which you can then download.

\`\`\`python
${aiScript}
\`\`\`

---
**Note:** AI Cloud Training Agent coming soon!
> This feature will enable one-click model training directly on a cloud platform using the generated script. **Upgrade to Premium to get early access!**`;

            await saveMessage(chatIdForSend, 'assistant', aiText);


        } catch (error) {
            console.error("Training Script Generation Error:", error);
            await saveMessage(chatIdForSend, 'assistant', `❌ **Training Script Generation Failed:** ${error.message}`);
        } finally {
            // Cleanup the dataset from storage regardless of success/failure
            sessionStorage.removeItem('datasetFileContent');
            setDatasetFile(null);
            setIsThinking(false);
        }
    };

    // --- FILE HANDLERS (Reads file into Base64) ---
    const showInfoModal = (message) => {
        setModal({ type: 'info', message });
    }
    
    // Converts File object to Base64 string for storage/transfer
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // Only need the Base64 part
            reader.onerror = error => reject(error);
        });
    }

    const processFile = async (file) => {
        const fileName = file.name.toLowerCase();
        
        if (file.type === '' && file.size === 0) { 
             showInfoModal("Cannot upload folders. Please select a file.");
             return false;
        }
        if (file.size > 5 * 1024 * 1024) { // Max 5MB for base64 in session storage
            showInfoModal("File size exceeds the 5MB limit for direct upload. Please use a smaller file.");
            return false;
        }
        if (fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) {
            showInfoModal("Cannot upload compressed files. Please provide CSV, JSON, or TXT data files directly.");
            return false;
        }
        if (!fileName.endsWith('.csv') && !fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
            showInfoModal("Unsupported file type. Please upload a CSV, JSON, or TXT file.");
            return false;
        }

        try {
            const base64Content = await fileToBase64(file);
            sessionStorage.setItem('datasetFileContent', base64Content);
            setDatasetFile(file);
            setShowTrainingModal(true);
            return true;
        } catch (error) {
            console.error("Error converting file to Base64:", error);
            showInfoModal("Could not read file data. Please try again.");
            return false;
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;

        if (files.length === 1) {
            processFile(files[0]);
        } else if (files.length > 1) {
            showInfoModal("Please upload only one dataset file at a time.");
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files.length === 1) {
            processFile(files[0]);
        }
        e.target.value = null; 
    };
    
    // --- SCROLL LOGIC ---
    // 1. Detect manual scroll
    const handleScroll = () => {
        if (!chatContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px buffer

        if (!isNearBottom) {
            // User is actively scrolling up or away from the bottom
            setIsUserScrolling(true);
        } else {
            // User is near the bottom
            setIsUserScrolling(false);
        }
    };

    // 2. Auto-scroll only when a new message arrives AND user is not manually scrolling
    useEffect(() => {
        if (chatContainerRef.current && !isUserScrolling) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isUserScrolling]);
    
    // 3. Attach scroll listener once
    useEffect(() => {
        const ref = chatContainerRef.current;
        if (ref) {
            ref.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (ref) {
                ref.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const renderAvatarInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    // --- RENDER ---
    return (
        <div className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} relative overflow-hidden font-sans`}>
            
            {/* Modals */}
            {modal?.type === 'rename' && (
                <CustomModal 
                    currentTheme={currentTheme}
                    title="Rename Chat"
                    primaryLabel="Rename"
                    defaultValue={modal.currentName}
                    isInput={true}
                    primaryAction={(newName) => renameChat(modal.chatId, newName)}
                    onClose={() => setModal(null)}
                >
                    <p>Enter a new title for this conversation.</p>
                </CustomModal>
            )}

            {modal?.type === 'delete' && (
                <CustomModal 
                    currentTheme={currentTheme}
                    title="Delete Chat"
                    primaryLabel="Delete"
                    isDanger={true}
                    primaryAction={() => deleteChat(modal.chatId)}
                    onClose={() => setModal(null)}
                >
                    <p>Are you sure you want to delete this chat? This action cannot be undone.</p>
                </CustomModal>
            )}

            {modal?.type === 'info' && (
                <CustomModal 
                    currentTheme={currentTheme}
                    title="File Upload Notice"
                    primaryLabel="Got It"
                    isInfo={true}
                    primaryAction={() => setModal(null)}
                    onClose={() => setModal(null)}
                >
                    <p>{modal.message}</p>
                </CustomModal>
            )}

            {showTrainingModal && (
                <TrainingModal 
                    currentTheme={currentTheme}
                    onClose={() => {
                        setShowTrainingModal(false);
                        sessionStorage.removeItem('datasetFileContent'); 
                        setDatasetFile(null); 
                    }}
                    onSubmit={handleStartTraining}
                    isSubmitting={isThinking}
                    fileName={datasetFile?.name || 'Dataset'} 
                />
            )}

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 ${currentTheme.navBg} border-b ${currentTheme.cardBorder} backdrop-blur-lg`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link to="/mainpage" className={`p-2 rounded-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} hover:border-[#00FFE0] transition-all`}>
                                <ChevronLeft className={`w-6 h-6 ${currentTheme.textPrimary}`} />
                            </Link>
                            <span className="text-lg sm:text-2xl font-bold whitespace-nowrap" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                <span className="text-[#00FFE0]">Model</span><span className={currentTheme.textPrimary}>Nest / </span>
                                <span className="text-[#1E90FF]">AI Chat</span>
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full transition-all ${isDark ? 'bg-black/30 hover:bg-black/50 text-[#00FFE0]' : 'bg-white/30 hover:bg-white/50 text-[#1E90FF]'}`}
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
            
            {/* Main Layout - Use responsive grid/flex for better mobile layout */}
            <div className="flex h-screen pt-[64px] sm:pt-[72px]">
                {/* Sidebar (Hidden on mobile by default) */}
                <div className={`fixed inset-y-0 left-0 w-64 sm:w-80 flex-shrink-0 ${currentTheme.sidebarBg} border-r ${currentTheme.cardBorder} flex flex-col z-40 sm:static transition-transform duration-300 transform -translate-x-full sm:translate-x-0`}>
                    <div className="p-4 pt-20 sm:pt-4">
                        <button 
                            onClick={handleNewChat}
                            className="w-full py-3 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-xl text-black font-extrabold hover:shadow-lg hover:shadow-[#00FFE0]/50 transition-all flex items-center justify-center space-x-2"
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span>New Chat</span>
                        </button>
                        <div className="px-4 pb-2">
                            <p className={`text-xs ${currentTheme.textSecondary} text-center`}>
                                Chats today: {dailyLimit.used}/5
                                {dailyLimit.remaining === 0 && <span className="text-red-400 ml-1">(Limit reached)</span>}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 px-4 pb-4">
                        {chatHistory.length > 0 ? (
                            chatHistory.map((chat) => (
                                <div 
                                    key={chat.id} 
                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                                        chat.id === currentChatId 
                                            ? 'bg-gradient-to-r from-[#1E90FF]/30 to-[#00FFE0]/20 border border-[#1E90FF] shadow-md' 
                                            : `${currentTheme.cardSecondaryBg} border border-transparent hover:bg-white/10 ${isDark ? 'hover:border-[#00FFE0]/50' : 'hover:border-[#1E90FF]/50'}` 
                                    }`}
                                    onClick={() => handleSelectChat(chat.id)}
                                >
                                    <span className={`text-sm font-medium truncate flex-1 ${chat.id === currentChatId ? 'text-white' : currentTheme.textPrimary}`}>
                                        {chat.title || 'Untitled Chat'}
                                    </span>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openRenameModal(chat.id, chat.title); }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-[#00FFE0] transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openDeleteModal(chat.id); }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-red-500 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={`text-xs text-center p-4 ${currentTheme.textSecondary}`}>No chats yet. Start a new one!</p>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div 
                    className={`flex-1 flex flex-col ${currentTheme.bgPrimary} relative`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                >
                    {/* Messages */}
                    <div 
                        ref={chatContainerRef} 
                        className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ${isDark ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}
                    >
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <Brain className="w-16 h-16 sm:w-20 sm:h-20 mb-4 text-[#00FFE0]" />
                                <h2 className={`text-xl sm:text-3xl font-bold ${currentTheme.textPrimary} mb-2`}>ModelNest AI Advisor</h2>
                                <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} max-w-md`}>
                                    Ask questions, get model suggestions, or drag a dataset to start training
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-full sm:max-w-3xl rounded-2xl p-4 shadow-xl transition-all ${
                                    msg.role === 'user' 
                                        ? 'bg-gradient-to-r from-[#1E90FF] to-[#9B59B6] text-white' 
                                        : `${currentTheme.cardBg} border ${currentTheme.cardBorder}`
                                }`}>
                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-[#00FFE0]/20">
                                            <Brain className="w-4 h-4 text-[#00FFE0]" />
                                            <span className="text-xs text-[#00FFE0] font-semibold">AI Advisor</span>
                                        </div>
                                    )}
                                    <div className={`prose max-w-none ${msg.role === 'user' ? 'prose-invert' : isDark ? 'prose-invert' : ''}`}>
                                        <ReactMarkdown> 
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    <span className={`block text-right text-xs mt-2 ${msg.role === 'user' ? 'text-white/70' : currentTheme.textSecondary}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex justify-start">
                                <div className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl p-4 flex items-center space-x-3 shadow-lg`}>
                                    <Loader2 className="w-5 h-5 animate-spin text-[#00FFE0]" />
                                    <span className={`text-sm ${currentTheme.textSecondary}`}>AI is thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Drag Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-[#00FFE0] rounded-3xl m-6 flex items-center justify-center z-50 animate-pulse transition-opacity duration-300"
                             onDragLeave={() => setIsDragging(false)}
                             onDrop={handleFileDrop}
                        >
                            <div className="text-center">
                                <Upload className="w-20 h-20 mx-auto mb-4 text-[#00FFE0]" />
                                <p className="text-2xl font-bold text-white mb-2">Drop Dataset Here</p>
                                <p className="text-sm text-gray-400">Supported: CSV, JSON, TXT (Max 5MB)</p>
                            </div>
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className={`border-t ${currentTheme.cardBorder} ${currentTheme.cardBg} p-4 flex-shrink-0`}>
                        <div className="max-w-4xl mx-auto flex items-center space-x-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".csv,.json,.txt"
                                style={{ display: 'none' }}
                            />

                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-3 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} hover:border-[#00FFE0] rounded-xl transition-all hover:scale-105`}
                                disabled={isThinking}
                                title="Upload dataset"
                            >
                                <FileText className={`w-5 h-5 ${isDark ? 'text-[#00FFE0]' : 'text-[#1E90FF]'}`} />
                            </button>

                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Ask about models, training, or drag a file..."
                                className={`flex-1 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-2xl px-6 py-3.5 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all placeholder:text-gray-500`}
                                disabled={isThinking}
                            />
                            
                            <button
                                onClick={() => handleSendMessage()}
                                className={`p-3.5 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-[#00FFE0]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                disabled={isThinking || !chatInput.trim()}
                                title="Send message"
                            >
                                <Send className="w-5 h-5 text-black" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
                
                .font-sans {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }

                /* Prose Styling for Markdown */
                .prose {
                    color: inherit;
                    line-height: 1.6;
                }
                .prose p {
                    margin: 0.5em 0;
                    line-height: 1.6;
                }
                .prose strong {
                    font-weight: 700;
                    color: inherit;
                }
                .prose em {
                    font-style: italic;
                }
                .prose code {
                    background: rgba(0, 255, 224, 0.1);
                    padding: 0.2em 0.4em;
                    border-radius: 0.25em;
                    font-size: 0.9em;
                    color: #00FFE0;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }
                .prose pre {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 1em;
                    border-radius: 0.5em;
                    overflow-x: auto;
                    margin: 1em 0;
                    white-space: pre;
                }
                .prose pre code {
                    background: none;
                    padding: 0;
                    color: inherit;
                    white-space: pre;
                }
                .prose a {
                    color: #1E90FF;
                    text-decoration: underline;
                }
                .prose ul, .prose ol {
                    margin: 0.5em 0;
                    padding-left: 1.5em;
                    list-style-position: outside;
                }
                .prose ul li {
                    list-style-type: disc;
                }
                .prose ol li {
                    list-style-type: decimal;
                }
                .prose li {
                    margin: 0.25em 0;
                }
                .prose h1, .prose h2, .prose h3 {
                    font-weight: 700;
                    margin: 1em 0 0.5em 0;
                    color: inherit;
                }
                .prose blockquote {
                    border-left: 4px solid #00FFE0;
                    padding-left: 1em;
                    margin: 1em 0;
                    opacity: 0.8;
                }
                
                .prose-invert {
                    color: #E6E6E6;
                }
                .prose-invert strong {
                    color: #fff;
                }
                .prose-invert h1, .prose-invert h2, .prose-invert h3 {
                    color: #00FFE0;
                }
                .prose-invert code {
                    background: rgba(255, 255, 255, 0.1);
                    color: #00FFE0;
                }
                .prose-invert pre {
                    background: rgba(255, 255, 255, 0.1);
                }

                /* Custom Scrollbar */
                .custom-scrollbar-dark::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb {
                    background: rgba(0, 255, 224, 0.3);
                    border-radius: 4px;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 255, 224, 0.5);
                }
                
                .custom-scrollbar-light::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb {
                    background: rgba(30, 144, 255, 0.3);
                    border-radius: 4px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
                    background: rgba(30, 144, 255, 0.5);
                }
            `}</style>
        </div>
    );
}
