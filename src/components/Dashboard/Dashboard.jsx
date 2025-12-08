import { useState } from "react";
import CameraCapture from "../Shared/CameraCapture";
import MetricCard from "./MetricCard";
import Navbar from "../Shared/Navbar";
import { facePlusPlusService } from "../../services/api/faceplusplus";
import { youCamService } from "../../services/api/youcam";
import { Activity, Droplets, Sun, User, ScanFace, Plus, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const VIEWS = {
    HISTORY: "history",
    CAPTURING: "capturing",
    ANALYZING: "analyzing",
    RESULTS: "results",
};

export default function Dashboard() {
    const [view, setView] = useState(VIEWS.HISTORY);
    const [results, setResults] = useState(null);
    const [history, setHistory] = useState(() => {
        const savedHistory = localStorage.getItem("user_scan_history");
        if (savedHistory) {
            try {
                return JSON.parse(savedHistory);
            } catch (e) {
                console.error("Failed to parse history", e);
                return [];
            }
        }
        return [];
    });

    const saveToHistory = (newResult) => {
        const record = {
            id: Date.now(),
            date: new Date().toISOString(),
            dateString: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            results: newResult
        };

        const updatedHistory = [record, ...history];
        setHistory(updatedHistory);
        localStorage.setItem("user_scan_history", JSON.stringify(updatedHistory));
    };

    const handleCapture = async (imageSrc) => {
        setView(VIEWS.ANALYZING);
        try {
            const base64Data = imageSrc.split(",")[1];

            // Real parallel request simulation
            // In dev without keys, we might need robust fallbacks or mocks directly here if services fail
            const [skinData, faceData] = await Promise.all([
                youCamService.analyzeSkin(base64Data),
                facePlusPlusService.detectFace(base64Data)
            ]);

            // Normalize Face Data
            const faceAttr = faceData.faces?.[0]?.attributes || { age: { value: "--" }, gender: { value: "--" } };

            const newResults = {
                skin: skinData,
                face: faceAttr
            };

            setResults(newResults);
            saveToHistory(newResults); // Persist immediately
            setView(VIEWS.RESULTS);
        } catch (error) {
            console.error("Analysis Failed", error);

            // Parse API error messages for user-friendly feedback
            let userMessage = "Analysis failed. Please try again.";
            const errorMsg = error.message || "";

            if (errorMsg.includes('face_too_small') || errorMsg.includes('error_src_face_too_small')) {
                userMessage = "⚠️ Face Too Small\n\nYour face is too small in the photo. Please move closer to the camera and ensure your face fills at least 60% of the frame.";
            } else if (errorMsg.includes('face_out_of_bound') || errorMsg.includes('error_src_face_out_of_bound')) {
                userMessage = "⚠️ Face Out of Bounds\n\nPlease center your face in the frame and try again.";
            } else if (errorMsg.includes('lighting_dark') || errorMsg.includes('error_lighting_dark')) {
                userMessage = "⚠️ Too Dark\n\nThe lighting is too dark. Please move to a well-lit area and try again.";
            } else if (errorMsg.includes('below_min_image_size') || errorMsg.includes('error_below_min_image_size')) {
                userMessage = "⚠️ Image Too Small\n\nThe image resolution is too low. Please ensure good camera quality.";
            } else if (errorMsg.includes('exceed_max_image_size') || errorMsg.includes('error_exceed_max_image_size')) {
                userMessage = "⚠️ Image Too Large\n\nThe image resolution is too high. This should not happen, please report this issue.";
            } else if (errorMsg.includes('Missing Credentials') || errorMsg.includes('API')) {
                userMessage = "⚠️ Service Error\n\nThere was a problem connecting to the analysis service. Please try again later.";
            }

            alert(userMessage);
            setView(VIEWS.HISTORY);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-pink-500/30 pb-20">
            <Navbar isDashboard={true} />

            <main className="container mx-auto px-4 pt-24 max-w-5xl">

                <AnimatePresence mode="wait">
                    {view === VIEWS.HISTORY && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="flex justify-between items-center mb-12">
                                <div>
                                    <h1 className="text-3xl font-bold">Your Scan History</h1>
                                    <p className="text-zinc-400">Track your skin's progress over time</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setView(VIEWS.CAPTURING)}
                                    className="px-6 py-3 bg-gradient-to-r from-pink-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-pink-500/25 flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    New Scan
                                </motion.button>
                            </div>

                            {history.length === 0 ? (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                    <ScanFace className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-zinc-300">No scans yet</h3>
                                    <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Start your first scan to reveal detailed insights about your skin health.</p>
                                    <button
                                        onClick={() => setView(VIEWS.CAPTURING)}
                                        className="text-pink-400 hover:text-pink-300 font-bold"
                                    >
                                        Start Analysis &rarr;
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {history.map((scan) => (
                                        <div key={scan.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer group"
                                            onClick={() => { setResults(scan.results); setView(VIEWS.RESULTS); }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                                                        <Activity className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg">{scan.dateString}</h4>
                                                        <div className="flex gap-4 text-sm text-zinc-400">
                                                            <span>Age: {scan.results.face.age?.value}</span>
                                                            <span>•</span>
                                                            <span>Acne Score: {scan.results.skin.acne?.score || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {view === VIEWS.CAPTURING && (
                        <motion.div
                            key="capturing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center"
                        >
                            <button
                                onClick={() => setView(VIEWS.HISTORY)}
                                className="mb-8 px-4 py-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors text-sm"
                            >
                                &larr; Cancel
                            </button>
                            <h1 className="text-3xl font-bold mb-8">Take a Selfie</h1>
                            <CameraCapture onCapture={handleCapture} />
                            <p className="mt-6 text-zinc-500 max-w-md text-center">
                                Ensure good lighting and remove glasses for the best results.
                            </p>
                        </motion.div>
                    )}

                    {view === VIEWS.ANALYZING && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[50vh]"
                        >
                            <div className="relative w-24 h-24 mb-8">
                                <ScanFace className="w-24 h-24 text-pink-500 animate-pulse" />
                                <div className="absolute inset-0 border-4 border-pink-500/30 rounded-full animate-ping" />
                            </div>
                            <h2 className="text-2xl font-bold animate-pulse">Analyzing Skin Matrix...</h2>
                            <p className="text-zinc-500 mt-2">Connecting to AI Neural Engine</p>
                        </motion.div>
                    )}

                    {view === VIEWS.RESULTS && results && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold">Complete Analysis Report</h1>
                                    <p className="text-zinc-400">Detailed biometric breakdown</p>
                                    {results.skin.overall && (
                                        <p className="text-2xl font-bold text-pink-400 mt-2">
                                            Overall Score: {results.skin.overall.score}/100
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setView(VIEWS.HISTORY)}
                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium flex items-center gap-2"
                                >
                                    &larr; Back to History
                                </button>
                            </div>

                            {/* Primary Metrics */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-4 text-zinc-300">📊 Primary Metrics</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <MetricCard
                                        title="Acne"
                                        score={results.skin.acne?.score || 0}
                                        level={results.skin.acne?.level}
                                        icon={Activity}
                                        color="red"
                                    />
                                    <MetricCard
                                        title="Wrinkles"
                                        score={results.skin.wrinkles?.score || 0}
                                        level={results.skin.wrinkles?.level}
                                        icon={Activity}
                                        color="yellow"
                                    />
                                    <MetricCard
                                        title="Texture"
                                        score={results.skin.texture?.score || 0}
                                        level={results.skin.texture?.level}
                                        icon={Sun}
                                        color="pink"
                                    />
                                    <MetricCard
                                        title="Hydration"
                                        score={results.skin.hydration?.score || 0}
                                        level={results.skin.hydration?.level}
                                        icon={Droplets}
                                        color="blue"
                                    />
                                    <MetricCard
                                        title="Pores"
                                        score={results.skin.pore?.score || 0}
                                        level={results.skin.pore?.level}
                                        icon={Activity}
                                        color="purple"
                                    />
                                    <MetricCard
                                        title="Radiance"
                                        score={results.skin.radiance?.score || 0}
                                        level={results.skin.radiance?.level}
                                        icon={Sun}
                                        color="yellow"
                                    />
                                    <MetricCard
                                        title="Firmness"
                                        score={results.skin.firmness?.score || 0}
                                        level={results.skin.firmness?.level}
                                        icon={Activity}
                                        color="green"
                                    />
                                    <MetricCard
                                        title="Redness"
                                        score={results.skin.redness?.score || 0}
                                        level={results.skin.redness?.level}
                                        icon={Activity}
                                        color="red"
                                    />
                                </div>
                            </div>

                            {/* Aging Signs */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-4 text-zinc-300">👵 Aging Signs</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <MetricCard
                                        title="Age Spots"
                                        score={results.skin.age_spot?.score || 0}
                                        level={results.skin.age_spot?.level}
                                        icon={Activity}
                                        color="orange"
                                    />
                                    <MetricCard
                                        title="Eye Bags"
                                        score={results.skin.eye_bag?.score || 0}
                                        level={results.skin.eye_bag?.level}
                                        icon={Activity}
                                        color="blue"
                                    />
                                    <MetricCard
                                        title="Dark Circles"
                                        score={results.skin.dark_circle?.score || 0}
                                        level={results.skin.dark_circle?.level}
                                        icon={Activity}
                                        color="purple"
                                    />
                                    <MetricCard
                                        title="Upper Eyelid"
                                        score={results.skin.droopy_upper_eyelid?.score || 0}
                                        level={results.skin.droopy_upper_eyelid?.level}
                                        icon={Activity}
                                        color="yellow"
                                    />
                                    <MetricCard
                                        title="Lower Eyelid"
                                        score={results.skin.droopy_lower_eyelid?.score || 0}
                                        level={results.skin.droopy_lower_eyelid?.level}
                                        icon={Activity}
                                        color="yellow"
                                    />
                                </div>
                            </div>

                            {/* Skin Condition */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-4 text-zinc-300">💧 Skin Condition</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                                    <MetricCard
                                        title="Oiliness"
                                        score={results.skin.oiliness?.score || 0}
                                        level={results.skin.oiliness?.level}
                                        icon={Droplets}
                                        color="blue"
                                    />
                                </div>
                            </div>

                            {/* Face Attributes */}
                            <div className="glass-panel p-8 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-pink-400" />
                                    Face Attributes
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    {results.skin.skin_age && (
                                        <div>
                                            <span className="text-zinc-500 text-sm">Skin Age</span>
                                            <p className="text-2xl font-bold text-pink-400">{results.skin.skin_age.display}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-zinc-500 text-sm">Estimated Age</span>
                                        <p className="text-2xl font-bold">{results.face.age?.value || "--"}</p>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 text-sm">Gender</span>
                                        <p className="text-2xl font-bold">{results.face.gender?.value || "--"}</p>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 text-sm">Scan Date</span>
                                        <p className="text-lg font-bold text-zinc-300">
                                            {history.find(h => h.results === results)?.dateString || "Just Now"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
