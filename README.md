<img width="1350" height="500" alt="1" href="https://modelnest.vercel.app/" src="https://github.com/user-attachments/assets/666200c4-d7b2-4452-8522-d2044ab8d7f2"  />

# AI Model Command Center and Marketplace - Developer Documentation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6+-brightgreen.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-v4+-blue.svg)](https://expressjs.com/)

## Overview

The **AI Model Command Center** is a comprehensive, end-to-end platform for AI model discovery, training, deployment, and management. It aggregates models from multiple sources (Hugging Face, Replicate, TensorFlow Hub, PyTorch Hub, Groq, Cohere, etc.), provides AI-powered recommendations via Meta Llama on Cerebras hardware, and offers one-click Docker deployment to the cloud.

### Key Features

- **Smart Discovery**: Browse and search 10,000+ AI models from multiple platforms
- **AI Advisor**: Get personalized model recommendations powered by Llama models
- **Live Benchmarking**: Compare models on accuracy, speed, and downloads
- **Cerebras Training**: Generate PyTorch training scripts for custom models
- **One-Click Deploy**: Deploy models to Docker Hub with real-time build logs
- **Personal Model Hub**: Manage favorites, trained models, and deployments
- **AI Code Generation**: Auto-generate FastAPI servers, Dockerfiles, and dependencies
- **AI Debugging**: Get intelligent suggestions when Docker builds fail

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Deployment Workflow](#deployment-workflow)
8. [Tech Stack](#tech-stack)
9. [Contributors](#contributors)
10. [License](#license)

---

## Architecture

<img width="1828" height="1084" alt="diagram-export-10-5-2025-4_47_39-PM" src="https://github.com/user-attachments/assets/8d1c4bb4-6977-4552-9776-21c57d47b02c" />

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** v6 or higher
- **Docker** installed and running (for deployment features)
- **Cerebras API Key** (for AI features)
- **Docker Hub Account** (for model deployment)
- Optional: **Replicate API Key** (for additional model sources)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/ravindraogg/AI-Model-Marketplace-and-Advisor.git
cd modelnest 

# Install dependencies
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

# Start MongoDB (if running locally)
mongod --dbpath /path/to/your/data

# Start the server
npm run dev
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/ai-model-platform

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Cerebras API (Required)
CEREBRAS_API_KEY=your_cerebras_api_key_here

# Optional API Keys
REPLICATE_API_KEY=your_replicate_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

---

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "name": "Ravindra",
  "email": "Ravindra@example.com",
  "password": "securePassword123",
  "company": "Tech Corp",
  "role": "ML Engineer",
  "experience": "Intermediate",
  "interests": ["Computer Vision", "NLP"],
  "useCases": ["Image Classification", "Text Generation"]
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011"
}
```

---

#### POST `/api/auth/signin`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "Ravindra@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ravindra",
    "email": "Ravindra@example.com"
  }
}
```

---

### User Profile

#### GET `/api/profile`
Fetch authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Ravindra",
  "email": "Ravindra@example.com",
  "company": "Tech Corp",
  "role": "ML Engineer",
  "experience": "Intermediate",
  "interests": ["Computer Vision", "NLP"],
  "useCases": ["Image Classification"]
}
```

---

#### PUT `/api/profile`
Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Ravindra Smith",
  "company": "AI Innovations",
  "interests": ["Computer Vision", "NLP", "Reinforcement Learning"]
}
```

---

### Marketplace

#### GET `/api/models/marketplace`
Fetch aggregated models from all platforms.

**Response:**
```json
[
  {
    "id": 12345,
    "platform": "Hugging Face",
    "name": "bert-base-uncased",
    "description": "A general NLP model.",
    "url": "https://huggingface.co/bert-base-uncased",
    "tags": ["NLP", "transformers"],
    "category": "Text Classification",
    "performance": 92.3,
    "speed": 45,
    "rating": 4.7,
    "reviews": 2341,
    "downloads": 45.2
  }
]
```

---

#### GET `/api/models/marketplace/:modelName`
Fetch detailed information about a specific model.

**Example:** `/api/models/marketplace/bert-base-uncased`

**Response:**
```json
{
  "id": 12345,
  "platform": "Hugging Face",
  "name": "bert-base-uncased",
  "description": "BERT base model (uncased)",
  "url": "https://huggingface.co/bert-base-uncased",
  "tags": ["NLP", "transformers", "pytorch"],
  "category": "Text Classification",
  "performance": 92.3,
  "speed": 45,
  "rating": 4.7,
  "reviews": 2341,
  "downloads": 45.2
}
```

---

### Model Management

#### POST `/api/models/favorite`
Add a model to user's favorites.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "modelName": "bert-base-uncased",
  "platform": "Hugging Face",
  "category": "NLP"
}
```

---

#### GET `/api/models/favorites`
Retrieve user's favorited models.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "modelName": "bert-base-uncased",
    "platform": "Hugging Face",
    "category": "NLP",
    "createdAt": "2024-10-01T12:00:00.000Z"
  }
]
```

---

#### POST `/api/models/trained`
Log a custom-trained model.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "my-custom-classifier",
  "description": "Fine-tuned BERT for sentiment analysis",
  "gitUrl": "https://github.com/username/my-custom-classifier",
  "hfUrl": "https://huggingface.co/username/my-custom-classifier",
  "baseModel": "bert-base-uncased",
  "category": "NLP"
}
```

---

#### GET `/api/models/trained`
Retrieve user's trained models.

**Headers:**
```
Authorization: Bearer <token>
```

---

#### GET `/api/models/deployed`
Retrieve user's successfully deployed models.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "modelName": "bert-sentiment-analyzer",
    "sourcePlatform": "Hugging Face",
    "deployedImageTag": "Ravindradoe/bert-sentiment:latest",
    "endpointUrl": "http://deployed-model-service:8000/classify",
    "deploymentDate": "2024-10-05T10:30:00.000Z",
    "category": "NLP",
    "description": "Deployed: Ravindradoe/bert-sentiment:latest"
  }
]
```

