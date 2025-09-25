
import crypto from "crypto";
import fs from "node:fs";
import config from "../config.js";

const IV_LENGTH = Number(config.crypto.ivLength) || 16;
const ENCRYPTION_SECRET_KEY = config.crypto.encryptionSecretKey;

export const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_SECRET_KEY, iv);
    let encryptedData = cipher.update(text, "utf8", "hex");
    encryptedData += cipher.final("hex");
    return `${iv.toString("hex")}:${encryptedData}`; // Fixed spacing in delimiter
};

export const decrypt = (encryptedData) => {
    const [iv, encryptedText] = encryptedData.split(":");
    const binaryLikeIv = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_SECRET_KEY, binaryLikeIv);
    let decryptedData = decipher.update(encryptedText, "hex", "utf8");
    decryptedData += decipher.final("utf8");
    return decryptedData;
};

// Generate RSA key pairs if they don't exist
if (fs.existsSync("publicKey.pem") && fs.existsSync("privateKey.pem")) {
    // Keys exist
} else {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: "pkcs1",
            format: "pem"
        },
        privateKeyEncoding: {
            type: "pkcs1",
            format: "pem"
        }
    });
    fs.writeFileSync("publicKey.pem", publicKey);
    fs.writeFileSync("privateKey.pem", privateKey);
}

export const asymmetricEncrypt = (text) => { // Fixed function name
    const publicKey = fs.readFileSync('publicKey.pem', 'utf-8');
    const bufferedText = Buffer.from(text);
    const encryptedData = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, bufferedText);

    return encryptedData.toString("hex");
};

export const asymmetricDecrypt = (text) => { // Fixed function name
    const privateKey = fs.readFileSync('privateKey.pem', 'utf-8');
    const bufferedText = Buffer.from(text, 'hex');
    const decryptedData = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, bufferedText);

    return decryptedData.toString("utf-8");
};