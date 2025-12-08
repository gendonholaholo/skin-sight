const API_KEY = import.meta.env.VITE_PERFECT_CORP_API_KEY;

// Image size requirements from API docs
const HD_MIN_SHORT_SIDE = 1080;
const HD_MAX_LONG_SIDE = 2560;
const SD_MIN_SHORT_SIDE = 480;
const SD_MAX_LONG_SIDE = 1920;

/**
 * Resize image to meet API requirements
 * @param {string} base64Image - Base64 encoded image
 * @param {boolean} isHD - Whether to resize for HD (true) or SD (false)
 * @returns {Promise<string>} Resized base64 image
 */
async function resizeImageForAPI(base64Image, isHD = false) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const targetMinShortSide = isHD ? HD_MIN_SHORT_SIDE : SD_MIN_SHORT_SIDE;
            const targetMaxLongSide = isHD ? HD_MAX_LONG_SIDE : SD_MAX_LONG_SIDE;

            let width = img.width;
            let height = img.height;
            const shortSide = Math.min(width, height);

            // Calculate scale factor
            let scale = 1;

            // Ensure short side meets minimum
            if (shortSide < targetMinShortSide) {
                scale = targetMinShortSide / shortSide;
            }

            // Apply scale
            width = Math.round(width * scale);
            height = Math.round(height * scale);

            // Ensure long side doesn't exceed maximum
            const newLongSide = Math.max(width, height);
            if (newLongSide > targetMaxLongSide) {
                const downscale = targetMaxLongSide / newLongSide;
                width = Math.round(width * downscale);
                height = Math.round(height * downscale);
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            // Convert back to base64
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.95);
            console.log(`✅ Image resized: ${img.width}x${img.height} → ${width}x${height} (${isHD ? 'HD' : 'SD'} mode)`);
            resolve(resizedBase64);
        };

        img.onerror = (e) => {
            console.error('Image load error:', e);
            reject(new Error('Failed to load image for resizing'));
        };

        // Ensure base64 has proper data URL prefix
        const base64Src = base64Image.startsWith('data:')
            ? base64Image
            : `data:image/jpeg;base64,${base64Image}`;

        img.src = base64Src;
    });
}

