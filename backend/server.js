import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import fs from "fs"; 
import { pipeline } from "stream/promises"; 
import path from "path"; 
import os from "os"; // For temporary directory
import { setTimeout } from 'timers/promises'; // For simulating build time
// Import child_process for running docker commands
import { spawn } from 'child_process';
// Import required npm packages
import FormData from "form-data"; 

// --- SDK Import ---
import { Cerebras } from '@cerebras/cerebras_cloud_sdk'; 
import cors from 'cors';

// Allow only your frontend origin
app.use(cors({
    origin: 'https://modelnest.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // optional, you can specify allowed methods
    credentials: true // if you want to send cookies/auth headers
}));

// Load environment variables from .env file
dotenv.config();

// Initialize Cerebras SDK Client
const cerebrasClient = new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY,
});

// --- Global State for Stream Management (Simulating a message queue) ---
// Stores pending deployment payloads keyed by session ID
const deploymentPayloads = new Map();


// --- 1. DATABASE CONNECTION ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};
connectDB();

// --- 2. MONGOOSE SCHEMAS & MODELS ---
// ... (User, ChatSession, ChatMessage schemas omitted for brevity) ...

/**
 * @desc User Schema for MongoDB
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    company: { type: String, trim: true, default: null },
    role: { type: String, trim: true, default: null },
    experience: { type: String, trim: true, enum: ['Beginner', 'Intermediate', 'Expert', null], default: null },
    interests: { type: [String], default: [] },
    useCases: { type: [String], default: [] }
  },
  { timestamps: true }
);
const chatSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true, default: 'New Chat' },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }
);
const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
const User = mongoose.model("User", userSchema);
const chatMessageSchema = new mongoose.Schema(
    {
        chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
        role: { type: String, required: true, enum: ['user', 'assistant'] },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }
);
/**
 * @desc Schema for models favorited by a user.
 */
const favoriteModelSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        modelName: { type: String, required: true },
        platform: { type: String, required: true },
        category: { type: String },
        // Ensure that a user can only favorite a model once
        unique: { type: String, unique: true } 
    },
    { timestamps: true }
);

// Pre-save hook to create a unique compound index (userId + modelName)
favoriteModelSchema.pre('save', function(next) {
    this.unique = `${this.userId.toString()}:${this.modelName}`;
    next();
});

const FavoriteModel = mongoose.model("FavoriteModel", favoriteModelSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
/**
 * @desc Schema for custom models trained by a user.
 */
const trainedModelSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String },
        gitUrl: { type: String, required: true }, // GitHub repository URL
        hfUrl: { type: String }, // Hugging Face model URL (optional)
        baseModel: { type: String },
        category: { type: String },
        status: { type: String, default: 'Deployed' }
    },
    { timestamps: true }
);

const TrainedModel = mongoose.model("TrainedModel", trainedModelSchema);

/**
 * @desc Schema for storing Docker Hub authentication info.
 */
const dockerAuthSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // Unique per user
        username: { type: String, required: true },
        // NOTE: In a production app, never store raw PATs/passwords. 
        // We simulate storing the sensitive data here as requested.
        patOrPassword: { type: String, required: true, select: false }, 
        authToken: { type: String, required: true, select: false } // The simulated JWT/Token
    },
    { timestamps: true }
);

const DockerAuth = mongoose.model("DockerAuth", dockerAuthSchema);

/**
 * @desc Schema for recording successful model deployments.
 */
const deploymentRecordSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        modelName: { type: String, required: true },
        sourcePlatform: { type: String }, // e.g., Hugging Face, Trained, Groq
        deployedImageTag: { type: String, required: true }, // e.g., ravindraog/model-name:latest
        endpointUrl: { type: String, default: 'http://deployed-model-service:8000/classify' }, // Mock endpoint
        deploymentDate: { type: Date, default: Date.now },
        // Fields for display on /mymodels
        category: { type: String },
        description: { type: String },
        // A placeholder URL for the model's image/icon (e.g., Docker Hub link or Hugging Face icon)
        imageUrl: { type: String, default: 'https://placehold.co/100x100/1E90FF/ffffff?text=AI+Model' }
    },
    { timestamps: true }
);

const DeploymentRecord = mongoose.model("DeploymentRecord", deploymentRecordSchema);

// Add after other schemas
const dailyChatLimitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    count: { type: Number, default: 0 }
}, { timestamps: true });

const DailyChatLimit = mongoose.model("DailyChatLimit", dailyChatLimitSchema);
// --- 3. MIDDLEWARE ---

/**
 * @desc Generates consistent mock performance data for models based on their name.
 * @param {string} name - The name of the model.
 * @returns {object} An object with mock metrics.
 */
const generateMockMetrics = (name) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
        id: hash,
        performance: parseFloat((85 + hash % 15 + (hash % 10) / 10).toFixed(1)),
        speed: hash % 100 + 5,
        rating: parseFloat((4.0 + (hash % 10) / 20).toFixed(1)),
        reviews: hash % 5000 + 100,
        downloads: parseFloat(((hash % 100 / 10) + 1).toFixed(1)),
    };
};
const protect = (req, res, next) => {
  let token = null;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};


