import mongoose from "mongoose"

const blacklistedTokensSchema = new mongoose.Schema({
    tokenId: { type: String, required: true, unique:true },
    expiredAt:{type:Date , required:true}
})

export const BlacklistedTokens = mongoose.model('BlacklistedTokens', blacklistedTokensSchema)

 