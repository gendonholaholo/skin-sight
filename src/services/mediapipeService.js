import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

class MediaPipeService {
    constructor() {
        this.faceLandmarker = null;
        this.isLoading = false;
    }

    async initialize() {
        if (this.faceLandmarker) return this.faceLandmarker;
        if (this.isLoading) {
            // Simple polling if already loading
            return new Promise(resolve => {
                const check = setInterval(() => {
                    if (this.faceLandmarker) {
                        clearInterval(check);
                        resolve(this.faceLandmarker);
                    }
                }, 100);
            });
        }

        this.isLoading = true;
        try {
            // Use 'latest' or match the installed version. 
            // Since package.json has ^0.10.22-rc, we should use a compatible WASM.
            // Using 'latest' is usually safer than a hardcoded old version like 0.10.3.
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "CPU" // Fallback to CPU for stability
                },
                runningMode: "VIDEO",
                numFaces: 1,
                minFaceDetectionConfidence: 0.5,
                minFacePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
            });

            console.log("MediaPipe FaceLandmarker Initialized");
            return this.faceLandmarker;
        } catch (error) {
            console.error("Failed to initialize MediaPipe:", error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    detectForVideo(videoElement, startTimeMs) {
        if (!this.faceLandmarker) return null;
        return this.faceLandmarker.detectForVideo(videoElement, startTimeMs);
    }
}

export const mediaPipeService = new MediaPipeService();