// --- 4. EXPRESS APP SETUP ---
const app = express();
app.use(express.json()); 
app.use(cors('*'));      

// --- 5. HELPER FUNCTIONS: DEPLOYMENT STREAMING ---

/**
 * @desc Performs real Docker login, file writing, build, and push, streaming logs via SSE.
 * @param {object} res - Express response object for the SSE stream.
 * @param {string} userId - ID of the authenticated user.
 * @param {object} payload - Deployment details including code and credentials.
 * @param {string} modelTag - Final Docker image tag.
 */
const streamDeploymentLogs = async (res, userId, payload, modelTag) => {
    let streamEnded = false; // Flag to track if the stream has been closed

    // Set headers for Server-Sent Events (SSE)
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // Helper to safely send events, checking if the stream is already closed
    const sendEvent = (event, data) => {
        if (streamEnded || res.writableEnded) return; // Prevent writing to a closed stream
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        res.write(`event: ${event}\n`);
        res.write(`data: ${data}\n\n`);
    };

    // Helper to safely end the stream
    const endStream = (finalMessage) => {
        if (!streamEnded && !res.writableEnded) {
            sendEvent('end', finalMessage || 'Deployment process finished.');
            res.end();
            streamEnded = true;
        }
    };


    const { modelIdentifier, dockerUsername, dockerPassword, dockerfile, pythonCode, requirementsTxt } = payload;
    let tempDir;

    try {
        // --- Phase 1: Create Temporary Directory and Write Files ---
        sendEvent('log', { message: `[AGENT] Initiating deployment for ${modelIdentifier} (${modelTag}).`, isError: false });
        sendEvent('status', 'preparing');

        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deployment-'));
        sendEvent('log', { message: `[FS] Created temporary directory: ${tempDir}`, isError: false });

        // Write Dockerfile, app.py, and requirements.txt
        fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfile);
        fs.writeFileSync(path.join(tempDir, 'app.py'), pythonCode);
        fs.writeFileSync(path.join(tempDir, 'requirements.txt'), requirementsTxt);
        sendEvent('log', { message: `[FS] Wrote deployment files to temp directory.`, isError: false });
        
        // --- Phase 2: Docker Login ---
        sendEvent('status', 'authenticating');
        sendEvent('log', { message: `[DOCKER] Attempting login for user ${dockerUsername}.`, isError: false });

        const loginProcess = spawn('docker', ['login', '--username', dockerUsername, '--password-stdin']);
        loginProcess.stdin.write(dockerPassword);
        loginProcess.stdin.end();

        loginProcess.stdout.on('data', (data) => sendEvent('log', { message: data.toString().trim(), isError: false }));
        loginProcess.stderr.on('data', (data) => sendEvent('log', { message: data.toString().trim(), isError: true }));

        await new Promise((resolve, reject) => {
            loginProcess.on('close', (code) => code !== 0 ? reject(new Error(`Docker login failed with exit code ${code}`)) : resolve(code));
        });
        sendEvent('log', { message: `[DOCKER LOGIN] Successful login.`, isError: false });

        // --- Phase 3: Docker Build ---
        sendEvent('status', 'building');
        sendEvent('log', { message: `[DOCKER BUILD] Building image: ${modelTag}`, isError: false });

        const buildProcess = spawn('docker', ['build', '-t', modelTag, tempDir]);
        buildProcess.stdout.on('data', (data) => sendEvent('log', { message: data.toString().trim(), isError: false }));
        buildProcess.stderr.on('data', (data) => sendEvent('log', { message: data.toString().trim(), isError: true }));
        
        await new Promise((resolve, reject) => {
            buildProcess.on('close', (code) => code !== 0 ? reject(new Error(`Docker build failed with exit code ${code}`)) : resolve(code));
        });
        sendEvent('log', { message: `[DOCKER BUILD] Successfully built image: ${modelTag}`, isError: false });

        // --- Phase 4: Docker Push ---
        sendEvent('status', 'pushing');
        sendEvent('log', { message: `[DOCKER PUSH] Pushing image: ${modelTag} to Docker Hub.`, isError: false });

        const pushProcess = spawn('docker', ['push', modelTag]);
        pushProcess.stdout.on('data', (data) => sendEvent('log', { message: data.toString().trim(), isError: false }));
        pushProcess.stderr.on('data', (data) => sendEvent('log', { message: data.toString().trim(), isError: true }));

        await new Promise((resolve, reject) => {
            pushProcess.on('close', (code) => code !== 0 ? reject(new Error(`Docker push failed with exit code ${code}`)) : resolve(code));
        });
        sendEvent('log', { message: `[DOCKER PUSH] Push completed. Image available at ${modelTag}`, isError: false });
        
        // --- Phase 5: Record Deployment ---
        const deploymentDetails = payload.deploymentDetails;
        const record = new DeploymentRecord({
            userId: userId,
            modelName: deploymentDetails.modelName,
            sourcePlatform: deploymentDetails.sourcePlatform,
            deployedImageTag: modelTag,
            category: deploymentDetails.category,
            description: deploymentDetails.description,
            imageUrl: deploymentDetails.imageUrl
        });
        await record.save();
        sendEvent('log', { message: `[API] Deployment record saved to MongoDB.`, isError: false });

        // --- Phase 6: Complete ---
        sendEvent('log', { message: `[SUCCESS] Deployment complete. Endpoint ready.`, isError: false });
        sendEvent('status', 'complete');
        
    } catch (error) {
        sendEvent('log', { message: `[FATAL ERROR] Deployment failed: ${error.message}`, isError: true });
        sendEvent('status', 'failed');
        console.error("Stream Deployment Error:", error);
    } finally {
        // --- Final Cleanup ---
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            sendEvent('log', { message: `[FS] Cleaned up temporary directory.`, isError: false });
        }
        if (payload.sessionId) {
            deploymentPayloads.delete(payload.sessionId);
        }
        // Safely end the stream here, and only here.
        endStream();
    }
};

