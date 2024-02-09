import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';      

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uplaadCloudinary = async (localPath) => {
    try {
        if (!localPath) return null;
        const result = await cloudinary.uploader.upload(localPath, {
            resource_type: 'auto'
        });
        console.log('File uploaded successfully ', result.url);
        return result;
    } catch (error) {
        fs.unlinkSync(localPath);
        return null;
    }
}

export default uplaadCloudinary;