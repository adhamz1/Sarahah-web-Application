import { BlacklistedTokens } from "../DB/Models/index.js"
import { verifyToken } from "../Utils/index.js"


export const refreshTokenVerify = async (req,res,next)=>{
    const bearer = req.headers?.authorization
    const headerToken = req.headers?.refrestoken
        || req.headers?.refreshtoken
        || req.headers?.["x-refresh-token"]
        || bearer?.replace(/^Bearer\s+/, "")
    if(!headerToken){
        return res.status(401).json({message:"Refresh token is missing"})
    }

    const data  = verifyToken(headerToken , process.env.JWT_REFRESH_SECRET)
    if(!data._id) return res.status(400).json({message:"Invalid token payload"})

    
    const isTokenRevoked = await BlacklistedTokens.findOne({ tokenId: data.jti})
    if(isTokenRevoked) return res.status(400).json({message:"Token is revoked"})

    req.refreshToken = data
    next()
}