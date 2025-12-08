import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LivenessScanner from "./LivenessScanner";
import CameraCapture from "../Shared/CameraCapture";
import { ArrowLeft, UserPlus, LogIn, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { facePlusPlusService } from "../../services/api/faceplusplus";

export default function AuthScreen() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("login"); // 'login' | 'register'
    const [step, setStep] = useState(0); // 0: Select/Start, 1: Liveness (Register only), 2: Capture, 3: Processing, 4: Result
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [autoCapture, setAutoCapture] = useState(false);

    const handleSwitchMode = (newMode) => {
        setMode(newMode);
        setStep(0);
        setError(null);
        setResult(null);
    };

    const handleLivenessSuccess = () => {
        setStep(2);
        setAutoCapture(true);
    };

    const handleCapture = async (imageSrc) => {
        setStep(3); // Processing
        setError(null);
        setAutoCapture(false); // Reset trigger

        try {
            if (mode === "register") {
                // Register Flow: Detect -> Save Token
                const data = await facePlusPlusService.detectFace(imageSrc.split(',')[1]);

                if (data.faces && data.faces.length === 1) {
                    const faceToken = data.faces[0].face_token;
                    // Mock Database Storage
                    localStorage.setItem("user_face_token", faceToken);
                    localStorage.setItem("user_face_img", imageSrc); // Optional: save image for easy debugging
                    setResult({ success: true, message: "Registration Successful!" });
                    setStep(4);
                } else {
                    throw new Error("No face detected or multiple faces found. Please try again.");
                }

            } else {
                // Login Flow: Compare with Stored Token
                const storedToken = localStorage.getItem("user_face_token");
                if (!storedToken) {
                    throw new Error("No registered user found on this device.");
                }

                // Verify Identity
                const data = await facePlusPlusService.compare(storedToken, imageSrc.split(',')[1]);

                // Threshold for match (e.g., 80%)
                if (data.confidence > 80) {
                    setResult({ success: true, message: `Welcome back! Match: ${data.confidence.toFixed(1)}%` });
                    setStep(4);
                } else {
                    throw new Error(`Identity mismatch. Confidence: ${data.confidence ? data.confidence.toFixed(1) : 0}%`);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "An unexpected error occurred");
            setStep(result ? 4 : (mode === 'register' ? 1 : 2)); // Go back to start of flow
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-black z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-pink-900/20 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[140px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Header Switcher */}
                {step === 0 && (
                    <div className="flex bg-white/5 p-1 rounded-full mb-8 backdrop-blur-md border border-white/10">
                        <button
                            onClick={() => handleSwitchMode("login")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all ${mode === "login" ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"}`}
                        >
                            <LogIn className="w-4 h-4" /> Login
                        </button>
                        <button
                            onClick={() => handleSwitchMode("register")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all ${mode === "register" ? "bg-pink-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"}`}
                        >
                            <UserPlus className="w-4 h-4" /> Register
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* START SCREEN */}
                    {step === 0 && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center"
                        >
                            <h1 className="text-4xl font-bold text-white mb-4">
                                {mode === "login" ? "Welcome Back" : "Create Account"}
                            </h1>
                            <p className="text-zinc-400 mb-8">
                                {mode === "login"
                                    ? "Scan your face to access your dashboard securely."
                                    : "We'll confirm you're real, then register your face ID."}
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStep(mode === "register" ? 1 : 2)}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${mode === "register"
                                    ? "bg-gradient-to-r from-pink-600 to-indigo-600 shadow-pink-500/25"
                                    : "bg-white text-black hover:bg-zinc-200 shadow-white/10"
                                    }`}
                            >
                                {mode === "register" ? "Start Liveness Check" : "Start Face Scan"}
                            </motion.button>

                            {mode === "login" && (
                                <p className="mt-8 text-xs text-zinc-600">
                                    Protected by local-first biometric encryption.
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* LIVENESS CHECK (Register Only) */}
                    {step === 1 && mode === "register" && (
                        <motion.div
                            key="liveness"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-white">Liveness Check</h2>
                                <p className="text-sm text-zinc-400">Prove you are human</p>
                            </div>
                            <LivenessScanner onSuccess={handleLivenessSuccess} />
                        </motion.div>
                    )}

                    {/* CAPTURE FACE */}
                    {step === 2 && (
                        <motion.div
                            key="capture"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-white">
                                    {mode === "register" ? "Capture Profile Photo" : "Verifying Identity"}
                                </h2>
                                <p className="text-sm text-zinc-400">Position your face clearly</p>
                            </div>
                            <CameraCapture onCapture={handleCapture} autoCapture={autoCapture} />
                        </motion.div>
                    )}

                    {/* PROCESSING */}
                    {step === 3 && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mb-4" />
                            <h3 className="text-xl font-bold text-white">Processing...</h3>
                            <p className="text-zinc-500">Analyzing biometric data</p>
                        </motion.div>
                    )}

                    {/* RESULT */}
                    {step === 4 && result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl"
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${result.success ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                                {result.success ? (
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                )}
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">
                                {result.success ? "Success!" : "Authentication Failed"}
                            </h2>
                            <p className="text-zinc-400 mb-8">{result.message}</p>

                            {result.success ? (
                                <button
                                    onClick={() => navigate("/dashboard")}
                                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                                >
                                    Enter Dashboard
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setStep(0);
                                        setError(null);
                                    }}
                                    className="w-full py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                                >
                                    Try Again
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && step !== 4 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
