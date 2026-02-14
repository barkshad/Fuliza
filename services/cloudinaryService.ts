
// Cloudinary Configuration

// Safely access environment variables with fallbacks
// We check if import.meta.env exists before accessing it to prevent TypeErrors
const getEnvVar = (key: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const val = import.meta.env[key];
      if (typeof val === 'string') {
        return val;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return fallback;
};

// Access vars safely. 
// Note: process.env.VAR is replaced by Vite at build time with the actual string value, 
// so accessing it directly as a fallback is safe and recommended.
const CLOUD_NAME = getEnvVar("VITE_CLOUDINARY_CLOUD_NAME", process.env.VITE_CLOUDINARY_CLOUD_NAME || "ds2mbrzcn");
const API_KEY = getEnvVar("VITE_CLOUDINARY_API_KEY", process.env.VITE_CLOUDINARY_API_KEY || "");
const API_SECRET = getEnvVar("VITE_CLOUDINARY_API_SECRET", process.env.VITE_CLOUDINARY_API_SECRET || "");

// Upload Preset for unsigned uploads (Images)
const UPLOAD_PRESET = "real_unsigned";

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "user_docs"); 

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to upload image.");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

// Helper to generate SHA-1 signature for signed uploads (Browser-compatible)
async function generateSignature(params: Record<string, string>, apiSecret: string) {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  // Create string to sign: key=value&key2=value2...&api_secret
  const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;
  
  // Hash using SHA-1
  const msgBuffer = new TextEncoder().encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadMasterRecord(csvContent: string): Promise<string> {
  if (!API_KEY || !API_SECRET) {
    console.error("Cloudinary API Key or Secret is missing in environment variables.");
    throw new Error("Configuration Error: Missing Cloudinary Credentials");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Parameters to sign. 
  const signParams = {
    overwrite: "true",
    public_id: "master_user_list",
    timestamp: timestamp,
  };

  try {
    const signature = await generateSignature(signParams, API_SECRET);
    
    const formData = new FormData();
    formData.append("file", new Blob([csvContent], { type: 'text/csv' }), "master_user_list.csv");
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("public_id", "master_user_list");
    formData.append("overwrite", "true");
    formData.append("signature", signature);

    // Using 'raw' resource type for CSV files
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to sync master record");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Master Record Sync Error:", error);
    throw error;
  }
}
