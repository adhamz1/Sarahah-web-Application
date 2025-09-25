import { BlacklistedTokens } from "../DB/Models/index.js"
import { verifyToken } from "../Utils/index.js"


export const refreshTokenVerify = async (req,res,next)=>{
    const {refrestoken} = req.headers

    const data  = verifyToken(refrestoken , process.env.JWT_REFRESH_SECRET)
    if(!data._id) return res.status(400).json({message:"Invalid token payload"})

    
    const isTokenRevoked = await BlacklistedTokens.findOne({tokenId: data.jti})
    if(isTokenRevoked) return res.status(400).json({message:"Token is revoked"})

    req.refreshToken = data
    next()
}