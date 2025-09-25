    import { v2 as cloudinary } from 'cloudinary'

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    })

    export const UploadFileToCloudinary = async (file,options) => {
        const result = await cloudinary.uploader.upload(file.path, options)
        return result
    }

    export const UploadFilesToCloudinary = async (files,options) => {
        let result=[]
        for (const file of files) {
        const uploadedFile = await  UploadFileToCloudinary(file,options)
        result.push(uploadedFile)
        }
        return result
    }

    export const DeleteFileByPublicId = async (public_id) => {
    const result  =  await cloudinary.uploader.destroy(public_id) // ''
    return result
    }

    export const DeleteFilesByPublicIds = async (public_ids) => {
        const result  =  await cloudinary.api.delete_resources(public_ids) // []
        return result
    }

    export const CleanUpResourcesByPrefix = async (prefix) => {
        const result  =  await cloudinary.api.delete_resources_by_prefix(prefix)
        return result
    }

    // delete folder
    export  const DeleteFolder = async (folder) => {
        await CleanUpResourcesByPrefix(folder)
        const result  =  await cloudinary.api.delete_folder(folder)
        return result
    }