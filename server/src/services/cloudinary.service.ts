import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

type CloudinaryResourceType = "auto" | "image" | "video" | "raw";

interface UploadToCloudinaryOptions {
    fileName?: string;
}

const sanitizeFileName = (fileName: string) => {
    return fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
};

const getExtension = (fileName?: string) => {
    if (!fileName) return "";

    const match = fileName.match(/\.[a-zA-Z0-9]+$/);

    return match ? match[0].toLowerCase() : "";
};

export const uploadToCloudinary = (
    buffer: Buffer,
    folder: string,
    resourceType: CloudinaryResourceType = "auto",
    options?: UploadToCloudinaryOptions
): Promise<{ url: string; publicId: string }> => {
    return new Promise((resolve, reject) => {
        const extension = getExtension(options?.fileName);

        const publicId =
            resourceType === "raw" && options?.fileName
                ? `${Date.now()}-${sanitizeFileName(options.fileName)}${extension}`
                : undefined;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                public_id: publicId,
                filename_override: options?.fileName,
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error || new Error("Cloudinary upload failed"));
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        Readable.from(buffer).pipe(uploadStream);
    });
};