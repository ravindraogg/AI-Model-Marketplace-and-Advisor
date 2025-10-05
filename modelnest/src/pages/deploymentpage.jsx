import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Home,
  ChevronLeft,
  Package,
  Zap,
  Heart,
  Cloud,
  Code,
  User,
  Check,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Github,
  Lock,
  Mail,
  Terminal,
  BarChart2,
  Bug,
  ExternalLink,
  Edit2,
  X,
} from "lucide-react"; // Added Edit2 and X for editing
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs, atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const colorScheme = {
  dark: {
    bgPrimary: "bg-[#050505]",
    textPrimary: "text-[#E6E6E6]",
    textSecondary: "text-[#A6A6A6]",
    cardBg: "bg-black/30 backdrop-blur-xl",
    cardSecondaryBg: "bg-black/15 backdrop-blur-lg",
    cardBorder: "border-[#00FFE0]/30",
    navBg: "bg-black/20",
  },
  light: {
    bgPrimary: "bg-[#f5f5ed]",
    textPrimary: "text-gray-900",
    textSecondary: "text-gray-600",
    cardBg: "bg-white/80 backdrop-blur-lg",
    cardSecondaryBg: "bg-gray-100/80 backdrop-blur-md",
    cardBorder: "border-gray-300",
    navBg: "bg-white/80",
  },
};

const STEPS = [
  { id: 1, name: "Select Model", icon: Package },
  { id: 2, name: "Authorize Docker Hub", icon: User },
  { id: 3, name: "Generate Code", icon: Code },
  { id: 4, name: "Build, Push & Deploy", icon: Cloud },
  { id: 5, name: "Deployment Complete", icon: Check },
];

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const extractCode = (response) => {
  const pythonMatch = response.match(/```python\n([\s\S]*?)\n```/i);
  const requirementsMatch =
    response.match(/```text\n([\s\S]*?)\n```/i) ||
    response.match(/```requirements\n([\s\S]*?)\n```/i);
  const dockerMatch = response.match(/```dockerfile\n([\s\S]*?)\n```/i);

  const defaultCode = "# Failed to generate code. Please run step 3.";

  return {
    dockerfile: dockerMatch ? dockerMatch[1].trim() : defaultCode,
    pythonCode: pythonMatch ? pythonMatch[1].trim() : defaultCode,
    requirementsTxt: requirementsMatch
      ? requirementsMatch[1].trim()
      : "# fastapi\n# uvicorn\n# transformers\n# torch\n# Pillow\n# Default requirements if AI output format fails",
  };
};

// Removed mockBuildLogs and mockSuccessLogs

// --- STANDALONE PANEL COMPONENTS ---

const DeploymentCompletePanel = ({ selectedModel, dockerUsername }) => {
  const deployedImageTag = `${dockerUsername}/${
    selectedModel?.modelName || selectedModel?.name || "model"
  }:latest`;
  const navigate = useNavigate();

  const theme = sessionStorage.getItem("theme") || "dark";
  const currentTheme = colorScheme[theme];

  useEffect(() => {
    // Clear all session storage deployment items on final step
    sessionStorage.removeItem("dockerAuthToken");
    sessionStorage.removeItem("dockerUsername");
    sessionStorage.removeItem("generatedCode");
    sessionStorage.removeItem("selectedModel");
    sessionStorage.removeItem("dockerPassword"); // NEW: Clear stored password
  }, []);

  return (
    <div
      className={`p-10 text-center ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl shadow-2xl`}
    >
      <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
      <h2
        className={`text-3xl font-extrabold ${currentTheme.textPrimary} mb-2`}
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        Deployment Successful!
      </h2>
      <p className={`text-lg ${currentTheme.textSecondary} mb-6`}>
        The Docker image was successfully built and pushed to your Docker Hub
        registry.
      </p>
      <div
        className={`p-4 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl mb-6 inline-block`}
      >
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
            navigate("/deployment", { state: { reset: true } });
          }}
          className={`px-6 py-3 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-full ${currentTheme.textPrimary} font-bold hover:border-[#00FFE0] transition-all`}
        >
          Deploy Another Model
        </button>
      </div>
    </div>
  );
};

