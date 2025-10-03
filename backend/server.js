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

// ======== AUTHENTICATION ROUTES ========

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

// ======== USER PROFILE ROUTES ========

/**
 * @route   GET /api/profile
 * @desc    Get user profile data
 * @access  Private
 */
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

/**
 * @route   PUT /api/profile
 * @desc    Update user profile data
 * @access  Private
 */
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

// ======== AI CHAT ROUTE ========

/**
 * @route   POST /api/chat
 * @desc    Proxy chat messages to Hugging Face Inference API
 * @access  Private
 */
app.post("/api/chat", protect, async (req, res) => {
  const { message } = req.body;
  const hfToken = process.env.HUGGING_FACE_TOKEN;

  if (!message) return res.status(400).json({ message: "Message is required." });
  if (!hfToken) {
    console.error("Hugging Face token is not configured on the server.");
    return res.status(500).json({ message: "AI service is not configured." });
  }

  const systemPrompt = `You are a world-class AI Training Advisor named ModelNest. Your goal is to help users with their AI projects by recommending the perfect models or guiding them on training custom ones. Keep your responses concise, helpful, and friendly. You are powered by Meta Llama.`;
  const apiUrl = `https://router.huggingface.co/v1/chat/completions`;
  const payload = {
      model: "meta-llama/Llama-3.1-8B-Instruct:fireworks-ai",
      messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": message }],
      max_tokens: 1024,
  };

  try {
    const hfResponse = await axios.post(apiUrl, payload, {
        headers: { 'Authorization': `Bearer ${hfToken}` }
    });
    const aiText = hfResponse.data.choices?.[0]?.message?.content;
    res.json({ reply: aiText || "Sorry, I couldn't get a proper response." });
  } catch (error) {
    console.error("Hugging Face API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: "AI service is currently unavailable." });
  }
});


// ======== MODEL MARKETPLACE ROUTE ========

// --- Marketplace Helper Functions ---

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


// --- 7. SERVER INITIALIZATION ---
const PORT = process.env.PORT || 8080; // Changed port to 8080
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

