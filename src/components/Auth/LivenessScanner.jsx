import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace, CheckCircle, Smile, Eye } from "lucide-react";
import { mediaPipeService } from "../../services/mediapipeService";
import clsx from "clsx";

const STATES = {
    IDLE: "idle",
    LOADING: "loading",
    NEUTRAL: "neutral",
    CHALLENGE: "challenge",
    VERIFY: "verify",
    SUCCESS: "success",
    FAILURE: "failure",
};

const CHALLENGES = [
    {
        id: "smile",
        label: "Smile!",
        icon: <Smile className="w-8 h-8" />,
        check: (shapes) => {
            const left = shapes.find(s => s.categoryName === "mouthSmileLeft")?.score || 0;
            const right = shapes.find(s => s.categoryName === "mouthSmileRight")?.score || 0;
            return Math.max(left, right) > 0.4;
        }
    },
    {
        id: "blink",
        label: "Blink Both Eyes!",
        icon: <Eye className="w-8 h-8" />,
        check: (shapes) => {
            const left = shapes.find(s => s.categoryName === "eyeBlinkLeft")?.score || 0;
            const right = shapes.find(s => s.categoryName === "eyeBlinkRight")?.score || 0;
            return left > 0.4 && right > 0.4;
        }
    },
];

export default function LivenessScanner({ onBack, onSuccess }) {
    const videoRef = useRef(null);
    const [status, setStatus] = useState(STATES.LOADING);
    const [message, setMessage] = useState("Initializing Camera...");
    const [challenge, setChallenge] = useState(null);
    const [progress, setProgress] = useState(0); // 0 to 100 for holding the pose
    const [lastError, setLastError] = useState(null); // Capture runtime errors

    // REFS for Loop Access (Fixes Stale Closure)
    const statusRef = useRef(status);
    const challengeRef = useRef(challenge);

    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { challengeRef.current = challenge; }, [challenge]);

    const lastVideoTime = useRef(-1);
    const lastRunTime = useRef(Date.now());
    const requestRef = useRef(null);
    const holdStartTime = useRef(null);
    const neutralStartTime = useRef(null);

    const streamRef = useRef(null); // Fix for camera not turning off

    const [debugInfo, setDebugInfo] = useState({ faceFound: false, scores: {} }); // Real-time diagnostics

    useEffect(() => {
        // 1. Setup Camera
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, facingMode: "user" }
                });

                streamRef.current = stream; // Store for cleanup

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    console.log("Stream assigned to video element");
                    // Wait for metadata to load before playing
                    videoRef.current.onloadedmetadata = () => {
                        console.log("Metadata loaded, attempting playback...");
                        videoRef.current.play().catch(e => console.error("Play failed:", e));
                    };
                }

                // Initialize MediaPipe
                await mediaPipeService.initialize();
                setStatus(STATES.NEUTRAL);
                setMessage("Position your face in the center");

                // Start detection loop now that everything is ready
                predictWebcam();
            } catch (err) {
                console.error("Camera init error:", err);
                setStatus(STATES.FAILURE);
                setMessage("Camera access denied or error");
            }
        };

        startCamera();

        return () => {
            // Robust Cleanup
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log("Track stopped:", track.label);
                });
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const predictWebcam = async () => {
        // If unmounted, stop.
        if (!videoRef.current) return;

        // If model not ready yet, keep checking (do not kill the loop)
        if (!mediaPipeService.faceLandmarker) {
            console.log("Waiting for faceLandmarker..."); // DEBUG
            requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        // 1. Wall-clock Check: Limit to ~15 FPS to keep it smooth but cool
        const now = Date.now();
        if (now - lastRunTime.current < 65) {
            requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }
        lastRunTime.current = now;

        // 2. Video Frame Check: Ensure we aren't re-processing the same frame
        const video = videoRef.current;

        // Critical: Check if video is actually ready to give us data
        if (video.readyState < 2) {
            // HAVE_CURRENT_DATA (2) or higher is needed
            requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        if (video.currentTime !== lastVideoTime.current) {
            lastVideoTime.current = video.currentTime;

            try {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    const startTimeMs = performance.now();
                    const result = mediaPipeService.detectForVideo(video, startTimeMs);
                    processResult(result);
                } else {
                    console.log("Video dimensions zero");
                }
            } catch (error) {
                console.error("MediaPipe detection error:", error);
                setLastError(error.message); // Show on UI
            }
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const processResult = (result) => {
        const currentStatus = statusRef.current; // access latest state
        const currentChallenge = challengeRef.current;

        if (!result || result.faceLandmarks.length === 0) {
            setDebugInfo({ faceFound: false, scores: {} });
            // Face lost logic
            if (currentStatus !== STATES.LOADING && currentStatus !== STATES.FAILURE && currentStatus !== STATES.SUCCESS) {
                setMessage("Face not found. Move closer.");
                holdStartTime.current = null;
                neutralStartTime.current = null;
                setProgress(0);
            }
            return;
        }

        const blendshapes = result.faceBlendshapes[0].categories;

        // Extract diagnostic scores
        const scores = {};
        ["mouthSmileLeft", "mouthSmileRight", "eyeBlinkLeft", "eyeBlinkRight"].forEach(name => {
            const shape = blendshapes.find(s => s.categoryName === name);
            if (shape) scores[name] = shape.score.toFixed(2);
        });
        setDebugInfo({ faceFound: true, scores });

        // State Machine Logic
        if (currentStatus === STATES.NEUTRAL) {
            // Check for neutral face
            const criticalShapes = ["mouthSmileLeft", "mouthSmileRight", "eyeBlinkLeft", "eyeBlinkRight"];
            const violatingShape = blendshapes.find(s => criticalShapes.includes(s.categoryName) && s.score > 0.35);

            if (!violatingShape) {
                if (!neutralStartTime.current) neutralStartTime.current = Date.now();
                const elapsed = Date.now() - neutralStartTime.current;
                const p = Math.min((elapsed / 2000) * 100, 100);
                setProgress(p);
                setMessage("Stay still...");

                if (elapsed > 2000) {
                    // Determine constraint for next step
                    const nextChallenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
                    setChallenge(nextChallenge);
                    setStatus(STATES.CHALLENGE);
                    setMessage(nextChallenge.label);
                    setProgress(0);
                    neutralStartTime.current = null;
                }
            } else {
                neutralStartTime.current = null;
                setProgress(0);
                // Inform user what is wrong
                setMessage(`Relax your ${violatingShape.categoryName.includes('mouth') ? 'mouth' : 'eyes'}`);
            }
        } else if (currentStatus === STATES.CHALLENGE) {
            // Verify Challenge
            if (currentChallenge && currentChallenge.check(blendshapes)) {
                setStatus(STATES.VERIFY);
                setMessage(`Hold that ${currentChallenge.id}!`);
            }
        } else if (currentStatus === STATES.VERIFY) {
            if (currentChallenge && currentChallenge.check(blendshapes)) {
                if (!holdStartTime.current) holdStartTime.current = Date.now();
                const elapsed = Date.now() - holdStartTime.current;
                const p = Math.min((elapsed / 1000) * 100, 100);
                setProgress(p);

                if (elapsed > 1000) {
                    setStatus(STATES.SUCCESS);
                    setMessage("Identity Verified!");
                    setTimeout(() => onSuccess && onSuccess(), 1000);
                }
            } else {
                // Failed to hold
                setStatus(STATES.CHALLENGE);
                setMessage(currentChallenge.label);
                holdStartTime.current = null;
                setProgress(0);
            }
        }
    };

    const [tick, setTick] = useState(0); // Heartbeat for debug overlay

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted // CRITICAL for autoplay
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            />

            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8">
                {/* Status Bar */}
                <div className="w-full bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                    <h3 className={clsx("text-lg font-bold transition-colors", {
                        "text-yellow-400": status === STATES.LOADING,
                        "text-blue-400": status === STATES.NEUTRAL,
                        "text-pink-500": status === STATES.CHALLENGE || status === STATES.VERIFY,
                        "text-emerald-500": status === STATES.SUCCESS,
                    })}>
                        {message}
                    </h3>
                </div>

                {/* Central Ring Scanner */}
                <div className="relative w-64 h-64">
                    {/* Progress Ring */}
                    <svg className="w-full h-full rotate-[-90deg]">
                        <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                        <motion.circle
                            cx="50%" cy="50%" r="48%" fill="none"
                            stroke={status === STATES.SUCCESS ? "#10b981" : "#ec4899"}
                            strokeWidth="4"
                            strokeDasharray="301"
                            strokeDashoffset={301 - (301 * progress) / 100}
                            initial={{ strokeDashoffset: 301 }}
                            animate={{ strokeDashoffset: 301 - (301 * progress) / 100 }}
                            className="transition-all duration-100"
                        />
                    </svg>

                    {/* Icon in Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {status === STATES.LOADING && <ScanFace className="w-16 h-16 text-white/50 animate-pulse" />}
                            {status === STATES.NEUTRAL && <ScanFace className="w-16 h-16 text-blue-400" />}
                            {(status === STATES.CHALLENGE || status === STATES.VERIFY) && challenge?.icon && (
                                <div className="text-pink-500 animate-bounce">{challenge.icon}</div>
                            )}
                            {status === STATES.SUCCESS && <CheckCircle className="w-20 h-20 text-emerald-500" />}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="text-sm text-zinc-500 font-mono">
                    SECURE BIOMETRIC SCAN
                </div>
            </div>

            {/* DEBUG OVERLAY - REMOVE LATER */}
            <div className="absolute top-2 left-2 bg-black/80 text-green-400 text-xs p-2 rounded font-mono z-50 pointer-events-none whitespace-pre-wrap max-w-[200px]">
                DEBUG INFO:
                <br />State: {status}
                <br />Video Ready: {videoRef.current?.readyState ?? "?"}
                <br />Video Time: {videoRef.current?.currentTime?.toFixed(2) ?? "?"}
                <br />Model: {mediaPipeService.faceLandmarker ? "READY" : "WAITING"}
                <br />Face Found: {debugInfo.faceFound ? "YES" : "NO"}
                {debugInfo.faceFound && (
                    <>
                        <br />Smile L: {debugInfo.scores.mouthSmileLeft}
                        <br />Smile R: {debugInfo.scores.mouthSmileRight}
                        <br />Blink L: {debugInfo.scores.eyeBlinkLeft}
                        <br />Blink R: {debugInfo.scores.eyeBlinkRight}
                    </>
                )}
                {lastError && <span className="text-red-500 block font-bold">ERR: {lastError}</span>}
            </div>
        </div>
    );
}