export const youCamService = {
    // Helper to upload image and get file_id
    uploadImage: async (imageBase64) => {
        if (!API_KEY) throw new Error("Missing Credentials");

        // 1. Convert Base64 to Blob
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const cleanBase64 = base64Data.replace(/\s/g, '');

        try {
            const byteCharacters = atob(cleanBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            // 2. Request Upload URL (V2 Endpoint for Skin Analysis)
            // Proxied via /api/perfectcorp
            // Matches user-provided documentation: POST /s2s/v2.0/file/skin-analysis
            const UPLOAD_INIT_URL = "/api/perfectcorp/s2s/v2.0/file/skin-analysis";

            const initResponse = await fetch(UPLOAD_INIT_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    files: [{
                        content_type: "image/jpeg",
                        file_name: "selfie.jpg",
                        file_size: blob.size
                    }]
                })
            });

            if (!initResponse.ok) {
                const err = await initResponse.text();
                throw new Error(`YouCam Upload Init Failed: ${initResponse.status} - ${err}`);
            }

            const initData = await initResponse.json();
            console.log("📤 YouCam Upload Init Response:", JSON.stringify(initData, null, 2));

            // V2 API response structure: { status: 200, data: { files: [...] } }
            // Extract the actual data wrapper if present
            const responseData = initData.data || initData;
            const fileData = responseData.files?.[0];

            if (!fileData) {
                console.error("❌ Invalid Upload Init Response:", initData);
                throw new Error("Invalid response from upload init");
            }

            console.log("✅ File ID obtained:", fileData.file_id);

            const fileId = fileData.file_id;
            const uploadRequest = fileData.requests?.[0] || fileData.upload_url;

            // 3. Upload File to S3
            // If uploadRequest is an object (V1 style/V2 style), use it. If it's just a URL string, use PUT.
            let uploadUrl, uploadMethod;

            if (typeof uploadRequest === 'object' && uploadRequest.url) {
                uploadUrl = uploadRequest.url;
                uploadMethod = uploadRequest.method || 'PUT';
            } else if (typeof uploadRequest === 'string') {
                uploadUrl = uploadRequest;
                uploadMethod = 'PUT';
            } else {
                throw new Error("Could not determine upload URL");
            }

            const uploadResponse = await fetch(uploadUrl, {
                method: uploadMethod,
                // Some signed URLs default to strict headers, others don't. 
                // If headers are provided in init response, usage is recommended.
                headers: uploadRequest.headers || { "Content-Type": "image/jpeg" },
                body: blob
            });

            if (!uploadResponse.ok) {
                throw new Error(`YouCam File Upload Failed: ${uploadResponse.status}`);
            }

            return fileId;
        } catch (error) {
            console.error("YouCam Upload Error:", error);
            throw error;
        }
    },

    analyzeSkin: async (imageBase64) => {
        if (!API_KEY) {
            console.warn("YouCam Credentials missing");
            throw new Error("Missing Credentials");
        }

        try {
            // Step 0: Detect image size and determine HD vs SD
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = (e) => {
                    console.error('Image load error in analyzeSkin:', e);
                    reject(new Error('Failed to load image'));
                };

                // Ensure base64 has proper data URL prefix
                const base64Src = imageBase64.startsWith('data:')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`;

                image.src = base64Src;
            });

            const shortSide = Math.min(img.width, img.height);
            const useHD = shortSide >= HD_MIN_SHORT_SIDE;

            console.log(`📏 Original image: ${img.width}x${img.height}`);
            console.log(`🎯 Selected mode: ${useHD ? 'HD' : 'SD'} Skincare`);

            // Resize image to meet API requirements
            const resizedImage = await resizeImageForAPI(imageBase64, useHD);

            // Step 1: Upload Image
            const fileId = await youCamService.uploadImage(resizedImage);

            // Step 2: Run Analysis Task (V2 Endpoint)
            const API_URL = "/api/perfectcorp/s2s/v2.0/task/skin-analysis";

            // Auto-select features based on image quality
            // API requires exactly 4, 7, or 14 distinct dst_actions
            // Must use either ALL HD or ALL SD features (cannot mix)
            const hdFeatures = [
                "hd_wrinkle",
                "hd_pore",
                "hd_texture",
                "hd_acne",
                "hd_radiance",
                "hd_eye_bag",
                "hd_firmness"
            ];

            const sdFeatures = [
                "wrinkle",
                "pore",
                "texture",
                "acne",
                "radiance",
                "eye_bag",
                "firmness"
            ];

            const payload = {
                src_file_id: fileId,
                dst_actions: useHD ? hdFeatures : sdFeatures,
                miniserver_args: {
                    enable_mask_overlay: false
                }
            };

            const taskResponse = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!taskResponse.ok) {
                const errorData = await taskResponse.text();
                throw new Error(`YouCam Analysis Failed: ${taskResponse.status} - ${errorData}`);
            }

            const taskData = await taskResponse.json();
            console.log("🔬 YouCam Task Submission Response:", JSON.stringify(taskData, null, 2));

            // Extract task_id from response (may be wrapped in data object)
            const responseData = taskData.data || taskData;
            const taskId = responseData.task_id;

            if (!taskId) {
                console.error("❌ No task_id in response:", taskData);
                throw new Error("Failed to get task_id from analysis submission");
            }

            console.log("✅ Task ID obtained:", taskId);

            // Step 3: Poll for task completion
            const STATUS_URL = `/api/perfectcorp/s2s/v2.0/task/skin-analysis/${taskId}`;
            const MAX_ATTEMPTS = 30; // Max 60 seconds (30 * 2s)
            const POLL_INTERVAL = 2000; // 2 seconds

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

                const statusResponse = await fetch(STATUS_URL, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`
                    }
                });

                if (!statusResponse.ok) {
                    const errorData = await statusResponse.text();
                    throw new Error(`Status check failed: ${statusResponse.status} - ${errorData}`);
                }

                const statusData = await statusResponse.json();
                const status = (statusData.data || statusData);

                console.log(`🔄 Poll attempt ${attempt + 1}/${MAX_ATTEMPTS}`);
                console.log(`📊 Task ${taskId} status:`, status.task_status);
                console.log(`📋 Full status response:`, JSON.stringify(statusData, null, 2));

                if (status.task_status === "success") {
                    // Task completed successfully
                    console.log("✅ Analysis completed successfully!");
                    console.log("📦 Raw API response:", JSON.stringify(status, null, 2));

                    // API returns ZIP file URL, not direct JSON scores
                    const zipUrl = status.results?.url;

                    if (!zipUrl) {
                        throw new Error("No ZIP URL in results");
                    }

                    console.log("📥 Downloading ZIP from:", zipUrl);

                    // Download and extract ZIP file
                    const zipResponse = await fetch(zipUrl);
                    if (!zipResponse.ok) {
                        throw new Error(`Failed to download ZIP: ${zipResponse.status}`);
                    }

                    const zipBlob = await zipResponse.blob();

                    // Import JSZip dynamically
                    const JSZip = (await import('jszip')).default;
                    const zip = await JSZip.loadAsync(zipBlob);

                    // Extract score_info.json from skinanalysisResult folder
                    const scoreInfoPath = 'skinanalysisResult/score_info.json';
                    const scoreInfoFile = zip.file(scoreInfoPath);

                    if (!scoreInfoFile) {
                        console.error("❌ ZIP contents:", Object.keys(zip.files));
                        throw new Error(`score_info.json not found in ZIP. Available files: ${Object.keys(zip.files).join(', ')}`);
                    }

                    const scoreInfoJson = await scoreInfoFile.async('string');
                    const scoreData = JSON.parse(scoreInfoJson);

                    console.log("✅ Extracted score_info.json:", scoreData);

                    // Transform response to match Dashboard expectations
                    return transformYouCamResponse(scoreData, useHD);
                } else if (status.task_status === "error" || status.task_status === "failed") {
                    console.error("❌ Analysis failed. Full error details:", JSON.stringify(status, null, 2));
                    throw new Error(`Analysis failed: ${status.error_message || status.error_code || "Unknown error"}`);
                }
                // If still "running" or "pending", continue polling
            }

            throw new Error("Analysis timed out after 60 seconds");
        } catch (error) {
            console.error("YouCam Skin Analysis Error:", error);
            throw error;
        }
    }
};

