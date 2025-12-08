import { useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

export default function CameraCapture({ onCapture, autoCapture = false }) {
    const webcamRef = useRef(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            onCapture(imageSrc);
        }
    }, [webcamRef, onCapture]);

    // Auto-capture hook
    useEffect(() => {
        let timeout;
        if (autoCapture) {
            // Give a brief moment for camera to initialize/stabilize if needed
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
                videoConstraints={{
                    facingMode: "user",
                    width: 720,
                    height: 960
                }}
                className="w-full h-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 p-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                <button
                    onClick={capture}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform group"
                >
                    <div className="w-16 h-16 rounded-full bg-white group-hover:bg-pink-100 transition-colors" />
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
