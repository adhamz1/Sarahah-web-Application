
import jwt from 'jsonwebtoken'


// Generate token
export const generateToken =({
    payload,
    signature,
    options
})=>{
    const effectiveSecret = signature || process.env.JWT_SECRET_ACCESS
    if (!effectiveSecret) {
        throw new Error(
            'JWT secret is missing. Provide a signature to generateToken or set JWT_ACCESS_SECRET/JWT_REFRESH_SECRET at the call site, or set a fallback JWT_SECRET in environment.'
        )
    }
    return jwt.sign(payload , effectiveSecret  , options)
}

// Verify token
export const verifyToken = (token , signature)=>{
    const effectiveSecret = signature || process.env.JWT_SECRET_ACCESS
    if (!effectiveSecret) {
        throw new Error(
            'JWT secret is missing. Provide a signature to generateToken or set JWT_ACCESS_SECRET/JWT_REFRESH_SECRET at the call site, or set a fallback JWT_SECRET in environment.'
        )
    }
    if (!token) {
        throw new Error('JWT token is missing')
    }
    const normalized = String(token).trim().startsWith('Bearer ')
        ? String(token).trim().slice(7).trim()
        : String(token).trim()
    if (!normalized) {
        throw new Error('JWT token is empty')
    }
    return jwt.verify(normalized , effectiveSecret)
}