// NEW: Moved AuthorizationPanel outside
const AuthorizationPanel = ({
  currentTheme,
  authStatus,
  setAuthStatus,
  authError,
  setAuthError,
  dockerUsername,
  setDockerUsername,
  dockerPassword,
  setDockerPassword,
  handleAuthorize,
  deploymentStatus,
  setCurrentStep,
}) => {
  // NEW: Autofill username and PAT/Password state on mount if credentials exist
  useEffect(() => {
    const fetchCredentials = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Check session storage first for immediate access
      const storedPass = sessionStorage.getItem("dockerPassword");
      const storedUser = sessionStorage.getItem("dockerUsername");

      if (storedUser && storedPass) {
        setDockerUsername(storedUser);
        setDockerPassword(storedPass);
        setAuthStatus("authorized");
        return;
      }

      // If not in session storage, fetch from backend (MongoDB)
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/deployment/docker-credentials`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();

          setDockerUsername(data.username);
          if (data.patOrPassword) {
            // Load PAT/Password into state for display and persistence update
            setDockerPassword(data.patOrPassword);
            setAuthStatus("authorized");

            // NEW: Persist fetched PAT to session storage immediately
            sessionStorage.setItem("dockerPassword", data.patOrPassword);
          } else {
            setAuthStatus("pending"); // User has username but no saved PAT
          }
          sessionStorage.setItem("dockerUsername", data.username);
          sessionStorage.setItem("authStatus", "authorized");
        }
      } catch (error) {
        console.error("Failed to fetch Docker credentials:", error);
      }
    };

    // Only try to fetch if we don't have a username yet and we're on the auth step.
    if (!dockerUsername) {
      fetchCredentials();
    }
  }, [setDockerUsername, setAuthStatus, dockerUsername, setDockerPassword]); // Added setDockerPassword to dependency array

  const handleEditCredentials = () => {
    setAuthStatus("pending");
    setDockerUsername("");
    setDockerPassword("");
    setAuthError(null);
    sessionStorage.removeItem("dockerPassword"); // Clear sensitive info on edit
  };

  return (
    <div
      className={`p-8 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
          Docker Hub Authentication
        </h3>
        {authStatus === "authorized" && (
          <button
            onClick={handleEditCredentials}
            className={`p-2 rounded-full ${currentTheme.cardBg} border ${currentTheme.cardBorder} hover:border-[#1E90FF] transition-colors`}
          >
            <Edit2 className={`w-5 h-5 ${currentTheme.textSecondary}`} />
          </button>
        )}
      </div>
      {/* FIX 1: Changed parent <p> to <div> to avoid nested <p> error from ReactMarkdown */}
      <div className={`text-sm ${currentTheme.textSecondary} mb-6`}>
        <ReactMarkdown>
          {`Enter your **Docker Hub Username** and a **Personal Access Token (PAT)** or password to obtain a JWT write token. This token is required by the agent to authenticate and push the final image to your private registry (e.g., \`docker.io/${
            dockerUsername || "your_username"
          }\`).`}
        </ReactMarkdown>
      </div>

      <div
        className={`space-y-4 mb-6 ${
          authStatus === "authorized" ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="relative">
          <User
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`}
          />
          <input
            type="text"
            value={dockerUsername}
            onChange={(e) => {
              setDockerUsername(e.target.value);
              setAuthStatus("pending");
              setAuthError(null);
            }}
            placeholder="Docker Hub Username (e.g., ravindraog)"
            className={`w-full ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl px-4 pl-12 py-3 ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#00FFE0] transition-all duration-300`}
          />
        </div>

        <div className="relative">
          <Lock
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`}
          />
          <input
            type="password"
            value={dockerPassword}
            onChange={(e) => {
              setDockerPassword(e.target.value);
              setAuthStatus("pending");
              setAuthError(null);
            }}
            // Display a placeholder if state is empty, or "Token loaded" if it's filled from backend
            placeholder={
              authStatus === "authorized" && dockerPassword.length > 0
                ? "Stored PAT/Password Loaded"
                : "Personal Access Token (PAT) or Password"
            }
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
            {authStatus === "authorized" ? (
              <Check className="w-6 h-6 text-green-400" />
            ) : (
              <Mail className="w-6 h-6 text-[#1E90FF]" />
            )}
            <span
              className={`font-semibold ${
                authStatus === "authorized"
                  ? "text-green-400"
                  : currentTheme.textPrimary
              }`}
            >
              {authStatus === "authorized"
                ? "Authorization Successful."
                : "Awaiting Credentials"}
            </span>
          </div>
          <button
            onClick={handleAuthorize}
            disabled={
              authStatus === "authorized" ||
              deploymentStatus !== "idle" ||
              dockerUsername.length === 0 ||
              dockerPassword.length === 0
            }
            className="px-6 py-2 bg-gradient-to-r from-[#1E90FF] to-[#00FFE0] rounded-full text-black text-sm font-bold hover:scale-105 transition-all disabled:opacity-50"
          >
            {deploymentStatus === "deploying" ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AUTHENTICATING...</span>
              </span>
            ) : (
              <span>Get Deployment Token</span>
            )}
          </button>
        </div>
      </div>

      {authStatus === "authorized" && (
        <button
          onClick={() => setCurrentStep(3)}
          className="w-full py-3 mt-4 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-xl text-black font-extrabold hover:scale-[1.01] transition-all"
        >
          CONTINUE TO CODE GENERATION (STEP 3) &rarr;
        </button>
      )}

      <div
        className={`mt-8 p-4 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl`}
      >
        <h4 className="flex items-center space-x-2 font-bold text-sm text-[#00FFE0] mb-2">
          <Github className="w-4 h-4" />
          <span>How to create a Docker PAT</span>
        </h4>

        <ol
          className={`list-decimal list-inside text-sm ${currentTheme.textSecondary} space-y-1`}
        >
          <li>
  Go to the Docker Hub Settings page:{" "}
  <a
    href="https://app.docker.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="text-[#1E90FF] hover:text-[#00FFE0] transition-colors"
  >
    Generate PAT
  </a>
</li>

          <li>Click "New Access Token".</li>
          <li>
            Set the "Token Description" (e.g., "for ModelNest Deployment").
          </li>
          <li>
            Under "Access Permissions", ensure you grant "Read, Write, and
            Delete" permissions.
          </li>
          <li>Click "Generate".</li>
          <li>
            **Copy the generated PAT** and paste it into the password field
            above. **(It is shown only once!)**
          </li>
        </ol>
      </div>

      <button
        onClick={() => setCurrentStep(1)}
        className={`text-sm text-[#9B59B6] hover:text-[#00FFE0] transition-colors mt-4`}
      >
        &larr; Change Selected Model
      </button>
    </div>
  );
};

const ModelSelectPanel = ({
  models,
  selectedModel,
  setSelectedModel,
  setCurrentStep,
  currentTheme,
}) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {models.length > 0 ? (
      models.map((model, index) => {
        const modelName = model.modelName || model.name;
        return (
          <button
            key={index}
            onClick={() => {
              setSelectedModel(model);
              sessionStorage.setItem("selectedModel", JSON.stringify(model)); // PERSIST Model
              setCurrentStep(2);
            }}
            className={`p-5 rounded-2xl text-left border-2 transition-all duration-300 ${
              selectedModel?.modelName === modelName
                ? "border-[#00FFE0] bg-[#00FFE0]/20 shadow-[0_0_20px_rgba(0,255,224,0.5)]"
                : `${currentTheme.cardSecondaryBg} ${currentTheme.cardBorder} hover:border-[#1E90FF]/60 hover:scale-[1.02]`
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <Zap
                className={`w-5 h-5 ${
                  selectedModel?.modelName === modelName
                    ? "text-[#00FFE0]"
                    : currentTheme.textPrimary
                }`}
              />
              <h3
                className={`font-bold text-lg ${currentTheme.textPrimary} truncate`}
              >
                {modelName}
              </h3>
            </div>
            <p className={`text-xs ${currentTheme.textSecondary}`}>
              {model.description?.substring(0, 80)}...
            </p>
            <div className="mt-3 flex space-x-3">
              <span
                className={`text-xs px-3 py-1 rounded-full border ${
                  model.isTrained
                    ? "border-[#9B59B6] text-[#9B59B6]"
                    : "border-[#1E90FF] text-[#1E90FF]"
                }`}
              >
                {model.source}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full border ${currentTheme.cardBorder} ${currentTheme.textSecondary}`}
              >
                {model.category || "N/A"}
              </span>
            </div>
          </button>
        );
      })
    ) : (
      <p
        className={`${currentTheme.textSecondary} md:col-span-3 text-center p-8`}
      >
        No saved or trained models found. Please save a model from the
        Marketplace or log a Trained Model.
      </p>
    )}
  </div>
);

const CodeGenerationPanel = ({
  currentTheme,
  selectedModel,
  dockerUsername,
  deploymentStatus,
  handleGenerateCode,
  llamaDebugSuggestion,
  retryCount,
  MAX_AUTO_RETRIES,
}) => (
  <div className="space-y-6">
    <div
      className={`p-8 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl`}
    >
      <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>
        Model Details
      </h3>
      <p className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
        {selectedModel.modelName || selectedModel.name}
      </p>
      <p className={`text-sm ${currentTheme.textSecondary}`}>
        {selectedModel.platform || "Custom Model"}
      </p>
      <p className={`text-xs mt-2 ${currentTheme.textSecondary}`}>
        {selectedModel.description || "No description available."}
      </p>
    </div>

    <div
      className={`p-8 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-xl`}
    >
      <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>
        Generate Deployment Code (AI Agent)
      </h3>
      <p className={`text-sm ${currentTheme.textSecondary} mb-6`}>
        The AI Agent generates a **FastAPI Python server**, an optimized
        **Dockerfile**, and the **requirements.txt** tagged for your registry:
        **`{dockerUsername}/{selectedModel.modelName || selectedModel.name}
        :latest`**.
      </p>
      {llamaDebugSuggestion && (
        <div className="p-3 mb-4 bg-yellow-800/20 text-yellow-400 border border-yellow-500 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Ready to retry with AI-suggested fix (Attempt {retryCount}/
            {MAX_AUTO_RETRIES}).
          </span>
        </div>
      )}
      <button
        onClick={() => handleGenerateCode(false)}
        disabled={deploymentStatus !== "idle"}
        className="w-full py-3 bg-gradient-to-r from-[#9B59B6] to-[#1E90FF] rounded-xl text-black font-extrabold hover:scale-[1.01] transition-all disabled:opacity-50"
      >
        {deploymentStatus === "generating" ? (
          <span className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>GENERATING CODE...</span>
          </span>
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

const DeploymentReviewPanel = ({
  currentTheme,
  deploymentStatus,
  deploymentLogs,
  retryCount,
  MAX_AUTO_RETRIES,
  llamaDebugSuggestion,
  handleE2EDeployment,
  handleRetryWithFix,
  generatedCode,
  setCurrentStep,
}) => (
  <div className="space-y-6">
    <div
      className={`p-8 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl`}
    >
      <h2
        className={`text-2xl font-bold ${currentTheme.textPrimary} mb-4`}
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        Deployment Review & E2E Flow
      </h2>

      <div
        className={`p-4 mb-6 rounded-xl border-2 ${
          deploymentStatus === "authenticating" ||
          deploymentStatus === "building" ||
          deploymentStatus === "pushing" ||
          deploymentStatus === "deploying" ||
          deploymentStatus === "debugging"
            ? "border-yellow-500 bg-yellow-500/10"
            : deploymentStatus === "failed"
            ? "border-red-500 bg-red-500/10"
            : "border-gray-500/30"
        }`}
      >
        <div className="flex items-center space-x-2 font-bold mb-2">
          {deploymentStatus === "authenticating" && (
            <User className="w-4 h-4 animate-pulse text-yellow-500" />
          )}
          {deploymentStatus === "building" && (
            <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
          )}
          {deploymentStatus === "pushing" && (
            <Cloud className="w-4 h-4 animate-pulse text-yellow-500" />
          )}
          {deploymentStatus === "deploying" && (
            <BarChart2 className="w-4 h-4 animate-bounce text-yellow-500" />
          )}
          {deploymentStatus === "debugging" && (
            <Bug className="w-4 h-4 text-orange-500 animate-pulse" />
          )}
          {deploymentStatus === "failed" && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          {deploymentStatus === "complete" && (
            <Check className="w-4 h-4 text-green-400" />
          )}

          <span
            className={
              deploymentStatus === "failed"
                ? "text-red-500"
                : deploymentStatus === "complete"
                ? "text-green-400"
                : "text-yellow-500"
            }
          >
            {deploymentStatus.toUpperCase()}
            {deploymentStatus !== "idle" && deploymentStatus !== "complete"
              ? "..."
              : ""}
          </span>
        </div>
        {retryCount > 0 && deploymentStatus !== "complete" && (
          <p className={`text-xs ${currentTheme.textSecondary} mb-2`}>
            **Auto-retry initiated:** Attempt **{retryCount}/{MAX_AUTO_RETRIES}
            ** with AI fix.
          </p>
        )}
        <div
          className={`h-40 overflow-y-auto font-mono text-xs p-2 ${currentTheme.cardSecondaryBg} rounded-lg border ${currentTheme.cardBorder} scrollbar-thin`}
        >
          {deploymentLogs.map((log, index) => (
            <div
              key={index}
              className={
                log.isError ? "text-red-400" : currentTheme.textSecondary
              }
            >
              {log.message}
            </div>
          ))}
          {deploymentLogs.length === 0 && (
            <span className={currentTheme.textSecondary}>
              Awaiting deployment initiation...
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3
            className={`font-semibold text-lg ${currentTheme.textPrimary} flex items-center space-x-2 mb-2`}
          >
            <Code className="w-5 h-5 text-[#00FFE0]" />
            <span>Dockerfile</span>
          </h3>
          <div
            className={`p-4 ${currentTheme.cardSecondaryBg} rounded-xl overflow-x-auto border ${currentTheme.cardBorder}`}
          >
            <pre className={`text-sm ${currentTheme.textSecondary}`}>
              {generatedCode.dockerfile}
            </pre>
            <button
              onClick={() =>
                downloadFile(
                  generatedCode.dockerfile,
                  "Dockerfile",
                  "text/plain"
                )
              }
              className="mt-2 w-full py-1.5 bg-gradient-to-r from-[#00FFE0]/20 to-[#1E90FF]/20 rounded-lg text-xs font-bold text-[#00FFE0] hover:bg-opacity-80 transition-all"
            >
              Download
            </button>
          </div>
        </div>
        <div>
          <h3
            className={`font-semibold text-lg ${currentTheme.textPrimary} flex items-center space-x-2 mb-2`}
          >
            <Terminal className="w-5 h-5 text-[#1E90FF]" />
            <span>Python API (`app.py`)</span>
          </h3>
          <div
            className={`p-4 ${currentTheme.cardSecondaryBg} rounded-xl overflow-x-auto border ${currentTheme.cardBorder}`}
          >
            <pre className={`text-sm ${currentTheme.textSecondary}`}>
              {generatedCode.pythonCode}
            </pre>
            <button
              onClick={() =>
                downloadFile(generatedCode.pythonCode, "app.py", "text/python")
              }
              className="mt-2 w-full py-1.5 bg-gradient-to-r from-[#00FFE0]/20 to-[#1E90FF]/20 rounded-lg text-xs font-bold text-[#1E90FF] hover:bg-opacity-80 transition-all"
            >
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 text-center">
        <button
          onClick={() =>
            downloadFile(
              generatedCode.requirementsTxt,
              "requirements.txt",
              "text/plain"
            )
          }
          className={`text-xs px-3 py-1 ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} rounded-full ${currentTheme.textSecondary} hover:text-[#00FFE0] transition-colors`}
        >
          Download requirements.txt (Hidden File)
        </button>
      </div>

      {deploymentStatus === "failed" && llamaDebugSuggestion && (
        <div className="mt-8 p-6 bg-red-800/20 border border-red-500 rounded-xl">
          <h3 className="flex items-center space-x-2 font-bold text-lg text-red-400 mb-3">
            <Bug className="w-5 h-5" />
            <span>AI Debugging Suggestion (Manual Intervention Required)</span>
          </h3>
          {retryCount >= MAX_AUTO_RETRIES && (
            <p className="text-sm font-semibold text-red-300 mb-2">
              Auto-retry limit ({MAX_AUTO_RETRIES}) reached. Please review the
              fix and apply manually.
            </p>
          )}
          <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
            {llamaDebugSuggestion.fixSuggestion}
          </p>
          <button
            onClick={handleRetryWithFix}
            disabled={deploymentStatus === "debugging"}
            className="w-full py-3 bg-green-600 rounded-xl text-white font-extrabold hover:bg-green-700 transition-all disabled:opacity-50"
          >
            {deploymentStatus === "debugging"
              ? "AI Analyzing..."
              : "APPLY FIX & RETRY BUILD (Step 3)"}
          </button>
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={handleE2EDeployment}
          disabled={deploymentStatus !== "idle"}
          className="w-full py-3 bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] rounded-xl text-black font-extrabold hover:scale-[1.01] transition-all disabled:opacity-50"
        >
          {deploymentStatus === "idle" ? (
            <span>INITIATE BUILD, PUSH & DEPLOY</span>
          ) : deploymentStatus === "failed" ? (
            <span>BUILD FAILED - REVIEW LOGS ABOVE</span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{deploymentStatus.toUpperCase()}...</span>
            </span>
          )}
        </button>
      </div>

      <button
        onClick={() => setCurrentStep(3)}
        className={`text-sm text-[#9B59B6] hover:text-[#00FFE0] transition-colors px-2`}
      >
        &larr; Go Back to Generate Code
      </button>
    </div>
  </div>
);

// --- Main Component ---
export default function DeploymentPage({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState(null);
  const [authStatus, setAuthStatus] = useState("pending");
  const [dockerUsername, setDockerUsername] = useState("");
  const [dockerPassword, setDockerPassword] = useState(""); // Holds temporary input, cleared on success
  const [authError, setAuthError] = useState(null);
  const [generatedCode, setGeneratedCode] = useState({
    dockerfile: "",
    pythonCode: "",
    requirementsTxt: "",
  });

  const [deploymentStatus, setDeploymentStatus] = useState("idle");
  const [deploymentLogs, setDeploymentLogs] = useState([]);
  const [llamaDebugSuggestion, setLlamaDebugSuggestion] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [eventSource, setEventSource] = useState(null);
  const MAX_AUTO_RETRIES = 5;

  const currentTheme = colorScheme[theme || "dark"];
  const isDark = theme === "dark";

  const renderAvatarInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const storedProfile = sessionStorage.getItem("userProfile");
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("User not authenticated.");

      const [favResponse, trainedResponse, deployedResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/models/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/models/trained`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/models/deployed`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const favorites = favResponse.ok ? await favResponse.json() : [];
      const trained = trainedResponse.ok ? await trainedResponse.json() : [];
      const deployed = deployedResponse.ok ? await deployedResponse.json() : [];

      const mappedFavorites = favorites.map((fav) => ({
        ...fav,
        isFavorite: true,
        source: fav.platform || "Marketplace",
        description:
          fav.description ||
          `Favorited model from the ${
            fav.platform || "Marketplace"
          } ecosystem.`,
      }));

      const combinedModels = [
        ...trained.map((t) => ({ ...t, source: "Trained", isTrained: true })),
        ...mappedFavorites,
        ...deployed,
      ];
      const uniqueModels = Array.from(
        new Map(
          combinedModels
            .map((item) => item.modelName || item.name)
            .filter(Boolean)
            .map((item) => [
              item,
              combinedModels.find((m) => (m.modelName || m.name) === item),
            ])
        ).values()
      );

      setModels(uniqueModels);
    } catch (error) {
      console.error("Error fetching deployment data:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuthorize = async () => {
    setAuthError(null);
    if (dockerUsername.length < 3 || dockerPassword.length < 8) {
      setAuthError(
        "Please provide a valid Docker Hub Username and Password/Token (min 8 characters)."
      );
      setAuthStatus("failed");
      return;
    }

    setDeploymentStatus("deploying");
    setAuthStatus("pending");

    try {
      const token = localStorage.getItem("authToken");
      // This endpoint saves the Docker credentials (username and PAT/password) to MongoDB.
      const response = await fetch(`${API_BASE_URL}/api/deployment/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dockerUsername,
          dockerPassword, // The PAT/Password is passed to the backend for storage
          dockerAuthToken: "SIMULATED_JWT_TOKEN",
          deploymentDetails: {
            modelName: "dummy",
            sourcePlatform: "Docker Auth",
            deployedImageTag: "dummy/image:latest",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to authorize with backend."
        );
      }

      const receivedToken = "DOCKER_HUB_JWT_TOKEN_RECEIVED";

      // PERSIST USERNAME, PAT, and AUTH STATUS in session storage
      sessionStorage.setItem("dockerAuthToken", receivedToken);
      sessionStorage.setItem("dockerUsername", dockerUsername);
      sessionStorage.setItem("dockerPassword", dockerPassword); // NEW: Persist PAT/Password as requested
      sessionStorage.setItem("authStatus", "authorized");

      setAuthStatus("authorized");
      setDeploymentStatus("idle");
      setAuthError(null);

      // Note: We keep dockerPassword in state now since we're using it for persistence and display autofill
      // setDockerPassword('');
    } catch (error) {
      setAuthStatus("failed");
      setDeploymentStatus("idle");
      setAuthError(
        error.message ||
          "A network error occurred while reaching the Docker Hub proxy."
      );
    }
  };

  const handleGenerateCode = useCallback(
    async (isRetry = false) => {
      if (!selectedModel) return;

      setDeploymentStatus("generating");
      const token = localStorage.getItem("authToken");

      const modelIdentifier = selectedModel.modelName || selectedModel.name;
      const platform = selectedModel.platform || "Custom/Hugging Face";
      const authenticatedUsername =
        sessionStorage.getItem("dockerUsername") || dockerUsername;

      let modelSourceDetail = "";
      if (selectedModel.isTrained) {
        if (selectedModel.gitUrl) {
          modelSourceDetail += `\n- The source code is available at the GitHub URL: ${selectedModel.gitUrl}. The Dockerfile MUST use 'git clone' to fetch this repository.`;
        } else if (selectedModel.hfUrl) {
          modelSourceDetail += `\n- The source model repository is available at the Hugging Face URL: ${selectedModel.hfUrl}.`;
        }
      }

      // Pass debugging details only if it's a retry attempt
      const debugSuggestion =
        isRetry && llamaDebugSuggestion ? llamaDebugSuggestion : null;

      const payload = {
        modelIdentifier,
        platform,
        authenticatedUsername,
        modelSourceDetail,
        isRetry,
        llamaDebugSuggestion: debugSuggestion,
      };

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/deployment/generate-code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok)
          throw new Error("AI service failed to generate code.");

        const result = await response.json();
        const aiText = result.generatedCode || "Error: No reply received.";

        const extracted = extractCode(aiText);
        setGeneratedCode(extracted);

        // NEW: Persist generated code to session storage
        sessionStorage.setItem("generatedCode", JSON.stringify(extracted));

        setLlamaDebugSuggestion(null);
        setCurrentStep(4);
      } catch (error) {
        console.error("Error fetching AI code:", error);
        setDeploymentStatus("failed");
      } finally {
        setDeploymentStatus("idle");
      }
    },
    [selectedModel, dockerUsername, llamaDebugSuggestion]
  );

  const handleE2EDeployment = async () => {
    // --- Pre-flight Checks ---
    const authenticatedUsername = sessionStorage.getItem("dockerUsername");
    const patOrPassword = sessionStorage.getItem("dockerPassword"); // NEW: Fetch directly from session storage
    const token = localStorage.getItem("authToken");

    // Use locally stored code if state is empty (e.g., after reload/re-render)
    let currentGeneratedCode = generatedCode;
    if (
      !currentGeneratedCode ||
      !currentGeneratedCode.dockerfile ||
      currentGeneratedCode.dockerfile.startsWith("# Failed")
    ) {
      const storedCode = sessionStorage.getItem("generatedCode");
      if (storedCode) {
        currentGeneratedCode = JSON.parse(storedCode);
        setGeneratedCode(currentGeneratedCode);
      }
    }

    if (
      !authenticatedUsername ||
      !patOrPassword ||
      !token ||
      !currentGeneratedCode.dockerfile ||
      currentGeneratedCode.dockerfile.startsWith("# Failed")
    ) {
      setDeploymentLogs([
        {
          message:
            "[FATAL] Missing credentials or generated code. Please complete previous steps.",
          isError: true,
        },
      ]);
      setDeploymentStatus("failed");
      return;
    }
    if (eventSource) {
      eventSource.close();
    }

    // Use locally stored model if state is empty (e.g., after reload/re-render)
    let currentSelectedModel = selectedModel;
    if (!currentSelectedModel) {
      const storedModel = sessionStorage.getItem("selectedModel");
      if (storedModel) {
        currentSelectedModel = JSON.parse(storedModel);
        setSelectedModel(currentSelectedModel);
      }
    }
    if (!currentSelectedModel) {
      setDeploymentLogs([
        { message: "[FATAL] Missing selected model details.", isError: true },
      ]);
      setDeploymentStatus("failed");
      return;
    }

    // --- REMOVED: Fetching PAT from backend is no longer needed ---
    // We now rely on session storage for the PAT, as requested.
    // ---------------------------------------------

    // --- 1. Initiate Deployment Process (POST) ---
    setDeploymentLogs((prev) => [
      ...prev,
      {
        message: "[INIT] Posting deployment files and credentials to agent...",
        isError: false,
      },
    ]);
    setDeploymentStatus("initiating");

    try {
      // POST request to send all code and credentials for the backend to start the stream process
      const initiationResponse = await fetch(
        `${API_BASE_URL}/api/deployment/execute-init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            modelIdentifier:
              currentSelectedModel.modelName || currentSelectedModel.name,
            dockerUsername: authenticatedUsername,
            dockerPassword: patOrPassword, // <-- Now using the session-stored PAT/Password
            dockerfile: currentGeneratedCode.dockerfile,
            pythonCode: currentGeneratedCode.pythonCode,
            requirementsTxt: currentGeneratedCode.requirementsTxt,
            selectedModel: currentSelectedModel,
          }),
        }
      );

      if (!initiationResponse.ok) {
        const errorData = await initiationResponse.json();
        throw new Error(
          errorData.message ||
            `Failed to initialize deployment: ${initiationResponse.status}`
        );
      }

      const initResult = await initiationResponse.json();
      const sessionId = initResult.sessionId;

      // --- FIX START: Pass JWT token via query param for SSE authorization ---
      const sseUrl = `${API_BASE_URL}/api/deployment/execute-stream/${sessionId}?token=${token}`;
      // --- FIX END ---

      setDeploymentLogs((prev) => [
        ...prev,
        {
          message: `[AGENT] Deployment accepted. Session ID: ${sessionId}. Establishing real-time log stream...`,
          isError: false,
        },
      ]);
      setDeploymentStatus("authenticating"); // Move status forward based on assumed success of initiation

      // --- 2. Establish Real-time Log Stream (GET SSE) ---
      // const es = new EventSource(`${API_BASE_URL}/api/deployment/execute-stream/${sessionId}`); // Old URL
      const es = new EventSource(sseUrl); // New URL with token

      es.onopen = () => {
        setDeploymentLogs((prev) => [
          ...prev,
          {
            message: "[STREAM] Connection established with deployment agent.",
            isError: false,
          },
        ]);
      };

      es.onerror = (err) => {
        console.error("SSE Error:", err);
        // Only mark as failed if it's not already complete/failed
        setDeploymentStatus((prev) =>
          prev === "complete" ? "complete" : "failed"
        );
        setDeploymentLogs((prev) => [
          ...prev,
          {
            message:
              "[STREAM] Connection error. Check server logs for details.",
            isError: true,
          },
        ]);
        es.close();
        setEventSource(null);
      };

      es.addEventListener("log", (event) => {
        const data = JSON.parse(event.data);
        setDeploymentLogs((prev) => [
          ...prev,
          { message: data.message, isError: data.isError },
        ]);
        // Scroll to bottom of log window when a new log arrives (simulated, needs actual log container access for real world)
        const logWindow = document.querySelector(".h-40.overflow-y-auto");
        if (logWindow) {
          logWindow.scrollTop = logWindow.scrollHeight;
        }
      });

      es.addEventListener("status", (event) => {
        const newStatus = event.data.toLowerCase();
        setDeploymentStatus(newStatus);
      });

      es.addEventListener("end", () => {
        setDeploymentLogs((prev) => [
          ...prev,
          {
            message: "[STREAM] Deployment stream closed by server.",
            isError: false,
          },
        ]);
        es.close();
        setEventSource(null);

        // Final state determination (mostly handled by the 'status' event)
        setDeploymentStatus((prev) => {
          if (prev !== "complete" && prev !== "failed") {
            return "failed"; // Assume failure if stream closes unexpectedly before final status
          }
          return prev;
        });
      });

      setEventSource(es);
    } catch (error) {
      setDeploymentLogs((prev) => [
        ...prev,
        {
          message: `[FATAL] Deployment initiation failed: ${error.message}`,
          isError: true,
        },
      ]);
      setDeploymentStatus("failed");
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    }
  };

  // NOTE: handleLlamaDebugging is kept as a mock for the retry logic
  const handleLlamaDebugging = async (modelTag, logs, autoRetry = false) => {
    setDeploymentStatus("debugging");

    const failureSummary = logs
      .filter((log) => log.includes("ERROR") || log.includes("Could not find"))
      .join("\n");

    const debugPrompt = `The Docker build for model "${modelTag}" failed. Analyze the following logs and provide a concise, single-paragraph suggested fix for the Dockerfile and requirements.txt. The error is a missing dependency 'missing_dep'. Suggest adding the actual model name dependency, e.g., 'transformers==4.30.0', as the fix.
        
        FAILURE LOGS:\n${failureSummary}`;

    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: debugPrompt }),
      });

      if (!response.ok) throw new Error("AI debugging service failed.");

      const result = await response.json();
      const fixSuggestion =
        result.reply ||
        "The AI identified the missing dependency 'missing_dep'. The fix is to add a proper model dependency (e.g., 'transformers' or 'tensorflow') to the requirements.txt and regenerate the Dockerfile to ensure correct model asset inclusion.";

      setLlamaDebugSuggestion({
        logs: failureSummary,
        fixSuggestion: fixSuggestion,
      });

      if (autoRetry && retryCount < MAX_AUTO_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setDeploymentLogs((prev) => [
          ...prev,
          {
            message: `[AUTO-DEBUG] Attempt ${
              retryCount + 1
            }: AI generated fix. Regenerating code...`,
            isError: false,
          },
        ]);

        await handleGenerateCode(true);

        setDeploymentStatus("idle");
        setTimeout(handleE2EDeployment, 500);
      } else {
        setDeploymentStatus("failed");
      }
    } catch (error) {
      console.error("Llama Debugging Error:", error);
      setLlamaDebugSuggestion({
        logs: failureSummary,
        fixSuggestion: "Failed to connect to debugging agent.",
      });
      setDeploymentStatus("failed");
    }
  };

  const handleRetryWithFix = () => {
    setDeploymentLogs([]);
    setDeploymentStatus("idle");
    setRetryCount(0);

    handleGenerateCode(true);
  };

  useEffect(() => {
    fetchUserData();

    // NEW: Load persisted data from session storage on mount
    const storedCode = sessionStorage.getItem("generatedCode");
    if (storedCode) {
      setGeneratedCode(JSON.parse(storedCode));
    } else {
      setGeneratedCode({ dockerfile: "", pythonCode: "", requirementsTxt: "" });
    }

    const storedModel = sessionStorage.getItem("selectedModel");
    if (storedModel) {
      setSelectedModel(JSON.parse(storedModel));
    }

    // Load auth status, username, and PAT/Password from session storage
    const storedAuthStatus = sessionStorage.getItem("authStatus");
    const storedUsername = sessionStorage.getItem("dockerUsername");
    const storedPassword = sessionStorage.getItem("dockerPassword"); // NEW: Load stored password

    setDeploymentStatus("idle");

    if (storedAuthStatus === "authorized" && storedUsername) {
      setAuthStatus("authorized");
      setDockerUsername(storedUsername);
      // NEW: Set password state if found
      if (storedPassword) {
        setDockerPassword(storedPassword);
      }
    } else {
      setAuthStatus("pending");
    }

    // Cleanup EventSource on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    };
  }, [fetchUserData]);

  // NEW useEffect: Automatically move to step 5 on completion
  useEffect(() => {
    if (deploymentStatus === "complete") {
      setCurrentStep(5);
    }
  }, [deploymentStatus]);

  const renderStepContent = () => {
    if (!selectedModel)
      return (
        <ModelSelectPanel
          {...{
            models,
            selectedModel,
            setSelectedModel,
            setCurrentStep,
            currentTheme,
          }}
        />
      );

    if (currentStep >= 2 && authStatus !== "authorized")
      return (
        <AuthorizationPanel
          {...{
            currentTheme,
            authStatus,
            setAuthStatus,
            authError,
            setAuthError,
            dockerUsername,
            setDockerUsername,
            dockerPassword,
            setDockerPassword,
            handleAuthorize,
            deploymentStatus,
            setCurrentStep,
          }}
        />
      );

    switch (currentStep) {
      case 1:
        return (
          <ModelSelectPanel
            {...{
              models,
              selectedModel,
              setSelectedModel,
              setCurrentStep,
              currentTheme,
            }}
          />
        );
      case 2:
        return (
          <AuthorizationPanel
            {...{
              currentTheme,
              authStatus,
              setAuthStatus,
              authError,
              setAuthError,
              dockerUsername,
              setDockerUsername,
              dockerPassword,
              setDockerPassword,
              handleAuthorize,
              deploymentStatus,
              setCurrentStep,
            }}
          />
        );
      case 3:
        return (
          <CodeGenerationPanel
            {...{
              currentTheme,
              selectedModel,
              dockerUsername,
              deploymentStatus,
              handleGenerateCode,
              llamaDebugSuggestion,
              retryCount,
              MAX_AUTO_RETRIES,
            }}
          />
        );
      case 4:
        return (
          <DeploymentReviewPanel
            {...{
              currentTheme,
              deploymentStatus,
              deploymentLogs,
              retryCount,
              MAX_AUTO_RETRIES,
              llamaDebugSuggestion,
              handleE2EDeployment,
              handleRetryWithFix,
              generatedCode,
              setCurrentStep,
            }}
          />
        );
      case 5:
        return (
          <DeploymentCompletePanel
            selectedModel={selectedModel}
            dockerUsername={dockerUsername}
          />
        );
      default:
        return (
          <ModelSelectPanel
            {...{
              models,
              selectedModel,
              setSelectedModel,
              setCurrentStep,
              currentTheme,
            }}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-screen ${currentTheme.bgPrimary} ${currentTheme.textPrimary} relative overflow-hidden font-sans pt-20`}
    >
      <nav
        className={`fixed top-0 left-0 right-0 z-50 ${currentTheme.cardBg} border-b ${currentTheme.cardBorder} transition-colors duration-500`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/mainpage"
                className={`p-2 rounded-full ${currentTheme.cardSecondaryBg} border ${currentTheme.cardBorder} hover:border-[#00FFE0] transition-colors`}
                aria-label="Go Back to Home"
              >
                <ChevronLeft
                  className={`w-6 h-6 ${currentTheme.textPrimary}`}
                />
              </Link>
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                <span className="text-[#00FFE0]">Model</span>
                <span className={currentTheme.textPrimary}>Nest / </span>
                <span className="text-[#1E90FF]">Deployments</span>
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDark
                    ? "bg-black/30 hover:bg-black/50 text-[#00FFE0]"
                    : "bg-white/30 hover:bg-white/50 text-[#1E90FF]"
                }`}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <div
                className={`w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#9B59B6] rounded-full flex items-center justify-center text-white font-bold text-lg border-2 ${currentTheme.cardBorder}`}
              >
                {renderAvatarInitial(profile?.name || "User")}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: isDark
              ? "linear-gradient(rgba(0,255,224,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,224,0.04) 1px,transparent 1px)"
              : "linear-gradient(rgba(30,144,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(30,144,255,0.08) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <h1
          className={`text-4xl font-extrabold mb-8 ${currentTheme.textPrimary}`}
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          <span className="text-[#1E90FF]">AI Deployment </span>
          <span className="text-[#00FFE0]">Agent</span>
        </h1>

        <div
          className={`mb-10 p-6 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-3xl`}
        >
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-600/50 -translate-y-1/2 mx-10">
              <div
                className={`h-full bg-gradient-to-r from-[#00FFE0] to-[#1E90FF] transition-all duration-500`}
                style={{
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                }}
              ></div>
            </div>

            {STEPS.map((step) => (
              <div
                key={step.id}
                className="z-10 flex flex-col items-center cursor-pointer"
                onClick={() => {
                  if (step.id <= currentStep) {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    currentStep >= step.id
                      ? "bg-gradient-to-br from-[#00FFE0] to-[#1E90FF] border-transparent text-black shadow-lg shadow-[#00FFE0]/50"
                      : `${currentTheme.cardSecondaryBg} border-gray-500 ${currentTheme.textSecondary}`
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span
                  className={`mt-2 text-xs font-semibold text-center hidden sm:block ${
                    currentTheme.textSecondary
                  } ${currentStep >= step.id ? "text-[#00FFE0]" : ""}`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">{renderStepContent()}</div>
      </div>

      <style jsx="true">{`
                @import url('[https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap](https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap)');
                
                .font-sans {
                    font-family: 'Inter', sans-serif';
                }
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: ${currentTheme.scrollbarThumb || "#00FFE0"};
                    border-radius: 3px;
                }
            `}</style>
    </div>
  );
}
