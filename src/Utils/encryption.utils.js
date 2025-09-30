import crypto from "crypto";
import fs from "node:fs";

// Ensure a 32-byte key for aes-256 by deriving from the provided secret using SHA-256
const ENCRYPTION_SECRET_KEY = crypto
  .createHash("sha256")
  .update(String(process.env.ENCRYPTION_SECRET_KEY || ""), "utf8")
  .digest();
// IV length for aes-256-cbc must be 16 bytes. Fallback to 16 if not provided/invalid
const IV_LENGTH = parseInt(process.env.IV_LENGTH, 10) || 16;


export const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_SECRET_KEY, iv)
    let encryptedData = cipher.update(text, "utf8", "hex")
    encryptedData += cipher.final("hex");
    return `${iv.toString("hex")} : ${encryptedData}`
}

export const decrypt = (encryptedData) => {
    const [iv, encryptedText] = encryptedData.split(":").map((s) => s.trim())
    const binaryLikeiv = Buffer.from(iv,'hex')
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_SECRET_KEY, binaryLikeiv)
    let decryptedData = decipher.update(encryptedText, "hex", "utf8")
    decryptedData += decipher.final("utf8");
    return decryptedData
}



if ( fs.existsSync("publicKey.pem") && fs.existsSync("privateKey.pem")) {
    
}else{
    const {publicKey,privateKey} = crypto.generateKeyPairSync("rsa",{
        modulusLength:2048,
        publicKeyEncoding:{
            type:"pkcs1",
            format:"pem"
        },
        privateKeyEncoding:{
            type:"pkcs1",
            format:"pem"
        }
    })
    fs.writeFileSync("publicKey.pem",publicKey)
    fs.writeFileSync("privateKey.pem",privateKey)
}

export const asymmtetricEncrypt = (text) => {
    const publicKey = fs.readFileSync('publicKey.pem','utf-8')
    const bufferedText = Buffer.from(text)
    const encryptedData = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, bufferedText)

    return encryptedData.toString("hex")
}



export const asymmtetricDecrypt = (text) => {
    const privateKey = fs.readFileSync('privateKey.pem','utf-8')
    const bufferedText = Buffer.from(text,'hex')
    const encryptedData = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, bufferedText)

    return encryptedData.toString("utf-8")
}