# MediaPipe Face Landmarker (Web/JS)

## Overview
The MediaPipe Face Landmarker task detects face landmarks and facial expressions in images and video. It can be used for liveness detection by analyzing blendshapes (e.g., blink, smile).

## Setup
### CDN
```javascript
import { FilesetResolver, FaceLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
```

### Initialization
```javascript
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
);

const faceLandmarker = await FaceLandmarker.createFromModelPath(vision,
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
);
```

### Configuration Options
- **runningMode**: "image" | "video" | "LIVE_STREAM"
- **numFaces**: Max faces to detect.
- **minFaceDetectionConfidence**: Threshold (default 0.5).
- **minFacePresenceConfidence**: Threshold (default 0.5).
- **minTrackingConfidence**: Threshold (default 0.5).
- **outputFaceBlendshapes**: `true` (CRITICAL for liveness).
- **outputFacialTransformationMatrixes**: `true` (optional).

## Usage (Live Stream)
```javascript
async function predictWebcam() {
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    const result = faceLandmarker.detectForVideo(video, startTimeMs);
    
    if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
        // Access blendshapes for Liveness
        const blendshapes = result.faceBlendshapes[0].categories;
        // Example: Check for smile
        // const smile = blendshapes.find(b => b.categoryName === 'mouthSmileLeft').score;
    }
  }
  requestAnimationFrame(predictWebcam);
}
```

## Liveness Logic (Concept)
To implement liveness, we will track specific blendshapes over time:
1.  **Neutral**: All expression scores low.
2.  **Challenge (Smile)**: `mouthSmileLeft` + `mouthSmileRight` > Threshold.
3.  **Challenge (Blink)**: `eyeBlinkLeft` + `eyeBlinkRight` > Threshold.
