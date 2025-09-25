
import {BlacklistedTokens , User} from '../DB/Models/index.js'
import { verifyToken } from '../Utils/index.js'


export const authenticationMiddle = async (req,res,next)=>{

      const {authorization:accesstoken} = req.headers
      if(!accesstoken) return res.status(400).json({message:"Access token is required"})

      // Split the bearer token
      const [ _ , originalToken] = accesstoken.split(' ')  

      // Verify the token
      const decodedPayload = verifyToken(originalToken , process.env.JWT_ACCESS_SECRET)
      if(!decodedPayload._id) return res.status(400).json({message:"Invalid token payload"})

      // check if token is revoked
      const isTokenRevoked = await BlacklistedTokens.findOne({tokenId: decodedPayload.jti})
      if(isTokenRevoked) return res.status(400).json({message:"Token is revoked"})

      // Find user
      const user  = await User.findById(decodedPayload._id, '-password')      
      if(!user) return res.status(400).json({message:"User not found "})

      // Set user and token in req
      req.loggedInUser = { user , token:{tokenId: decodedPayload.jti , expiredAt: decodedPayload.exp}}

      next()
}