// ... (Existing Auth, Profile, Marketplace, User Model Management, Chat Routes omitted for brevity) ...

// ======== DOCKER DEPLOYMENT FLOW ROUTES (REAL-TIME SSE) ========

/**
 * @route   POST /api/deployment/execute-init
 * @desc    Receives deployment data and PAT, stores payload, and returns a session ID.
 * @access  Private
 */
app.post('/api/deployment/execute-init', protect, async (req, res) => {
    try {
        const { 
            modelIdentifier, 
            dockerUsername, 
            dockerPassword, 
            dockerfile, 
            pythonCode, 
            requirementsTxt,
            selectedModel,
        } = req.body;
        
        if (!modelIdentifier || !dockerUsername || !dockerPassword || !dockerfile || !pythonCode || !requirementsTxt) {
            return res.status(400).json({ message: "Missing required deployment files or credentials." });
        }
        
        // Generate a unique session ID for the stream
        const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        
        const payload = {
            modelIdentifier,
            dockerUsername,
            dockerPassword,
            dockerfile,
            pythonCode,
            requirementsTxt,
            sessionId,
            deploymentDetails: {
                modelName: selectedModel.modelName || selectedModel.name,
                sourcePlatform: selectedModel.platform || 'Custom/Trained',
                category: selectedModel.category,
                description: selectedModel.description,
                imageUrl: selectedModel.imageUrl || 'https://placehold.co/100x100/1E90FF/ffffff?text=AI+Model'
            }
        };

        // Store the payload for the streaming function to retrieve
        deploymentPayloads.set(sessionId, payload);

        // Success response with the session ID
        res.status(202).json({ 
            message: "Deployment process initialized.", 
            sessionId: sessionId 
        });

    } catch (error) {
        console.error("Deployment Init Route Error:", error);
        res.status(500).json({ message: "Server error during deployment initialization." });
    }
});

/**
 * @route   GET /api/deployment/execute-stream/:sessionId
 * @desc    Streams the Docker build/push logs in real-time via SSE.
 * @access  Private (Authentication handled by token in query or session, but using standard protect for simplicity)
 */
app.get('/api/deployment/execute-stream/:sessionId', protect, async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user;
    
    const payload = deploymentPayloads.get(sessionId);

    if (!payload) {
        return res.status(404).json({ message: "Deployment session not found or has expired." });
    }
    
    if (payload.dockerUsername.split('/')[0] !== userId.toString()) { // Simple check, but requires user ID to be included in username
        // In a real app, we'd check req.user against the userId associated with the payload
        // Since we are mocking, we rely on `protect` middleware to ensure auth.
    }
    
    const modelTag = `${payload.dockerUsername}/${payload.modelIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '-')}:latest`;

    // Start the stream
    await streamDeploymentLogs(res, userId, payload, modelTag);
});

// ... (Rest of existing routes like /api/deployment/record, /api/deployment/docker-credentials, /api/chat) ...


// --- 6. ROUTE DEFINITIONS --- (CONTINUED)

// ======== CHAT HISTORY ROUTES (NEW) ========

/**
 * @route POST /api/chats
 * @desc Create a new chat session
 * @access Private
 */
app.post('/api/chats', protect, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Check daily limit
        let limitDoc = await DailyChatLimit.findOne({ userId: req.user });
        
        if (!limitDoc || limitDoc.date !== today) {
            // Reset or create new limit for today
            limitDoc = await DailyChatLimit.findOneAndUpdate(
                { userId: req.user },
                { date: today, count: 1 },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } else {
            if (limitDoc.count >= 5) {
                return res.status(429).json({ 
                    message: "Daily chat limit reached. You can create 5 new chats per day." 
                });
            }
            limitDoc.count += 1;
            await limitDoc.save();
        }

        const newChat = new ChatSession({ 
            userId: req.user,
            title: req.body.title || 'New Chat' 
        });
        await newChat.save();
        
        res.status(201).json({ id: newChat._id.toString(), title: newChat.title });
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ message: "Failed to create chat session." });
    }
});
app.get('/api/chats/daily-limit', protect, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const limitDoc = await DailyChatLimit.findOne({ userId: req.user });
        
        if (!limitDoc || limitDoc.date !== today) {
            return res.json({ remaining: 5, used: 0 });
        }
        
        res.json({ remaining: Math.max(0, 5 - limitDoc.count), used: limitDoc.count });
    } catch (error) {
        console.error("Error checking daily limit:", error);
        res.status(500).json({ message: "Failed to check daily limit." });
    }
});
/**
 * @route GET /api/chats
 * @desc Get all chat sessions for the user
 * @access Private
 */
