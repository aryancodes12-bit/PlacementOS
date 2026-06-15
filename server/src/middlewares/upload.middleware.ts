import multer from "multer";

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
            "audio/mpeg",
            "audio/mp3",
            "audio/mp4",
            "audio/wav",
            "audio/webm",
            "audio/ogg",
            "audio/x-m4a",
            "video/mp4",
            "video/webm",
            "application/octet-stream",
        ];

        const allowedExtensions = /\.(mp3|mp4|wav|webm|ogg|m4a)$/i;

        if (
            allowedMimeTypes.includes(file.mimetype) ||
            allowedExtensions.test(file.originalname)
        ) {
            cb(null, true);
            return;
        }

        cb(new Error("Only audio or video files are allowed"));
    },
});