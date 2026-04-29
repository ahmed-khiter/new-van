import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sanitizeFileName } from "./helper";

/**
 * Generate a signed URL for uploading files to AWS S3.
 * @param {string} filePath - The path or key of the file in the S3 bucket.
 * @returns {Promise<string>} - A promise that resolves to the signed URL.
 */

export const getS3Client = () => {
    return new S3Client({
        region: process.env.S3_REGION,
        credentials: {
            accessKeyId: process.env.S3_KEY,
            secretAccessKey: process.env.S3_SECRET,
        },
        requestHandler: {
            requestTimeout: 60000, // 60 seconds
            connectionTimeout: 10000, // 10 seconds
        },
    });
};

export const uploadFileToS3 = async (file, returnType = "filePath") => {
    const s3Client = getS3Client();

    if (!file || !(file instanceof File)) return null;
    if (file.size === 0) throw new Error("Cannot upload empty file");

    if (!process.env.S3_BUCKET || !process.env.NEXT_PUBLIC_AWS_BASE_URL) {
        throw new Error("Missing S3 configuration in environment variables");
    }

    try {
        const safeName = sanitizeFileName(file.name);
        const uploadedName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
        const fileUrl = `${process.env.NEXT_PUBLIC_AWS_BASE_URL}${uploadedName}`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: uploadedName,
                Body: fileBuffer,
                ContentType: file.type,
            })
        );

        return returnType === "fileUrl" ? fileUrl : uploadedName;
    } catch (err) {
        throw new Error(`Failed to upload file: ${file.name} - ${err.message}`);
    }
};


export async function deleteFileFromS3(filePath) {
    const s3Client = getS3Client();

    const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: filePath,
    });

    try {
        await s3Client.send(command);
        console.log("File deleted from S3:", filePath);
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        throw error;
    }
}