---

### Chat & AI Advisor

#### POST `/api/chats`
Create a new chat session.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Model Recommendations"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Model Recommendations"
}
```

---

#### GET `/api/chats`
Retrieve all chat sessions for the user.

**Headers:**
```
Authorization: Bearer <token>
```

---

#### GET `/api/chats/daily-limit`
Check remaining daily chat creation limit.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "remaining": 3,
  "used": 2
}
```

---

#### PUT `/api/chats/:chatId`
Rename a chat session.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Computer Vision Models"
}
```

---

#### DELETE `/api/chats/:chatId`
Delete a chat session and all its messages.

**Headers:**
```
Authorization: Bearer <token>
```

---

#### GET `/api/chats/:chatId/messages`
Retrieve all messages in a chat session.

**Headers:**
```
Authorization: Bearer <token>
```

---

#### POST `/api/chats/:chatId/messages`
Add a message to a chat session.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "role": "user",
  "text": "What's the best model for image classification?"
}
```

---

#### POST `/api/chat`
Send a message to the AI advisor (general chat).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "message": "Recommend a model for sentiment analysis"
}
```

**Response:**
```json
{
  "reply": "For sentiment analysis, I recommend starting with BERT-base or RoBERTa. These models..."
}
```

---

### Model Training

#### POST `/api/train-model`
Generate a PyTorch training script using AI.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fileName": "training_data.csv",
  "fileContentBase64": "base64_encoded_file_content",
  "modelName": "llama-3.1-8b",
  "taskDescription": "Train a binary classifier for spam detection",
  "framework": "pytorch",
  "hyperparameters": {
    "batch_size": 32,
    "epochs": 5,
    "learning_rate": 0.0001
  }
}
```

**Response:**
```json
{
  "message": "Kaggle Notebook script successfully generated.",
  "ai_script": "import pandas as pd\nimport torch\n...",
  "fileName": "training_data.csv",
  "taskDescription": "Train a binary classifier",
  "status": "Script Generated"
}
```

---

### Deployment

#### POST `/api/deployment/generate-code`
Generate deployment code (FastAPI app, Dockerfile, requirements.txt).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "modelIdentifier": "bert-base-uncased",
  "platform": "Hugging Face",
  "authenticatedUsername": "Ravindradoe",
  "modelSourceDetail": "Text classification model",
  "isRetry": false,
  "llamaDebugSuggestion": null
}
```

**Response:**
```json
{
  "generatedCode": "```python\nfrom fastapi import FastAPI\n...\n```\n\n```text\nfastapi\nuvicorn\n...\n```\n\n```dockerfile\nFROM python:3.9-slim\n...\n```"
}
```

---

#### POST `/api/deployment/record`
Save Docker Hub credentials.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "dockerUsername": "Ravindradoe",
  "dockerPassword": "dckr_pat_xxxxxxxxxxxxx",
  "dockerAuthToken": "simulated_jwt_token",
  "deploymentDetails": {
    "modelName": "bert-sentiment"
  }
}
```

---

#### GET `/api/deployment/docker-credentials`
Fetch saved Docker Hub credentials.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "username": "Ravindradoe",
  "patOrPassword": "dckr_pat_xxxxxxxxxxxxx"
}
```

---

#### POST `/api/deployment/execute-init`
Initialize deployment process and get session ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "modelIdentifier": "bert-sentiment",
  "dockerUsername": "Ravindradoe",
  "dockerPassword": "dckr_pat_xxxxxxxxxxxxx",
  "dockerfile": "FROM python:3.9-slim\n...",
  "pythonCode": "from fastapi import FastAPI\n...",
  "requirementsTxt": "fastapi\nuvicorn\ntransformers\ntorch",
  "selectedModel": {
    "modelName": "bert-base-uncased",
    "platform": "Hugging Face",
    "category": "NLP"
  }
}
```

