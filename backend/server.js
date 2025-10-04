import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

// Load environment variables from .env file
dotenv.config();

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

const User = mongoose.model("User", userSchema);

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


// --- 3. MIDDLEWARE ---

/**
 * @desc Protect routes by verifying JWT token.
 * Attaches user ID to the request object if the token is valid.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// --- 4. EXPRESS APP SETUP ---
const app = express();
app.use(express.json()); // Body parser for JSON
app.use(cors('*'));      // Enable Cross-Origin Resource Sharing

// --- 5. HELPER FUNCTIONS ---

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

// --- 6. ROUTE DEFINITIONS ---

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

// ======== MODEL MARKETPLACE ROUTING ========

const fetchHuggingFaceModels = async () => {
    try {
      const response = await axios.get("https://huggingface.co/api/models?limit=50");
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
      const response = await axios.get("https://api.replicate.com/v1/models", {
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

const fetchOpenAIModels = async () => {
    if (!process.env.OPENAI_API_KEY) return [];
    try {
        const response = await axios.get("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        return response.data.data.map(model => ({
            ...generateMockMetrics(model.id),
            platform: "OpenAI",
            name: model.id,
            description: `Official model from OpenAI.`,
            url: `https://platform.openai.com/docs/models/${model.id}`,
            tags: ['LLM', 'GPT'],
            category: 'Generation',
        }));
    } catch (err) {
        console.warn("OpenAI fetch failed:", err.message);
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
      fetchOpenAIModels(),
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
            fetchOpenAIModels(),
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


// ======== USER MODEL MANAGEMENT ROUTES ========

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
        console.error("Get Deployed Models Error:", error);
        res.status(500).json({ message: "Server error while fetching deployed models." });
    }
});


// ======== NEW DEDICATED DEPLOYMENT CODE GENERATION ROUTE ========

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
        await DockerAuth.findOneAndUpdate(
            { userId: req.user },
            { 
                username: dockerUsername, 
                patOrPassword: dockerPassword,
                authToken: dockerAuthToken
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 2. Save Deployment Record
        const record = new DeploymentRecord({
            userId: req.user,
            modelName: deploymentDetails.modelName,
            sourcePlatform: deploymentDetails.sourcePlatform,
            deployedImageTag: deploymentDetails.deployedImageTag,
            category: deploymentDetails.category,
            description: deploymentDetails.description,
            imageUrl: deploymentDetails.imageUrl
        });

        await record.save();

        res.status(201).json({ 
            message: "Deployment and credentials recorded successfully.", 
            deploymentId: record._id 
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
 * @desc    Proxy general chat messages to Cerebras API
 * @access  Private
 */
app.post("/api/chat", protect, async (req, res) => {
  const { message } = req.body;
  const cerebrasToken = process.env.CEREBRAS_API_KEY; // Using Cerebras token

  if (!message) return res.status(400).json({ message: "Message is required." });
  if (!cerebrasToken) {
    console.error("Cerebras token is not configured on the server.");
    return res.status(500).json({ message: "AI service is not configured." });
  }

  const systemPrompt = `You are a world-class AI Training Advisor named ModelNest. Your goal is to help users with their AI projects by recommending the perfect models or guiding them on training custom ones. Keep your responses concise, helpful, and friendly. You are powered by Meta Llama on Cerebras hardware.`;
  
  // Cerebras API URL
  const apiUrl = "https://api.cerebras.ai/v1/chat/completions";
  
  // Model name. The documentation shows that "llama3.1-8b" and "llama-3.3-70b" are available.
  const model = "llama-4-scout-17b-16e-instruct";

  const payload = {
      model: model,
      messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": message }],
      max_tokens: 1024,
      temperature: 0.2, // Lower temperature for more reliable code generation
  };

  try {
    const cbResponse = await axios.post(apiUrl, payload, {
        headers: { 'Authorization': `Bearer ${cerebrasToken}` }
    });
    
    const aiText = cbResponse.data.choices?.[0]?.message?.content;
    res.json({ reply: aiText || "Sorry, I couldn't get a proper response." });

  } catch (error) {
    console.error("Cerebras API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: "AI service is currently unavailable." });
  }
});


// --- 7. SERVER INITIALIZATION ---
const PORT = process.env.PORT || 8080; // Changed port to 8080
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));