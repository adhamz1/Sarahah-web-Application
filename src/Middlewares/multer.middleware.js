
import multer from "multer"
import fs from 'node:fs'
import { extensions, fileTypes } from "../Common/Contants/file.constant.js"

function createFolder(path){
    fs.mkdirSync(path , {recursive:true})
}

export const LocalUpload = ({
    path = 'samples',
    limits={}
})=>{

    const storage = multer.diskStorage({
        destination:(req,file , cb)=>{
            console.log(file);
            
            const destination = `uploads/${path}`
            createFolder(destination)
            cb(null  , destination  )
        },
        filename:(req,file , cb)=>{
        
            const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9)

            cb(null ,`${uniqueSuffix}__${file.originalname}`)
        }
    })


    const fileFilter = (req,file,cb)=>{

                
        const [ type , fileExtension] = file.mimetype.split('/')
        if(! fileTypes[type.toUpperCase()]) return cb(new Error('Invalid file type') , false)

        const allowedExtensions = extensions[type]
        if(! allowedExtensions.includes(fileExtension)) return cb(new Error('Invalid file extension') , false)

        cb(null , true)
    }

    return multer({fileFilter ,storage , limits})
}

export const HostUpload = (
    limits={}
)=>{

    
    const storage = multer.diskStorage({
        filename:(req,file , cb)=>{
            const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9)

            cb(null ,`${uniqueSuffix}__${file.originalname}`)
        }
    })

    const fileFilter = (req,file,cb)=>{

        const [ type , fileExtension] = file.mimetype.split('/')
        if(! fileTypes[type.toUpperCase()]) return cb(new Error('Invalid file type') , false)

        const allowedExtensions = extensions[type]
        if(! allowedExtensions.includes(fileExtension)) return cb(new Error('Invalid file extension') , false)

        cb(null , true)
    }

    return multer({fileFilter ,storage , limits})
}