import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios"; // 👈 NEW: Import axios for external API calls

// Load environment variables
dotenv.config();

// --- 1. Database Connection ---
const connectDB = async () => {
  try {
    // Note: process.env.MONGO_URI must be defined in your .env file
    // Example: MONGO_URI=mongodb+srv://ravi:ravi7677@cluster0.rfkxncf.mongodb.net/modelnest
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
connectDB();

// --- 2. User Schema and Model ---
const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true 
    },
    password: { 
      type: String, 
      required: true, 
      minlength: 8 
    },
    company: {
      type: String,
      trim: true,
      default: null
    },
    role: {
      type: String,
      trim: true,
      default: null
    },
    experience: {
      type: String,
      trim: true,
      enum: ['Beginner', 'Intermediate', 'Expert', null],
      default: null
    },
    interests: {
      type: [String],
      default: []
    },
    useCases: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// --- 3. Authentication Middleware (protect) ---
const protect = (req, res, next) => {
  // Extract token from 'Bearer TOKEN' format
  const token = req.headers.authorization?.split(" ")[1]; 
  if (!token) return res.status(401).json({ message: "No token, unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user ID from token payload to request object
    req.user = decoded.id; 
    next();
  } catch {
    res.status(401).json({ message: "Token invalid" });
  }
};

// --- 4. Express App Setup ---
const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors('*')); // Allow all origins for CORS

// --- Helper function to generate mock performance data consistently ---
// (Needed because external APIs often don't provide these metrics)
const generateMockMetrics = (name) => {
    // Simple hash function for consistent mock data
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
        id: hash,
        performance: parseFloat((85 + hash % 15 + (hash % 10) / 10).toFixed(1)), // 85% - 100%
        speed: hash % 100 + 5, // 5ms - 104ms
        rating: parseFloat((4.0 + (hash % 10) / 20).toFixed(1)), // 4.0 - 4.5
        reviews: hash % 5000 + 100,
        downloads: parseFloat((hash % 100 / 10 + 1).toFixed(1)), // 1M - 11M
        tags: [], // Will be overwritten if tags exist
    };
};


// --- 5. Route Definitions (Inline Controllers) ---

