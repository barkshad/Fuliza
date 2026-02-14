
// Cloudinary Configuration
const CLOUD_NAME = "ds2mbrzcn"; 
const API_KEY = "PLACEHOLDER_API_KEY"; 
const API_SECRET = "PLACEHOLDER_API_SECRET"; 

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "real_unsigned");
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
      throw new Error("Failed to upload image. Please try again.");
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
  // Sort keys and join
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;
  
  const msgBuffer = new TextEncoder().encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadMasterRecord(csvContent: string): Promise<string> {
  // If API credentials are not set (default), return a mock URL for demo purposes
  if (API_KEY === "PLACEHOLDER_API_KEY") {
    console.warn("Cloudinary API Key/Secret missing. Simulating master record sync.");
    return "https://res.cloudinary.com/ds2mbrzcn/raw/upload/v1/master_user_list.csv";
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Params to be signed (excluding resource_type and file)
  const signParams = {
    public_id: "master_user_list",
    overwrite: "true",
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