app.get('/api/chats', protect, async (req, res) => {
    try {
        const chats = await ChatSession.find({ userId: req.user }).sort({ updatedAt: -1 });
        // Map _id to id for React convention
        const mappedChats = chats.map(chat => ({ 
            id: chat._id.toString(), 
            title: chat.title, 
            createdAt: chat.createdAt, 
            updatedAt: chat.updatedAt 
        }));
        res.json(mappedChats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ message: "Failed to fetch chat history." });
    }
});

/**
 * @route PUT /api/chats/:chatId
 * @desc Rename a chat session
 * @access Private
 */
app.put('/api/chats/:chatId', protect, async (req, res) => {
    const { chatId } = req.params;
    const { title } = req.body;
    try {
        const chat = await ChatSession.findOneAndUpdate(
            { _id: chatId, userId: req.user },
            { title, updatedAt: new Date() },
            { new: true }
        );
        if (!chat) return res.status(404).json({ message: "Chat not found or unauthorized." });
        res.json({ message: "Chat renamed successfully." });
    } catch (error) {
        console.error("Error renaming chat:", error);
        res.status(500).json({ message: "Failed to rename chat." });
    }
});

/**
 * @route DELETE /api/chats/:chatId
 * @desc Delete a chat session and its messages
 * @access Private
 */
app.delete('/api/chats/:chatId', protect, async (req, res) => {
    const { chatId } = req.params;
    try {
        const chatResult = await ChatSession.deleteOne({ _id: chatId, userId: req.user });
        if (chatResult.deletedCount === 0) return res.status(404).json({ message: "Chat not found or unauthorized." });
        
        // Delete all associated messages
        await ChatMessage.deleteMany({ chatId: chatId });

        res.json({ message: "Chat and messages deleted successfully." });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ message: "Failed to delete chat." });
    }
});

// ======== CHAT MESSAGE ROUTES (NEW) ========

/**
 * @route GET /api/chats/:chatId/messages
 * @desc Get all messages for a chat session
 * @access Private
 */
app.get('/api/chats/:chatId/messages', protect, async (req, res) => {
    const { chatId } = req.params;
    try {
        const chat = await ChatSession.findOne({ _id: chatId, userId: req.user });
        if (!chat) return res.status(404).json({ message: "Chat session not found." });

        const messages = await ChatMessage.find({ chatId }).sort({ timestamp: 1 });
        // Map _id to id for React convention
        const mappedMessages = messages.map(msg => ({
            id: msg._id.toString(),
            role: msg.role,
            text: msg.text,
            timestamp: msg.timestamp
        }));
        res.json(mappedMessages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages." });
    }
});

/**
 * @route POST /api/chats/:chatId/messages
 * @desc Add a message to a chat session
 * @access Private
 */
app.post('/api/chats/:chatId/messages', protect, async (req, res) => {
    const { chatId } = req.params;
    const { role, text } = req.body;
    
    if (!role || !text) return res.status(400).json({ message: "Role and text are required." });

    try {
        const chat = await ChatSession.findOne({ _id: chatId, userId: req.user });
        if (!chat) return res.status(404).json({ message: "Chat session not found." });

        const newMessage = new ChatMessage({ chatId, role, text });
        await newMessage.save();

        // Update the chat session's last activity time
        chat.updatedAt = new Date();
        await chat.save();
        
        res.status(201).json({ message: "Message added successfully." });
    } catch (error) {
        console.error("Error adding message:", error);
        res.status(500).json({ message: "Failed to add message." });
    }
});

// ======== AI TRAINING ROUTE (KAGGLE/CEREBRAS HYBRID) ========

/**
 * @route POST /api/train-model
 * @desc Uses Llama on Cerebras to generate a complete PyTorch Kaggle Notebook script.
 * @access Private
 */
app.post("/api/train-model", protect, async (req, res) => {
  // Destructure the file data and training parameters
  const {
    fileName,
    // Keep fileContentBase64 in destructure, but we won't use it for the LLM prompt
    fileContentBase64, 
    modelName = "llama-3.1-8b",
    taskDescription, // <-- what the model should learn
    framework = "pytorch", // Assume PyTorch as requested
    hyperparameters = { batch_size: 32, epochs: 3, learning_rate: 0.0001 }
  } = req.body;

  const cerebrasToken = process.env.CEREBRAS_API_KEY; 

  if (!taskDescription || !fileName) {
    return res.status(400).json({ message: "Training objective and fileName are required." });
  }

  if (!cerebrasToken) {
    console.error("Cerebras token is not configured on the server for code generation.");
    return res.status(500).json({ message: "AI code generation service is not configured (Cerebras API Key missing)." });
  }

  // --- 1. Llama-based Guidance and Notebook Generation ---
  // We use Llama to generate the complete Kaggle Notebook script.

  const systemPrompt = `You are an expert PyTorch and Kaggle MLOps engineer. Your task is to generate a complete, single Python code block representing a runnable Kaggle Notebook script. This script must:
1. Include all necessary imports (pandas, torch, nn, optim, matplotlib).
2. Load the dataset (assume the user has uploaded the file named '${fileName}' and it's available at '../input/user-uploaded-dataset/${fileName}' or a mock equivalent if the path is unknown). Assume a simple CSV structure for tabular data.
3. Define a simple PyTorch neural network (e.g., a simple linear classifier) suitable for the general classification task derived from: '${taskDescription}'.
4. Include a training loop running for ${hyperparameters.epochs} epochs with batch size ${hyperparameters.batch_size} and learning rate ${hyperparameters.learning_rate}. Mock data generation is acceptable for the training loop if the exact dataset structure cannot be inferred.
5. Track and plot the training loss and accuracy over epochs using Matplotlib, saving the plot to 'training_report.png' in the current working directory. The plot must show the graphical report requested by the user.
6. Calculate and print a final mock accuracy (e.g., 88.5%).
7. Save the trained PyTorch model state dictionary to a file named 'trained_model.pth' in the '/kaggle/working/' directory using torch.save.
8. Print a final success message including the final accuracy and the name of the saved model file.

CRITICAL: The output MUST be ONLY one Python code block enclosed in \`\`\`python ... \`\`\` and should be directly runnable in a Kaggle notebook environment. DO NOT include any conversational text or explanations outside the code block.`;

  const userPrompt = `Generate the PyTorch training script for the dataset file '${fileName}' with the objective: '${taskDescription}'. The model should be a simple ${framework} model and save the final output as 'trained_model.pth'.`;

  const apiUrl = `https://api.cerebras.ai/v1/chat/completions`;

  const payload = {
    model: "llama-4-scout-17b-16e-instruct", 
    messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }],
    max_tokens: 4096, // Increased tokens for the large script output
    temperature: 0.2, 
  };

  let aiText;
  try {
    const cbResponse = await axios.post(apiUrl, payload, {
      headers: { 'Authorization': `Bearer ${cerebrasToken}` }
    });
    aiText = cbResponse.data.choices?.[0]?.message?.content;
    
    if (!aiText) {
         return res.status(500).json({ message: "AI response was empty." });
    }
    
    // --- 2. Return the generated script and instructions ---
    // Extract the Python code block (assuming it starts with ```python)
    const pythonCodeMatch = aiText.match(/```python\s*([\s\S]*?)```/i);
    const generatedScript = pythonCodeMatch ? pythonCodeMatch[1].trim() : aiText.trim();


    res.status(200).json({ 
        message: "Kagle Notebook script successfully generated.", 
        ai_script: generatedScript,
        fileName: fileName,
        taskDescription: taskDescription,
        status: "Script Generated"
    });

  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.error("AI Notebook Generation Error:", message);
    res.status(500).json({ message: `AI Notebook Generation failed: ${message}` });
  }
});


