import { useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw } from "lucide-react";

export default function CameraCapture({ onCapture }) {
    const webcamRef = useRef(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        onCapture(imageSrc);
    }, [webcamRef, onCapture]);

    return (
        <div className="relative w-full max-w-lg mx-auto aspect-[3/4] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            />

            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                    onClick={capture}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
                >
                    <div className="w-14 h-14 border-2 border-black rounded-full" />
                </button>
            </div>
        </div>
    );
}
