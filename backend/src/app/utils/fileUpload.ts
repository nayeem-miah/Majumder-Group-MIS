import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import os from "os";
import path from "path";
import fs from "fs";
import config from "../config";

// Serverless platforms only allow writes under the OS temp directory.
const uploadDir = path.join(os.tmpdir(), "garmentflow-uploads");
try {
    fs.mkdirSync(uploadDir, { recursive: true });
} catch (error) {
    console.error("Unable to create upload temp directory:", error);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })

const uploadToCloudinary = async (file: Express.Multer.File) => {

    // Configuration
    cloudinary.config({
        cloud_name: config.cloudinary.cloud_name,
        api_key: config.cloudinary.api_key,
        api_secret: config.cloudinary.api_secret,
    });

    // Upload an image
    const uploadResult = await cloudinary.uploader
        .upload(
            file.path, {
            public_id: file.filename,
        }
        )
        .catch((error) => {
            console.log(error);
        });
    return uploadResult;
}



export const fileUpload = {
    upload,
    uploadToCloudinary

}