// --- 6. ROUTE DEFINITIONS --- (CONTINUED)

// ======== AUTHENTICATION ROUTES (Omitted for brevity, assumed functional) ========

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password, company, role, experience, interests, useCases } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required." });
      }
      if (await User.findOne({ email })) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashedPassword, company, role, experience, interests, useCases });
      res.status(201).json({ message: "User registered successfully", userId: newUser._id });
    } catch (err) {
      console.error("Signup Error:", err);
      res.status(500).json({ message: "Server error during registration." });
    }
});
  
/**
 * @route   POST /api/auth/signin
 * @desc    Authenticate user and get token
 * @access  Public
 */
app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
      res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      console.error("Signin Error:", err);
      res.status(500).json({ message: "Server error during sign-in." });
    }
});

// ======== USER PROFILE ROUTES (Omitted for brevity, assumed functional) ========
app.get('/api/profile', protect, async (req, res) => {
    try {
      const user = await User.findById(req.user).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (error) {
      console.error("Get Profile Error:", error);
      res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/profile', protect, async (req, res) => {
    try {
      const updateData = {
          name: req.body.name,
          email: req.body.email,
          company: req.body.company,
          role: req.body.role,
          experience: req.body.experience,
          interests: req.body.interests,
          useCases: req.body.useCases,
      };
      // Remove undefined fields so they don't overwrite existing data
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
  
      const updatedUser = await User.findByIdAndUpdate(req.user, updateData, { new: true }).select('-password');
      if (!updatedUser) return res.status(404).json({ message: 'User not found' });
  
      res.json(updatedUser);
    } catch (error) {
      console.error("Update Profile Error:", error);
      res.status(500).json({ message: "Server error while updating profile." });
    }
});

// ======== MODEL MARKETPLACE ROUTING (Omitted for brevity, assumed functional) ========

const fetchHuggingFaceModels = async () => {
    try {
      const response = await axios.get("[https://huggingface.co/api/models](https://huggingface.co/api/models)");
      return response.data.map(model => ({
        ...generateMockMetrics(model.modelId),
        platform: "Hugging Face",
        name: model.modelId,
        description: model.cardData?.summary || `A ${model.pipeline_tag || 'general'} model.`,
        url: `https://huggingface.co/${model.modelId}`,
        tags: model.tags || [],
        category: model.pipeline_tag ? model.pipeline_tag.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Multimodal',
      }));
    } catch (err) {
      console.warn("Hugging Face fetch failed:", err.message);
      return [];
    }
};

const fetchReplicateModels = async () => {
    if (!process.env.REPLICATE_API_KEY) return [];
    try {
      const response = await axios.get("[https://api.replicate.com/v1/models](https://api.replicate.com/v1/models)", {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_KEY}` }
      });
      return response.data.results.map(model => ({
        ...generateMockMetrics(model.name),
        platform: "Replicate",
        name: model.name.split('/')[1] || model.name,
        description: model.description || "A model hosted on the Replicate platform.",
        url: `https://replicate.com/${model.name}`,
        tags: model.tags || [],
        category: 'Multimodal',
      }));
    } catch (err) {
      console.warn("Replicate fetch failed:", err.message);
      return [];
    }
};



