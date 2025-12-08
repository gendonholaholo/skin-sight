import { useState } from "react";
import CameraCapture from "../Shared/CameraCapture";
import MetricCard from "./MetricCard";
import Navbar from "../Shared/Navbar";
import { facePlusPlusService } from "../../services/api/faceplusplus";
import { youCamService } from "../../services/api/youcam"; // This is the placeholder
import { Activity, Droplets, Sun, User, ScanFace } from "lucide-react";

const VIEWS = {
    IDLE: "idle",
    CAPTURING: "capturing",
    ANALYZING: "analyzing",
    RESULTS: "results",
};

export default function Dashboard() {
    const [view, setView] = useState(VIEWS.CAPTURING);
    const [results, setResults] = useState(null);

    const handleCapture = async (imageSrc) => {
        setView(VIEWS.ANALYZING);
        try {
            // Convert base64 to format API needs if necessary (remove prefix)
            const base64Data = imageSrc.split(",")[1];

            // Parallel requests (YouCam + Face++)
            // Note: In a real app we would display specific errors if one fails
            const [skinData, faceData] = await Promise.all([
                youCamService.analyzeSkin(base64Data),
                // facePlusPlusService.detectFace(base64Data) // Skipping actual call if key missing in dev
                Promise.resolve({ faces: [{ attributes: { age: { value: 24 }, gender: { value: "Female" } } }] })
            ]);

            setResults({
                skin: skinData,
                face: faceData.faces?.[0]?.attributes || {}
            });

            setView(VIEWS.RESULTS);
        } catch (error) {
            console.error("Analysis Failed", error);
            alert("Analysis failed. Please try again.");
            setView(VIEWS.CAPTURING);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-pink-500/30 pb-20">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 max-w-5xl">

                {view === VIEWS.CAPTURING && (
                    <div className="flex flex-col items-center">
                        <h1 className="text-3xl font-bold mb-8">Take a Selfie</h1>
                        <CameraCapture onCapture={handleCapture} />
                        <p className="mt-6 text-zinc-500 max-w-md text-center">
                            Ensure good lighting and remove glasses for the best results.
                        </p>
                    </div>
                )}

                {view === VIEWS.ANALYZING && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="relative w-24 h-24 mb-8">
                            <ScanFace className="w-24 h-24 text-pink-500 animate-pulse" />
                            <div className="absolute inset-0 border-4 border-pink-500/30 rounded-full animate-ping" />
                        </div>
                        <h2 className="text-2xl font-bold animate-pulse">Analyzing Skin Matrix...</h2>
                        <p className="text-zinc-500 mt-2">Connecting to AI Neural Engine</p>
                    </div>
                )}

                {view === VIEWS.RESULTS && results && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold">Analysis Report</h1>
                                <p className="text-zinc-400">Generated just now</p>
                            </div>
                            <button
                                onClick={() => setView(VIEWS.CAPTURING)}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
                            >
                                New Scan
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <MetricCard
                                title="Acne Score"
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
                                title="Skin Texture"
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
                        </div>

                        <div className="glass-panel p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-pink-400" />
                                Face Attributes
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div>
                                    <span className="text-zinc-500 text-sm">Estimated Age</span>
                                    <p className="text-2xl font-bold">{results.face.age?.value || "--"}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500 text-sm">Gender</span>
                                    <p className="text-2xl font-bold">{results.face.gender?.value || "--"}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500 text-sm">Skin Quality</span>
                                    <p className="text-2xl font-bold text-emerald-400">High</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
