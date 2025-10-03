import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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


// --- 6. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
