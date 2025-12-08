const API_KEY = import.meta.env.VITE_FACEPP_API_KEY;
const API_SECRET = import.meta.env.VITE_FACEPP_API_SECRET;
const API_URL = "https://api-us.faceplusplus.com/facepp/v3/detect";

export const facePlusPlusService = {
    detectFace: async (imageBase64) => {
        if (!API_KEY || !API_SECRET) {
            console.warn("Face++ Credentials missing");
            return { error: "Missing Credentials" };
        }

        const formData = new FormData();
        formData.append("api_key", API_KEY);
        formData.append("api_secret", API_SECRET);
        formData.append("image_base64", imageBase64);
        formData.append("return_attributes", "gender,age,smiling,headpose,facequality,blur,eyestatus,emotion,beauty,mouthstatus,eyegaze,skinstatus");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Face++ Error:", error);
            throw error;
        }
    },

    compare: async (faceToken1, imageBase64_2) => {
        if (!API_KEY || !API_SECRET) {
            return { error: "Missing Credentials" };
        }

        const formData = new FormData();
        formData.append("api_key", API_KEY);
        formData.append("api_secret", API_SECRET);
        formData.append("face_token1", faceToken1);
        formData.append("image_base64_2", imageBase64_2);

        try {
            const response = await fetch("https://api-us.faceplusplus.com/facepp/v3/compare", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Face++ Compare Error:", error);
            throw error;
        }
    }
};
