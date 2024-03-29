import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localPath) => {
  try {
    if (!localPath) return null;
    const result = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localPath);
    return result;
  } catch (error) {
    fs.unlinkSync(localPath);
    throw new Error(error?.message);
  }
};

const removeFileFromCloudinary = async (cloudinaryPath, resourceType = "") => {
  try {
    if (!cloudinaryPath) return null;
    const splitUrl = cloudinaryPath.split("/");
    const publicId = splitUrl[splitUrl.length - 1].split(".")[0];
    let result;
    if (resourceType !== "") {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
      });
    }
    result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(error?.message);
  }
};

export { uploadCloudinary, removeFileFromCloudinary };
