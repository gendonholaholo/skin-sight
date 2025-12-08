import { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export default function CameraCapture({ onCapture, autoCapture = false }) {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const animationRef = useRef(null);

    const [faceStatus, setFaceStatus] = useState({
        detected: false,
        widthPercent: 0,
        isValid: false,
        outOfBounds: false
    });
    const [isInitializing, setIsInitializing] = useState(true);

    // Initialize MediaPipe Face Detector
    useEffect(() => {
        let mounted = true;

        async function initDetector() {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                const detector = await FaceDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    minDetectionConfidence: 0.5
                });

                if (mounted) {
                    detectorRef.current = detector;
                    setIsInitializing(false);
                    detectFaces(); // Start detection loop
                }
            } catch (error) {
                console.error("Failed to initialize face detector:", error);
                setIsInitializing(false);
            }
        }

        initDetector();

        return () => {
            mounted = false;
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Real-time face detection loop
    const detectFaces = useCallback(() => {
        const video = webcamRef.current?.video;
        const canvas = canvasRef.current;

        if (video && canvas && detectorRef.current && video.readyState === 4) {
            try {
                const ctx = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Run detection
                const startTime = performance.now();
                const results = detectorRef.current.detectForVideo(video, startTime);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.detections?.length > 0) {
                    // Use first detected face
                    const face = results.detections[0];
                    const bbox = face.boundingBox;

                    // Calculate face width percentage
                    const faceWidth = bbox.width;
                    const imageWidth = canvas.width;
                    const widthPercent = (faceWidth / imageWidth) * 100;

                    // Check if face is within frame bounds (not cut off)
                    const margin = 10; // Allow small margin for floating point errors
                    const isWithinBounds =
                        bbox.originX >= -margin &&
                        bbox.originY >= -margin &&
                        bbox.originX + bbox.width <= canvas.width + margin &&
                        bbox.originY + bbox.height <= canvas.height + margin;

                    // Face is valid if: width >= 60% AND within bounds
                    const isValid = widthPercent >= 60 && isWithinBounds;

                    setFaceStatus({
                        detected: true,
                        widthPercent,
                        isValid,
                        outOfBounds: !isWithinBounds
                    });

                    // Draw bounding box - color based on validity
                    ctx.strokeStyle = isValid ? '#22c55e' : '#ef4444';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(bbox.originX, bbox.originY, bbox.width, bbox.height);

                    // Draw semi-transparent fill
                    ctx.fillStyle = isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                    ctx.fillRect(bbox.originX, bbox.originY, bbox.width, bbox.height);

                } else {
                    setFaceStatus({ detected: false, widthPercent: 0, isValid: false, outOfBounds: false });
                }
            } catch (error) {
                console.error("Detection error:", error);
            }
        }

        animationRef.current = requestAnimationFrame(detectFaces);
    }, []);

    const capture = useCallback(() => {
        if (!faceStatus.isValid && !autoCapture) {
            if (faceStatus.outOfBounds) {
                alert("Please move back from the camera! Your face is too close and extends beyond the frame.");
            } else {
                alert("Please move closer to the camera! Your face should fill at least 60% of the frame.");
            }
            return;
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            onCapture(imageSrc);
        }
    }, [faceStatus, onCapture, autoCapture]);

    // Auto-capture hook (with face validation disabled for auto mode)
    useEffect(() => {
        let timeout;
        if (autoCapture) {
            timeout = setTimeout(() => {
                if (webcamRef.current) {
                    capture();
                }
            }, 800);
        }
        return () => clearTimeout(timeout);
    }, [autoCapture, capture]);

    return (
        <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                mirrored={true}
                videoConstraints={{
                    facingMode: "user",
                    width: 720,
                    height: 960
                }}
                className="w-full h-full object-cover"
            />

            {/* Detection overlay canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Status indicator */}
            {!isInitializing && !autoCapture && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                    {faceStatus.detected ? (
                        faceStatus.isValid ? (
                            <div className="bg-green-500/90 text-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-sm flex items-center gap-2">
                                <span className="text-lg">✓</span>
                                Ready to capture ({faceStatus.widthPercent.toFixed(0)}%)
                            </div>
                        ) : faceStatus.outOfBounds ? (
                            <div className="bg-orange-500/90 text-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-sm flex items-center gap-2">
                                <span className="text-lg">⚠</span>
                                Move back - face is cut off
                            </div>
                        ) : (
                            <div className="bg-red-500/90 text-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-sm flex items-center gap-2">
                                <span className="text-lg">⚠</span>
                                Move closer ({faceStatus.widthPercent.toFixed(0)}% - need 60%)
                            </div>
                        )
                    ) : (
                        <div className="bg-yellow-500/90 text-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-sm flex items-center gap-2 animate-pulse">
                            <span className="text-lg">🔍</span>
                            Detecting face...
                        </div>
                    )}
                </div>
            )}

            {isInitializing && !autoCapture && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-blue-500/90 text-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-sm animate-pulse">
                        Loading face detector...
                    </div>
                </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                <button
                    onClick={capture}
                    disabled={!faceStatus.isValid && !autoCapture && !isInitializing}
                    className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${(!faceStatus.isValid && !autoCapture && !isInitializing)
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 group'
                        }`}
                >
                    <div className={`w-16 h-16 rounded-full transition-colors ${(faceStatus.isValid || autoCapture || isInitializing)
                        ? 'bg-white group-hover:bg-pink-100'
                        : 'bg-gray-400'
                        }`} />
                </button>
            </div>

            {autoCapture && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                    <p className="text-white font-bold animate-pulse">Auto-capturing...</p>
                </div>
            )}
        </div>
    );
}
