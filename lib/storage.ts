import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = "inventory"
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result?.secure_url || "");
        }
      )
      .end(buffer);
  });
}

/**
 * Upload file to local persistent filesystem storage
 */
export async function uploadToLocalStorage(
  file: File,
  folder: string = "inventory"
): Promise<string> {
  const baseUploadDir =
    process.env.UPLOAD_DIR ||
    path.resolve(process.cwd(), "public/uploads");
  const targetDir = path.join(baseUploadDir, folder);

  // Ensure directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Generate safe unique filename
  const sanitizedOriginal = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const ext = path.extname(sanitizedOriginal) || ".bin";
  const uniqueName = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
  const filePath = path.join(targetDir, uniqueName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.promises.writeFile(filePath, buffer);

  // Return public URL path
  return `/uploads/${folder}/${uniqueName}`;
}

/**
 * Unified storage upload helper:
 * Uses Cloudinary if configured; otherwise gracefully falls back to persistent local disk storage.
 */
export async function uploadFile(
  file: File,
  folder: string = "inventory"
): Promise<string> {
  if (isCloudinaryConfigured) {
    try {
      return await uploadToCloudinary(file, folder);
    } catch (err) {
      console.warn("⚠️ Cloudinary upload failed, falling back to local persistent storage:", err);
      return await uploadToLocalStorage(file, folder);
    }
  }

  return await uploadToLocalStorage(file, folder);
}

export default {
  uploadFile,
  uploadToCloudinary,
  uploadToLocalStorage,
  isCloudinaryConfigured,
};
