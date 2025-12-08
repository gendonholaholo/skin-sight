import { useState } from "react";
import { motion } from "framer-motion";
import LivenessScanner from "./LivenessScanner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthScreen() {
    const [authComplete, setAuthComplete] = useState(false);

    const handleComplete = () => {
        setAuthComplete(true);
        // Logic to redirect or show dashboard would go here
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-black overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {!authComplete ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white mb-2">Verification</h1>
                            <p className="text-zinc-400">Complete the biometric scan to continue</p>
                        </div>

                        <LivenessScanner onComplete={handleComplete} />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md"
                    >
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Access Granted</h2>
                        <p className="text-zinc-400 mb-6">Redirecting to your dashboard...</p>
                        {/* Placeholder for redirection logic */}
                        <Link to="/dashboard" className="block w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                            Enter Dashboard
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
