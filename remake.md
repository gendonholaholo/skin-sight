# SkinSight Application Remake Guide

This document summarizes the current state, logic, and dependencies of the SkinSight application to assist in a clean rebuild.

## 1. Project Overview
**Name**: SkinSight
**Description**: A web application that allows users to analyze their skin health using facial analysis AI. It features a secure biometric login flow (face liveness detection) and provides a detailed skin health report with PDF export capabilities.

## 2. Technology Stack
*   **Core**: React 18+, Vite
*   **Styling**: Tailwind CSS (with `clsx` and `tailwind-merge` for utility management)
*   **Animations**: Framer Motion (crucial for the scanner UI and page transitions)
*   **Icons**: Lucide React
*   **Camera**: `react-webcam` (or native logic, but used specifically here)
*   **Face Analysis**: Google MediaPipe (`@mediapipe/tasks-vision`)
*   **Report Generation**: `html2pdf.js`
*   **Security/Auth Utils**: `jose` (for future JWT handling)

## 3. External APIs & Credentials

### A. Google MediaPipe (Face Landmarker)
*   **Purpose**: Real-time client-side face tracking, blendshape detection (blink, smile), and liveness verification.
*   **Cost**: Free / Open Source.
*   **Setup**:
    *   No API Key required.
    *   **Requires Model File**: You must host the `face_landmarker.task` file (typically in `/public/models/`).
    *   **Configuration**:
        ```javascript
        filesetResolver: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        delegate: "GPU" // Critical for performance
        minFaceDetectionConfidence: 0.3
        ```

### B. Perfect Corp Skin Analysis API
*   **Purpose**: analyzing the static image to get skin metrics (acne, wrinkles, age, etc.).
*   **Status**: Active Credentials Provided.
*   **Environment Variables**:
    *   `VITE_PERFECT_CORP_API_KEY=sk-o_HxvQG986DCFf9KhRGDuEQsW3QZIO32qHxJ5lhbJYLPPiglaHRrIOHQcPfI8Fvt`
    *   `VITE_PERFECT_CORP_SECRET_KEY=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/MZK6w0tF91SEwUV4B7K1q7l6/aWvFzd7l+mkmZ+Uzntm+IWdx7DfrAJXtJr3f7qtJpw+hC0C0PoT6NXIVcy2RtFPYip4x0CnazCzlTQMAQo5Q68VOdnzEHTTk2bDGGScqN6NrbzHI2etNEh5afizfeGCtQtuhloLn/0u9cjOfQIDAQAB`
*   **Endpoints**:
    *   Base URL: `https://api-online.perf-dev.com/v1`

### C. Face++ API (Face Recognition & Liveness Backend)
*   **Purpose**: Server-side verification (optional) or additional face attributes.
*   **Environment Variables**:
    *   `VITE_FACEPP_API_KEY=zLw-EfIpGmUEM149G5E6NV73XQrAIFqr`
    *   `VITE_FACEPP_API_SECRET=BX9ad8M6QCW08Up18AwxK10RjJnNfDi6`
    *   `VITE_FACEPP_API_URL=https://api-us.faceplusplus.com/facepp/v3`

## 4. Key Feature Implementation Details

### A. Authentication & Liveness (The "AuthScreen")
**Logic**: A strict 3-phase state machine to prevent spoofing.
1.  **View 1: Form Mode** (Default)
    *   Tabs: Login / Register.
    *   Inputs: Username.
    *   Action: "Start Face Scan" button switches to Scanner Mode.
    *   **Cancel Button**: Returns to Home.
2.  **View 2: Scanner Mode** (Overlay)
    *   **Phase 1: Neutrality Gate** (Orange Ring). User must hold still/neutral for 1.5s.
    *   **Phase 2: Challenge Injection** (Yellow Ring). Random prompt: "SMILE" or "BLINK".
    *   **Phase 3: Response Verification** (Blue Ring). User must perform action and hold for 1s.
    *   **Success**: Green Ring -> transitions to App.
    *   **Failure**: Red Ring -> Retries or feedback ("Too Close", "Face Not Found").

### B. Main Application Flow (`App.jsx`)
1.  **Home Step**: Landing page with "Scan Now" button.
2.  **Capture Step**: Fullscreen camera view to take a high-res selfie.
3.  **Analyzing Step**: Simulation delay (loading spinner with scanning animation).
4.  **Results Step**: 
    *   Display "Confidence Score" (from liveness).
    *   Grid of `MetricCard` components (Acne, Texture, Wrinkles, etc.).
    *   AI Summary Text.
    *   "Save Report PDF" button.

## 5. Directory Structure Recommendation
For the remake, structure the project like this:
```
src/
├── components/
│   ├── Auth/
│   │   ├── AuthScreen.jsx      # Main wrapper
│   │   ├── LivenessScanner.jsx # The dynamic SVG overlay
│   │   └── Forms.jsx           # The Login/Register inputs
│   ├── Dashboard/
│   │   ├── MetricCard.jsx
│   │   └── ReportView.jsx
│   └── Shared/
│       ├── CameraCapture.jsx
│       └── Logo.jsx
├── services/
│   ├── mediapipe.js            # FaceLandmarker logic singleton
│   ├── skinApi.js              # Perfect Corp API logic
│   └── logger.js               # Centralized logging
├── hooks/
│   └── useLiveness.js          # (Optional) Extract state machine logic here
└── App.jsx
```

## 6. Critical Assets
Ensure you have these files in your `public` folder:
1.  `models/face_landmarker.task` (The AI Model)
2.  `hero_visual.png` (For the landing page)
3.  Icons (`icon_camera.png`, etc.)