**Response:**
```json
{
  "message": "Deployment process initialized.",
  "sessionId": "1728123456789abc"
}
```

---

#### GET `/api/deployment/execute-stream/:sessionId`
Stream real-time deployment logs via Server-Sent Events (SSE).

**Headers:**
```
Authorization: Bearer <token>
```

**Stream Events:**
- `log`: Build/push log messages
- `status`: Current deployment phase (preparing, authenticating, building, pushing, complete, failed)
- `end`: Deployment finished

**Example SSE Stream:**
```
event: log
data: {"message":"[AGENT] Initiating deployment...","isError":false}

event: status
data: preparing

event: log
data: {"message":"[DOCKER LOGIN] Successful login.","isError":false}

event: status
data: building

event: end
data: Deployment process finished.
```

---

## Database Schema

### User
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  company: String,
  role: String,
  experience: Enum ['Beginner', 'Intermediate', 'Expert'],
  interests: [String],
  useCases: [String],
  timestamps: true
}
```

### ChatSession
```javascript
{
  userId: ObjectId (ref: User),
  title: String (default: 'New Chat'),
  createdAt: Date,
  updatedAt: Date
}
```

### ChatMessage
```javascript
{
  chatId: ObjectId (ref: ChatSession),
  role: Enum ['user', 'assistant'],
  text: String,
  timestamp: Date
}
```

### FavoriteModel
```javascript
{
  userId: ObjectId (ref: User),
  modelName: String,
  platform: String,
  category: String,
  unique: String (compound: userId:modelName),
  timestamps: true
}
```

### TrainedModel
```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  description: String,
  gitUrl: String (required),
  hfUrl: String,
  baseModel: String,
  category: String,
  status: String (default: 'Deployed'),
  timestamps: true
}
```

### DeploymentRecord
```javascript
{
  userId: ObjectId (ref: User),
  modelName: String,
  sourcePlatform: String,
  deployedImageTag: String,
  endpointUrl: String,
  deploymentDate: Date,
  category: String,
  description: String,
  imageUrl: String,
  timestamps: true
}
```

### DockerAuth
```javascript
{
  userId: ObjectId (ref: User, unique),
  username: String,
  patOrPassword: String (select: false),
  authToken: String (select: false),
  timestamps: true
}
```

### DailyChatLimit
```javascript
{
  userId: ObjectId (ref: User, unique),
  date: String (YYYY-MM-DD),
  count: Number (default: 0),
  timestamps: true
}
```

---

## Deployment Workflow

### Phase 1: Code Generation
1. Frontend calls `/api/deployment/generate-code`
2. Backend uses Cerebras Llama to generate FastAPI app, Dockerfile, requirements.txt
3. AI returns three code blocks in strict order

### Phase 2: Authorization
1. User provides Docker Hub credentials
2. Frontend calls `/api/deployment/record` to save credentials

### Phase 3: Initialization
1. Frontend calls `/api/deployment/execute-init` with all code and credentials
2. Backend validates payload and returns `sessionId`

### Phase 4: Real-Time Streaming
1. Frontend opens SSE connection to `/api/deployment/execute-stream/:sessionId`
2. Backend executes Docker commands:
   - `docker login`
   - `docker build`
   - `docker push`
3. Logs stream in real-time to frontend
4. On success, deployment record saved to MongoDB

---

## Tech Stack

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose ODM
- JWT Authentication (jsonwebtoken)
- bcryptjs for password hashing
- Cerebras SDK for AI features
- Docker (child_process spawn)
- Server-Sent Events (SSE)

**APIs & Services:**
- Cerebras API (Llama models)
- Hugging Face API
- Replicate API
- Docker Hub

**Frontend:**
- React.js (hosted on Vercel)
- CORS enabled for cross-origin requests

---

## Contributors

Thanks to everyone who contributed to this project!  

| Member | GitHub | Avatar |
|--------|--------|--------|
| Ravindra Boss | [ravindraogg](https://github.com/ravindraogg) | <img src="https://avatars.githubusercontent.com/u/149950829?v=4" width="100" height="100"/> |
| Nitesh Panati | [PanatiNitesh](https://github.com/PanatiNitesh) | <img src="https://avatars.githubusercontent.com/u/134051960?v=4" width="100" height="100"/> |

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the maintainers.

**Powered by Meta Llama on Cerebras Hardware** 🚀