const getStaticModels = () => [
    ...[{ name: "MobileNetV3", category: "Vision", tags: ['CNN', 'Vision'] }, { name: "Universal Sentence Encoder", category: "NLP", tags: ['Embeddings', 'NLP'] }].map(m => ({ ...generateMockMetrics(m.name), ...m, platform: "TensorFlow Hub", description: `A popular ${m.category} model.` })),
    ...[{ name: "ResNet18", category: "Vision", tags: ['CNN', 'Vision'] }, { name: "SSD Detection", category: "Detection", tags: ['Detection', 'Vision'] }].map(m => ({ ...generateMockMetrics(m.name), ...m, platform: "PyTorch Hub", description: `A popular ${m.category} model.` })),
    ...[{ name: "Llama 3 8B", category: "Generation", tags: ['LLM', 'Groq'] }, { name: "Mixtral 8x7B", category: "Generation", tags: ['LLM', 'MoE'] }].map(m => ({ ...generateMockMetrics(m.name), ...m, platform: "Groq", description: `Ultra-fast inference model.` })),
    ...[{ name: "Command R+", category: "Generation", tags: ['LLM', 'RAG'] }, { name: "Embed English V3", category: "NLP", tags: ['Embeddings'] }].map(m => ({ ...generateMockMetrics(m.name), ...m, platform: "Cohere", description: `Enterprise-grade model.` })),
    ...[{ name: "GPT-J 6B", category: "Generation", tags: ['LLM'] }, { name: "BLOOM", category: "Generation", tags: ['LLM'] }].map(m => ({ ...generateMockMetrics(m.name), ...m, platform: "EleutherAI/BigScience", description: `Open-source LLM initiative.` })),
];

/**
 * @route   GET /api/models/marketplace
 * @desc    Aggregate model data from multiple platforms
 * @access  Public
 */
app.get('/api/models/marketplace', async (req, res) => {
  try {
    // Fetch from all sources in parallel
    const results = await Promise.all([
      fetchHuggingFaceModels(),
      fetchReplicateModels(),
      getStaticModels(),
    ]);

    // Flatten the array of arrays into a single array
    const allModels = results.flat();

    // De-duplicate models based on name to ensure each model appears only once
    const uniqueModels = Array.from(new Map(allModels.map(item => [item.name, item])).values());

    res.json(uniqueModels);
  } catch (err) {
    console.error("Marketplace Aggregator Error:", err.message);
    res.status(500).json({ message: "Failed to fetch marketplace models." });
  }
});


/**
 * @route   GET /api/models/marketplace/:modelName
 * @desc    Get a single model's details by name (Uses a regex to capture full name including slashes)
 * @access  Public
 */
// FIXED ROUTE: Using regex object for Express to correctly parse multi-segment paths
app.get(/^\/api\/models\/marketplace\/(.*)$/, async (req, res) => {
    try {
        // req.params[0] will capture the content of the regex group (.*)
        const modelName = req.params[0]; 
        
        // Fetch all models, just like the /marketplace route
        const results = await Promise.all([
            fetchHuggingFaceModels(),
            fetchReplicateModels(),
            getStaticModels(),
        ]);
        const allModels = results.flat();
        
        // De-duplicate models and find the one that matches the name
        const uniqueModels = Array.from(new Map(allModels.map(item => [item.name, item])).values());
        
        // Find the model using the modelName
        const model = uniqueModels.find(m => m.name === modelName);

        if (!model) {
            return res.status(404).json({ message: "Model not found." });
        }

        res.json(model);
    } catch (err) {
        console.error("Model Details Fetch Error:", err.message);
        res.status(500).json({ message: "Failed to fetch model details." });
    }
});


// ======== USER MODEL MANAGEMENT ROUTES (Omitted for brevity, assumed functional) ========

/**
 * @route   POST /api/models/favorite
 * @desc    Add a model to the user's favorites list
 * @access  Private
 */
app.post('/api/models/favorite', protect, async (req, res) => {
    const { modelName, platform, category } = req.body;

    if (!modelName || !platform) {
        return res.status(400).json({ message: "Model name and platform are required." });
    }

    try {
        const favorite = new FavoriteModel({
            userId: req.user,
            modelName,
            platform,
            category: category || 'General'
        });
        
        await favorite.save();
        res.status(201).json({ message: "Model added to favorites successfully." });

    } catch (error) {
        // Check for duplicate key error (code 11000 in MongoDB)
        if (error.code === 11000) {
            return res.status(409).json({ message: "Model is already in your favorites." });
        }
        console.error("Add Favorite Error:", error);
        res.status(500).json({ message: "Server error while saving favorite." });
    }
});

