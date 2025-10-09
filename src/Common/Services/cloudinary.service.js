import { v2 as cloudinaryV2 } from "cloudinary";

cloudinaryV2.config({
  cloud_name: "jnunu" ,
  api_key:"123456789" ,
  api_secret:"123456789"
});

export const UploadFileOnCloudinary = async (file, options) => {
  const result = await cloudinaryV2.uploader.upload(file, options);
  return result;
};

export const DeleteFileFromCloudinary = async (public_id) => {
  const result = await cloudinaryV2.uploader.destroy(public_id);
  return result;
};