// POST /api/auth/signup - User Registration
app.post("/api/auth/signup", async (req, res) => {
  try {
    // Destructure all fields, including optional ones
    const { name, email, password, company, role, experience, interests, useCases } = req.body;
    
    // Check for required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all collected data fields
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      company,
      role,
      experience,
      interests,
      useCases
    });

    res.status(201).json({ 
      message: "User registered successfully", 
      userId: newUser._id 
    });
  } catch (err) {
    // IMPORTANT: Log Mongoose errors (like E11000 duplicate key or validation errors)
    console.error("Registration Error:", err); 
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/signin - User Login
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/profile - Fetch user profile (Protected)
app.get('/api/profile', protect, async (req, res) => {
  try {
    // req.user contains the ID from the protect middleware
    const user = await User.findById(req.user).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/profile - Update user profile (Protected)
app.put('/api/profile', protect, async (req, res) => {
  try {
    // req.user contains the ID from the protect middleware
    const user = await User.findById(req.user);

    if (user) {
      // Update fields from the request body, falling back to existing data if not provided
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.company = req.body.company || user.company;
      user.role = req.body.role || user.role;
      user.experience = req.body.experience || user.experience;
      user.interests = req.body.interests || user.interests;
      user.useCases = req.body.useCases || user.useCases;

      const updatedUser = await user.save();

      // Return the updated user object (excluding password)
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        company: updatedUser.company,
        role: updatedUser.role,
        experience: updatedUser.experience,
        interests: updatedUser.interests,
        useCases: updatedUser.useCases,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    // IMPORTANT: Log the error. If a user tries to change their email to one that already exists, 
    // Mongoose throws an E11000 error here, which will be logged.
    console.error("Update Profile Error:", error); 
    res.status(500).json({ message: error.message });
  }
});


// --- NEW: GET /api/models/marketplace - Aggregate Model Data ---
app.get('/api/models/marketplace', async (req, res) => {
  try {
    const fetchPromises = [];
    let allModels = [];

    // --- 1. Hugging Face (Public Endpoint) ---
    fetchPromises.push(
      axios.get("https://huggingface.co/api/models?limit=50")
        .then(hfResponse => {
          const models = hfResponse.data.map(model => ({
            ...generateMockMetrics(model.modelId), // Add mock performance metrics
            platform: "Hugging Face",
            name: model.modelId,
            description: model.cardData?.summary || `A ${model.pipeline_tag || 'general'} model from Hugging Face.`,
            url: `https://huggingface.co/${model.modelId}`,
            tags: model.tags || [],
            category: model.pipeline_tag ? model.pipeline_tag.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Multimodal',
          }));
          return models;
        })
        .catch(err => {
          console.warn("Hugging Face fetch failed:", err.message);
          return [];
        })
    );

    // --- 2. Replicate (Requires API Key) ---
    // Replicate
if (process.env.REPLICATE_API_KEY) {
  fetchPromises.push(
    axios.get("https://api.replicate.com/v1/models", {
  headers: { Authorization: `Token ${process.env.REPLICATE_API_KEY}` }
})
.then(repResponse => {
  const rawModels = repResponse.data.results; // <- Use the correct key
  return rawModels.map(model => ({
    ...generateMockMetrics(model.name),
    platform: "Replicate",
    name: model.name.split('/')[1] || model.name,
    description: model.description || "",
    url: `https://replicate.com/${model.name}`,
    tags: model.tags || [],
    category: 'Multimodal',
  }));
})

  );
}

// OpenAI
if (process.env.OPENAI_API_KEY) {
  fetchPromises.push(
    axios.get("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    })
    .then(openAIResponse => openAIResponse.data.data.map(model => ({
      ...generateMockMetrics(model.id),
      platform: "OpenAI",
      name: model.id,
      description: `OpenAI model: ${model.id}`,
      url: `https://platform.openai.com/models/${model.id}`,
      tags: ['LLM', 'GPT'],
      category: 'Generation',
    })))
    .catch(err => {
      console.warn("OpenAI fetch failed:", err.message);
      return [];
    })
  );
}

    
    // --- 4. TensorFlow Hub (Reference URLs) ---
    const tensorFlowModels = [
      { name: "MobileNetV3", category: "Vision", url: "https://tfhub.dev/google/imagenet/mobilenet_v3_small_100_224/classification/5", tags: ['CNN', 'Vision'] },
      { name: "Universal Sentence Encoder", category: "NLP", url: "https://tfhub.dev/google/universal-sentence-encoder/4", tags: ['Embeddings', 'NLP'] },
    ].map(model => ({
      ...generateMockMetrics(model.name),
      ...model,
      platform: "TensorFlow Hub",
      description: `Reference link to a popular ${model.category} model on TensorFlow Hub.`,
    }));
    allModels.push(...tensorFlowModels);

    // --- 5. PyTorch Hub (Reference URLs) ---
    const pytorchModels = [
      { name: "ResNet18", category: "Vision", url: "https://pytorch.org/hub/pytorch_vision_resnet/", tags: ['CNN', 'Vision', 'PyTorch'] },
      { name: "SSD Detection", category: "Detection", url: "https://pytorch.org/hub/nvidia_deeplearningexamples_ssd/", tags: ['Detection', 'Vision'] },
    ].map(model => ({
      ...generateMockMetrics(model.name),
      ...model,
      platform: "PyTorch Hub",
      description: `Reference link to a popular ${model.category} model on PyTorch Hub.`,
    }));
    allModels.push(...pytorchModels);

    // --- 6. Groq (Reference URLs for supported models) ---
    const groqModels = [
      { name: "Llama 3 8B", category: "Generation", url: "https://groq.com/products/llama-3/", tags: ['LLM', 'Fast', 'Groq'] },
      { name: "Mixtral 8x7B", category: "Generation", url: "https://groq.com/products/mixtral-8x7b/", tags: ['LLM', 'MoE', 'Fast'] },
    ].map(model => ({
      ...generateMockMetrics(model.name),
      ...model,
      platform: "Groq",
      description: `Ultra-fast inference model supported by Groq.`,
    }));
    allModels.push(...groqModels);

    // --- 7. Cohere (Reference URLs for key models) ---
    const cohereModels = [
      { name: "Command R+", category: "Generation", url: "https://cohere.com/models/command-r-plus", tags: ['LLM', 'RAG'] },
      { name: "Embed English V3", category: "NLP", url: "https://cohere.com/models/embed-english-v3", tags: ['Embeddings', 'NLP'] },
    ].map(model => ({
      ...generateMockMetrics(model.name),
      ...model,
      platform: "Cohere",
      description: `Enterprise-grade model from Cohere.`,
    }));
    allModels.push(...cohereModels);

    // --- 8. EleutherAI / BigScience (Reference URLs, often hosted on HF) ---
    const eleutherModels = [
      { name: "GPT-J 6B", category: "Generation", url: "https://huggingface.co/EleutherAI/gpt-j-6b", tags: ['Open Source', 'LLM'] },
      { name: "BLOOM", category: "Generation", url: "https://huggingface.co/bigscience/bloom", tags: ['BigScience', 'LLM'] },
    ].map(model => ({
      ...generateMockMetrics(model.name),
      ...model,
      platform: "EleutherAI/BigScience",
      description: `Open-source large language model initiative.`,
    }));
    allModels.push(...eleutherModels);

    // Wait for all promises (Hugging Face, Replicate, OpenAI) to resolve
    const fetchedResults = await Promise.all(fetchPromises);
    fetchedResults.forEach(result => {
      allModels.push(...result);
    });

    // Final processing: Ensure unique IDs and combine all
    const uniqueModels = [];
    const modelNames = new Set();
    
    allModels.forEach(model => {
      if (!modelNames.has(model.name)) {
        modelNames.add(model.name);
        uniqueModels.push(model);
      }
    });

    res.json(uniqueModels);
  } catch (err) {
    console.error("Marketplace API Aggregator Error:", err.message);
    res.status(500).json({ message: "Failed to fetch marketplace models" });
  }
});


// --- 6. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
