# Face++ Detect API V3

## Overview
Detects and analyzes human faces within an image.

## Endpoint
**URL**: `https://api-us.faceplusplus.com/facepp/v3/detect`
**Method**: `POST`

## Authentication
Required parameters in the form body:
- `api_key`: Your API Key
- `api_secret`: Your API Secret

## Request Parameters
- `image_base64`: Base64 encoded image data.
- `return_landmark`: `1` (for 83 points) or `2` (for 106 points).
- `return_attributes`: Comma-separated list.
  - Recommended: `gender,age,smiling,headpose,facequality,blur,eyestatus,emotion,beauty,mouthstatus,eyegaze,skinstatus`

## Response (Example Structure)
```json
{
    "request_id": "...",
    "time_used": 123,
    "faces": [
        {
            "face_token": "...",
            "face_rectangle": { "top": 1, "left": 1, "width": 100, "height": 100 },
            "db_landmark": [...],
            "attributes": {
                "gender": { "value": "Female" },
                "age": { "value": 25 },
                "smile": { "value": 50.5, "threshold": 50.0 },
                "emotion": { "happiness": 90.0, "neutral": 10.0 ... },
                "facequality": { "value": 80.0, "threshold": 70.0 }
            }
        }
    ]
}
```

## Liveness Inference
Face++ does not have a free public "Liveness" endpoint in the core V3 API without SDK. Use `facequality`, `eyestatus`, and `headpose` to verify image integrity, but rely on **MediaPipe** for interactive liveness challenges (blinking, smiling) as planned.