/**
 * Transform YouCam API response to Dashboard-compatible format
 */
function transformYouCamResponse(apiResponse, isHD) {
    // score_info.json has direct structure (no 'results' wrapper)
    const data = apiResponse;

    console.log("\n🔍 ===== TRANSFORM DEBUG START =====");
    console.log("📊 Mode:", isHD ? "HD" : "SD");
    console.log("📋 API Response keys:", Object.keys(apiResponse));
    console.log("📦 Data keys:", Object.keys(data));
    console.log("🗂️ Full data structure:", JSON.stringify(data, null, 2));

    // Check for expected fields
    if (isHD) {
        console.log("\n✅ HD field existence check:");
        console.log("   hd_acne:", data.hd_acne ? "✓ FOUND" : "✗ MISSING");
        console.log("   hd_wrinkle:", data.hd_wrinkle ? "✓ FOUND" : "✗ MISSING");
        console.log("   hd_texture:", data.hd_texture ? "✓ FOUND" : "✗ MISSING");
        console.log("   hd_pore:", data.hd_pore ? "✓ FOUND" : "✗ MISSING");
        console.log("   hd_radiance:", data.hd_radiance ? "✓ FOUND" : "✗ MISSING");
        console.log("   hd_eye_bag:", data.hd_eye_bag ? "✓ FOUND" : "✗ MISSING");
        console.log("   hd_firmness:", data.hd_firmness ? "✓ FOUND" : "✗ MISSING");
        console.log("   hd_moisture:", data.hd_moisture ? "✓ FOUND" : "✗ MISSING");
    } else {
        console.log("\n✅ SD field existence check:");
        console.log("   acne:", data.acne ? "✓ FOUND" : "✗ MISSING");
        console.log("   wrinkle:", data.wrinkle ? "✓ FOUND" : "✗ MISSING");
        console.log("   texture:", data.texture ? "✓ FOUND" : "✗ MISSING");
        console.log("   pore:", data.pore ? "✓ FOUND" : "✗ MISSING");
        console.log("   radiance:", data.radiance ? "✓ FOUND" : "✗ MISSING");
        console.log("   eye_bag:", data.eye_bag ? "✓ FOUND" : "✗ MISSING");
        console.log("   firmness:", data.firmness ? "✓ FOUND" : "✗ MISSING");
        console.log("   moisture:", data.moisture ? "✓ FOUND" : "✗ MISSING");
    }
    console.log("");

    const transformed = {};

    if (isHD) {
        // HD mode: Extract from nested structure
        // HD features have "whole" subcategory for texture, acne, wrinkle, pore
        transformed.acne = {
            score: data.hd_acne?.whole?.ui_score || data.hd_acne?.ui_score || 0,
            level: getLevel(data.hd_acne?.whole?.ui_score || data.hd_acne?.ui_score || 0)
        };

        transformed.wrinkles = {
            score: data.hd_wrinkle?.whole?.ui_score || data.hd_wrinkle?.ui_score || 0,
            level: getLevel(data.hd_wrinkle?.whole?.ui_score || data.hd_wrinkle?.ui_score || 0)
        };

        transformed.texture = {
            score: data.hd_texture?.whole?.ui_score || data.hd_texture?.ui_score || 0,
            level: getLevel(data.hd_texture?.whole?.ui_score || data.hd_texture?.ui_score || 0)
        };

        // HD moisture maps to hydration
        transformed.hydration = {
            score: data.hd_moisture?.ui_score || 0,
            level: getLevel(data.hd_moisture?.ui_score || 0)
        };

        // Additional HD metrics
        transformed.radiance = {
            score: data.hd_radiance?.ui_score || 0,
            level: getLevel(data.hd_radiance?.ui_score || 0)
        };

        transformed.eye_bag = {
            score: data.hd_eye_bag?.ui_score || 0,
            level: getLevel(data.hd_eye_bag?.ui_score || 0)
        };

        transformed.firmness = {
            score: data.hd_firmness?.ui_score || 0,
            level: getLevel(data.hd_firmness?.ui_score || 0)
        };

        // Additional HD metrics (matched to API documentation)
        transformed.pore = {
            score: data.hd_pore?.whole?.ui_score || data.hd_pore?.ui_score || 0,
            level: getLevel(data.hd_pore?.whole?.ui_score || data.hd_pore?.ui_score || 0)
        };

        transformed.dark_circle = {
            score: data.hd_dark_circle?.ui_score || 0,
            level: getLevel(data.hd_dark_circle?.ui_score || 0)
        };

        transformed.redness = {
            score: data.hd_redness?.ui_score || 0,
            level: getLevel(data.hd_redness?.ui_score || 0)
        };

        transformed.oiliness = {
            score: data.hd_oiliness?.ui_score || 0,
            level: getLevel(data.hd_oiliness?.ui_score || 0)
        };

        transformed.age_spot = {
            score: data.hd_age_spot?.ui_score || 0,
            level: getLevel(data.hd_age_spot?.ui_score || 0)
        };

        transformed.droopy_upper_eyelid = {
            score: data.hd_droopy_upper_eyelid?.ui_score || 0,
            level: getLevel(data.hd_droopy_upper_eyelid?.ui_score || 0)
        };

        transformed.droopy_lower_eyelid = {
            score: data.hd_droopy_lower_eyelid?.ui_score || 0,
            level: getLevel(data.hd_droopy_lower_eyelid?.ui_score || 0)
        };

    } else {
        // SD mode: Flat structure
        transformed.acne = {
            score: data.acne?.ui_score || 0,
            level: getLevel(data.acne?.ui_score || 0)
        };

        transformed.wrinkles = {
            score: data.wrinkle?.ui_score || 0,
            level: getLevel(data.wrinkle?.ui_score || 0)
        };

        transformed.texture = {
            score: data.texture?.ui_score || 0,
            level: getLevel(data.texture?.ui_score || 0)
        };

        // SD moisture maps to hydration
        transformed.hydration = {
            score: data.moisture?.ui_score || 0,
            level: getLevel(data.moisture?.ui_score || 0)
        };

        transformed.radiance = {
            score: data.radiance?.ui_score || 0,
            level: getLevel(data.radiance?.ui_score || 0)
        };

        transformed.eye_bag = {
            score: data.eye_bag?.ui_score || 0,
            level: getLevel(data.eye_bag?.ui_score || 0)
        };

        transformed.firmness = {
            score: data.firmness?.ui_score || 0,
            level: getLevel(data.firmness?.ui_score || 0)
        };

        // Additional SD metrics (matched to API documentation)
        transformed.pore = {
            score: data.pore?.ui_score || 0,
            level: getLevel(data.pore?.ui_score || 0)
        };

        // SD uses dark_circle_v2
        transformed.dark_circle = {
            score: data.dark_circle_v2?.ui_score || data.dark_circle?.ui_score || 0,
            level: getLevel(data.dark_circle_v2?.ui_score || data.dark_circle?.ui_score || 0)
        };

        transformed.redness = {
            score: data.redness?.ui_score || 0,
            level: getLevel(data.redness?.ui_score || 0)
        };

        transformed.oiliness = {
            score: data.oiliness?.ui_score || 0,
            level: getLevel(data.oiliness?.ui_score || 0)
        };

        transformed.age_spot = {
            score: data.age_spot?.ui_score || 0,
            level: getLevel(data.age_spot?.ui_score || 0)
        };

        transformed.droopy_upper_eyelid = {
            score: data.droopy_upper_eyelid?.ui_score || 0,
            level: getLevel(data.droopy_upper_eyelid?.ui_score || 0)
        };

        transformed.droopy_lower_eyelid = {
            score: data.droopy_lower_eyelid?.ui_score || 0,
            level: getLevel(data.droopy_lower_eyelid?.ui_score || 0)
        };
    }

    // Overall score (available in both modes)
    if (data.all?.score !== undefined) {
        transformed.overall = {
            score: data.all.score || 0,
            level: getLevel(data.all.score || 0)
        };
    }

    // Skin Age (available in both modes)
    if (data.skin_age !== undefined) {
        transformed.skin_age = {
            age: data.skin_age || 0,
            display: data.skin_age ? `${data.skin_age} years` : "N/A"
        };
    }

    console.log("\n✅ Transformed response:", transformed);

    // Warn if all scores are zero
    const allZero = Object.values(transformed).every(metric => metric.score === 0);
    if (allZero) {
        console.warn("⚠️ WARNING: All scores are 0! This likely means the API response structure doesn't match expectations.");
        console.warn("💡 Check the field existence check above and compare with the full data structure.");
    }

    console.log("🔍 ===== TRANSFORM DEBUG END =====\n");
    return transformed;
}

/**
 * Convert numeric score to text level
 */
function getLevel(score) {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    if (score >= 20) return "Poor";
    return "Very Poor";
}