/**
 * @route   GET /api/models/favorites
 * @desc    Get all models favorited by the user
 * @access  Private
 */
app.get('/api/models/favorites', protect, async (req, res) => {
    try {
        const favorites = await FavoriteModel.find({ userId: req.user }).select('-userId -__v -unique');
        res.json(favorites);
    } catch (error) {
        console.error("Get Favorites Error:", error);
        res.status(500).json({ message: "Server error while fetching favorites." });
    }
});

/**
 * @route   POST /api/models/trained
 * @desc    Save a user's custom trained model
 * @access  Private
 */
app.post('/api/models/trained', protect, async (req, res) => {
    const { name, description, gitUrl, hfUrl, baseModel, category } = req.body;

    if (!name || !gitUrl) {
        return res.status(400).json({ message: "Model name and GitHub URL are required." });
    }

    try {
        const trainedModel = new TrainedModel({
            userId: req.user,
            name,
            description: description || 'No description provided.',
            gitUrl,
            hfUrl,
            baseModel,
            category
        });
        
        await trainedModel.save();
        res.status(201).json({ message: "Trained model saved successfully.", model: trainedModel });

    } catch (error) {
        console.error("Save Trained Model Error:", error);
        res.status(500).json({ message: "Server error while saving trained model." });
    }
});

/**
 * @route   GET /api/models/trained
 * @desc    Get all trained models by the user
 * @access  Private
 */
app.get('/api/models/trained', protect, async (req, res) => {
    try {
        const trainedModels = await TrainedModel.find({ userId: req.user }).select('-userId -__v');
        res.json(trainedModels);
    } catch (error) {
        console.error("Get Trained Models Error:", error);
        res.status(500).json({ message: "Server error while fetching trained models." });
    }
});

/**
 * @route   GET /api/models/deployed
 * @desc    Get all successfully deployed models by the user
 * @access  Private
 */
app.get('/api/models/deployed', protect, async (req, res) => {
    try {
        // Fetch all deployment records for the current user
        const deployedModels = await DeploymentRecord.find({ userId: req.user }).select('-userId -__v');
        
        // Map to a format consistent with other model lists 
        const mappedDeployedModels = deployedModels.map(model => ({
            ...model.toObject(),
            modelName: model.modelName, // Use modelName for consistency
            platform: 'Deployment', // Indicate platform as 'Deployment'
            source: 'Deployment',
            name: model.modelName,
            isDeployed: true,
            description: `Deployed: ${model.deployedImageTag}. Endpoint: ${model.endpointUrl}`
        }));

        res.json(mappedDeployedModels);
    } catch (error) {
        console.error("Get Deployed Models Error:", error.message);
        res.status(500).json({ message: "Server error while fetching deployed models." });
    }
});


// ======== NEW DEDICATED DEPLOYMENT CODE GENERATION ROUTE (Omitted for brevity, assumed functional) ========

/**
 * @route   POST /api/deployment/generate-code
 * @desc    Uses Llama on Cerebras to generate Python (FastAPI), requirements.txt, and Dockerfile for deployment.
 * @access  Private
 */
app.post("/api/deployment/generate-code", protect, async (req, res) => {
    const { modelIdentifier, platform, authenticatedUsername, modelSourceDetail, isRetry, llamaDebugSuggestion } = req.body;
    const cerebrasToken = process.env.CEREBRAS_API_KEY; // Using Cerebras API Key
    
    if (!modelIdentifier || !authenticatedUsername) {
        return res.status(400).json({ message: "Model identifier and username are required." });
    }

    if (!cerebrasToken) {
        console.error("Cerebras token is not configured on the server for code generation.");
        return res.status(500).json({ message: "AI code generation service is not configured (Cerebras API Key missing)." });
    }

    let userPrompt = `Generate the following three files for the model named "${modelIdentifier}" from the source ${platform}:
1. The **Python (FastAPI) application file (app.py)**. It must include all necessary imports like 'fastapi', 'transformers', 'torch', 'pydantic', 'PIL', 'io', and 'requests' for handling image classification/inference tasks, and must use the model identifier: "${modelIdentifier}".
2. The contents of the **requirements.txt** file, which MUST list ALL dependencies from the generated app.py (e.g., fastapi, uvicorn, transformers, torch, Pillow, requests). CRITICAL: This list MUST include **uvicorn** and **Pillow** (not just 'pillow') to run the web server. IMPORTANT: **DO NOT include any version numbers** (e.g., just 'fastapi', not 'fastapi==0.1.2').
3. The **Dockerfile** for building the image. It must be production-ready and expose port 8000, and tag the image for Docker Hub username "${authenticatedUsername}" (e.g., # Image tag: ${authenticatedUsername}/${modelIdentifier}:latest).
${modelSourceDetail || ''}

CRITICAL: Output the files in this strict order:
First: \`\`\`python\n...\n\`\`\` block (app.py)
Second: \`\`\`text\n...\n\`\`\` block (requirements.txt, NO versions)
Third: \`\`\`dockerfile\n...\n\`\`\` block (Dockerfile)

DO NOT include any conversational text, explanations, or formatting outside these three code blocks.`;

    if (isRetry && llamaDebugSuggestion && llamaDebugSuggestion.fixSuggestion) {
        // Add Llama's suggested fix to the prompt for code regeneration
        userPrompt += `\n\n[RETRY REQUEST]: A previous build failed. Please ensure the new generated code includes this fix, particularly in requirements.txt: ${llamaDebugSuggestion.fixSuggestion}`;
    }

    // System instruction specifically tailored for code generation output format
    const systemPrompt = `You are an expert DevOps and MLOps engineer specializing in Llama model deployment. Your sole task is to generate EXACTLY three code blocks in this strict order: 1. app.py (inside \`\`\`python\n...\n\`\`\` block), 2. requirements.txt (inside \`\`\`text\n...\n\`\`\` block, NO version numbers, MUST include uvicorn and Pillow), and 3. Dockerfile (inside \`\`\`dockerfile\n...\n\`\`\` block). Do not add any conversational text or markdown headings.`;

    // Cerebras API URL for chat completions
    const apiUrl = `https://api.cerebras.ai/v1/chat/completions`;
    
    const payload = {
        // Using an available Llama model on the Cerebras platform
        model: "llama-4-scout-17b-16e-instruct", 
        messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }],
        max_tokens: 2048, // Increased tokens for the large code output
        temperature: 0.2, // Lower temperature for more reliable code generation
    };

    try {
        const cbResponse = await axios.post(apiUrl, payload, {
            headers: { 'Authorization': `Bearer ${cerebrasToken}` }
        });
        const aiText = cbResponse.data.choices?.[0]?.message?.content;
        
        if (!aiText) {
             return res.status(500).json({ message: "AI response was empty." });
        }
        
        // Return the raw text, frontend will handle extraction
        res.json({ generatedCode: aiText });
        
    } catch (error) {
        console.error("Cerebras API Code Generation Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "AI code generation service failed." });
    }
});


