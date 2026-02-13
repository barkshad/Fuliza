
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "real_unsigned");

  try {
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/ds2mbrzcn/image/upload",
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
