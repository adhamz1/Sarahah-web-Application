
import jwt from 'jsonwebtoken'


// Generate token
export const generateToken =({
    payload,
    signature,
    options
})=>{
    return jwt.sign(payload , signature  , options)
}

// Verify token
export const verifyToken = (token , signature)=>{
    return jwt.verify(token , signature)
}