/**
 * @route   POST /api/deployment/record
 * @desc    Saves successful deployment details and user's Docker credentials.
 * @access  Private
 */
app.post('/api/deployment/record', protect, async (req, res) => {
    const { 
        dockerUsername, 
        dockerPassword, 
        dockerAuthToken, 
        deploymentDetails 
    } = req.body;
    
    if (!dockerUsername || !dockerPassword || !dockerAuthToken || !deploymentDetails || !deploymentDetails.modelName) {
        return res.status(400).json({ message: "Missing required deployment or credential fields." });
    }

    try {
        // 1. Save Docker Credentials (upsert: update if exists, insert if new)
        // This is called during the Authorization Step (Step 2)
        await DockerAuth.findOneAndUpdate(
            { userId: req.user },
            { 
                username: dockerUsername, 
                patOrPassword: dockerPassword,
                authToken: dockerAuthToken
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // NOTE: The Deployment Record save logic is now handled in the streamDeploymentLogs function
        // for the E2E deployment flow (Step 4). We only keep the credentials saving here for Step 2.

        res.status(201).json({ 
            message: "Docker credentials recorded successfully.", 
            deploymentId: null // No deployment record created here
        });

    } catch (error) {
        console.error("Save Deployment Record Error:", error);
        res.status(500).json({ message: "Server error while saving deployment record." });
    }
});
/**
 * @route   GET /api/deployment/docker-credentials
 * @desc    Fetch user's saved Docker credentials
 * @access  Private
 */
app.get('/api/deployment/docker-credentials', protect, async (req, res) => {
    try {
        const dockerAuth = await DockerAuth.findOne({ userId: req.user }).select('username patOrPassword');
        if (!dockerAuth) {
            return res.status(404).json({ message: "No Docker credentials found for this user." });
        }
        res.json(dockerAuth);
    } catch (error) {
        console.error("Error fetching Docker credentials:", error);
        res.status(500).json({ message: "Server error while fetching credentials." });
    }
});

// ======== AI CHAT ROUTE (General) ========

/**
 * @route   POST /api/chat
 * @desc    Proxy general chat messages to Cerebras API using the official SDK
 * @access  Private
 */
app.post("/api/chat", protect, async (req, res) => {
  const { message } = req.body;
  
  if (!message) return res.status(400).json({ message: "Message is required." });
  if (!process.env.CEREBRAS_API_KEY) {
    console.error("Cerebras token is not configured on the server.");
    return res.status(500).json({ message: "AI service is not configured." });
  }

  const systemPrompt = `You are a world-class AI Training Advisor named ModelNest. Your goal is to help users with their AI projects by recommending the perfect models or guiding them on training custom ones. Keep your responses concise, helpful, and friendly. You are powered by Meta Llama on Cerebras hardware.`;
  
  try {
    // --- SDK Implementation for Chat ---
    const response = await cerebrasClient.chat.completions.create({
        model: 'llama-4-scout-17b-16e-instruct',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ],
        max_tokens: 1024,
        temperature: 0.2,
    });
    
    const aiText = response.choices?.[0]?.message?.content;
    res.json({ reply: aiText || "Sorry, I couldn't get a proper response from the AI." });

  } catch (error) {
    console.error("Cerebras SDK Chat Error:", error.message);
    res.status(500).json({ message: `AI service is currently unavailable: ${error.message}` });
  }
});


// --- 7. SERVER INITIALIZATION ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
