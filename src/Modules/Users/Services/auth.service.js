import { compareSync, hashSync } from "bcrypt";
import { emitter, asymmetricEncryption , generateToken, verifyToken  } from "../../../Utils/index.js";
import { customAlphabet } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { ProviderEnum } from "../../../Common/enums/index.js";
import { OAuth2Client } from "google-auth-library";
import { User  , BlackListedTokens} from "../../../DB/Models/index.js";


const uniqueString = customAlphabet('ujefoiefpoefnjr' , 5)


export const SignUpService = async (req , res)=>{
    
        const {firstName , lastName , email , password , age , gender , phoneNumber , role} = req.body;
 
        const isEmailExists = await User.findOne({email});
        if(isEmailExists) return res.status(409).json({message : "Email already exists"});

        const isfullNameExists = await User.findOne({firstName , lastName});
        if(isfullNameExists) return res.status(409).json({message : "fullName already exists"});


        // Encrypt phone
        const encryptPhoneNumber = asymmetricEncryption(phoneNumber)


        // hash for password
        const hashedPassword = hashSync(password , +process.env.SALT_ROUNDS);
       
        const otp = uniqueString().toUpperCase()

        const user = await User.create({
            firstName , 
            lastName , 
            email , 
            password:hashedPassword , 
            age , 
            gender , 
            phoneNumber:encryptPhoneNumber , 
            otps:{confirmation: hashSync(otp , +process.env.SALT_ROUNDS)},
            role
        });

        emitter.emit('sendEmail' , {
            to : email,
            subject : 'Confirmation Email',
            content : 
            `
                Your confirmation OTP is ${otp}
            `
        })
        return res.status(201).json({message : "User created successfully" , user})
        
};

export const SignInService = async (req , res)=>{
        
            const {email , password} = req.body;
    
            const user = await User.findOne({email});
            if(!user){
                return res.status(404).json({message : "Invalid email or password"})
            }
    
            const hashPassword = user.password
            const isPasswordMatch = compareSync(password , hashPassword);
    
            if(!isPasswordMatch){
                 return res.status(404).json({message : "Invalid email or password"})
            }
    
            const device = req.headers["user-agent"]; 
            if (!user.devices) user.devices = [];
            if (!user.devices.includes(device)) {
                if (user.devices.length >= 2) {
                    return res.status(403).json({ message: "You can login from 2 devices only" });
                }
                user.devices.push(device);
                await user.save();
            }
    
            // Generate token for the loggedIn User
            const accesstoken = generateToken(
                {_id:user._id , email:user.email},
                process.env.JWT_ACCESS_SECRET,
                {
                    expiresIn : process.env.JWT_ACCESS_EXPIRES_IN, 
                    jwtid : uuidv4()
                }
            );
    
    
            // Refresh token
            const refreshtoken = generateToken(
                {_id:user._id , email:user.email},
                process.env.JWT_REFRESH_SECRET,
                {
                    
                    expiresIn : process.env.JWT_REFRESH_EXPIRES_IN, // will use it to revoke the token
                    jwtid : uuidv4()
                }
            )
    
            return res.status(200).json({message : "User signed in successfully" , accesstoken , refreshtoken})
        
};

export const ConfirmEmailService  = async(req , res)=>{
    const {email , otp} = req.body;

    const user = await User.findOne({email , isConfirmed:false});
    const userOtp  = user.otps?.confirmation
    if(!user) return res.status(400).json({message : 'User Not found or already Exites'});

    const isOtpMatched = compareSync(otp , userOtp);
    if(!isOtpMatched) return res.status(400).json({message : "Invalid OTP"});

    user.isConfirmed = true
    user.otps.confirmation = undefined

    await user.save()
    res.status(200).json({message : "Confirmed"})

};

export const LogoutService = async (req, res) => {
    // This data is now provided by the updated auth middleware
    const { token: { tokenId, expirationDate }, user: { _id } } = req.loggedInUser;

    // Add the token's ID to the denylist until it naturally expires
    await BlackListedTokens.create({
        tokenId,
        // The expiration date is important for cleanup later
        expirationDate: new Date(expirationDate * 1000), // Convert Unix timestamp to Date
        userId: _id
    });

    return res.status(200).json({ message: "User logged out successfully" });
};


export const RefreshTokensService = async (req , res)=>{
    const {refreshtoken} = req.headers

    const decodedData = verifyToken(refreshtoken , process.env.JWT_REFRESH_SECRET)


     const accesstoken = generateToken(
             {_id:decodedData._id , email:decodedData.email},
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn : process.env.JWT_ACCESS_EXPIRES_IN, 
                jwtid : uuidv4() 
            }
        );

        return res.status(200).json({message : "User token if refreshed successfully" , accesstoken})
}


export const AuthServiceWithGmail = async (req , res)=>{

    const {idToken} = req.body;
    const client = new OAuth2Client();
    const ticket = await client.verifyToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID
    });

    const {email , given_name , family_name , email_verified , sub} = ticket.getPayload()
    if(!email_verified) return res.status(400).json({message : "Email is not verified"})

    // find user with email and provider from out database
    const isUserExist = await User.findOne({googleSub:sub , provider:ProviderEnum.GOOGLE});
    let newUser ;
    if(!isUserExist){
        newUser = await User.create({
            firstName:given_name,
            lastName:family_name || ' ',
            email,
            provider:ProviderEnum.GOOGLE,
            isConfirmed:true,
            password:hashSync(uniqueString() , +process.env.SALT_ROUNDS),
            googleSub:sub
        })
    }else{
        newUser = isUserExist
        isUserExist.email = email
        isUserExist.firstName = given_name
        isUserExist.lastName = family_name || ' '
        await isUserExist.save()
    }
    // Generate token for the loggedIn User
        const accesstoken = generateToken(
            {_id:newUser._id , email:newUser.email},
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn : process.env.JWT_ACCESS_EXPIRES_IN, 
                jwtid : uuidv4()
            }
        );

        // Refresh token
        const refreshtoken = generateToken(
            {_id:newUser._id , email:newUser.email},
            process.env.JWT_REFRESH_SECRET,
            {
                
                expiresIn : process.env.JWT_REFRESH_EXPIRES_IN, 
                jwtid : uuidv4()
            }
        )
    res.status(200).json({message : "User signed up successfully" , tokens:{accesstoken , refreshtoken}})
}   

export const ForgetPasswordService = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email, provider: ProviderEnum.LOCAL });
    
    if (!user) {
        return res.status(404).json({ message: "User  Not Found" });
    }

    const otp = uniqueString();
    const otpExpired = Date.now() + 60 * 60 * 1000; // 1 hour expiration

    if (!user.otps) {
        user.otps = {};
    }
    user.otps.resetPassword = {
        code: hashSync(otp, +process.env.SALT_ROUNDS),
        expiresAt: otpExpired
    };

    await user.save();

    emitter.emit("sendEmail", {
        to: user.email,
        subject: "Reset Your Password",
        content: `<h1>Your OTP: ${otp}</h1>`
    });
    
    res.status(200).json({ message: "Reset Password OTP sent successfully to your email" });
};


export const ResetPasswordService = async (req , res)=>{

    const {email , otp , newPassword }  = req.body; 

    const user = await User.findOne({email , provider:ProviderEnum.LOCAL})
    if(!user) return res.status(404).json({message : "User Not Foun"})

    if(!user.otps?.resetPassword?.code)  return res.status(400).json({message : "OTP Not Foun"})

    if(Date.now() > user.otps.resetPassword.expiresAt) return res.status(404).json({message : "OTP Expired"})
    
    const isOtpMatched = compareSync(otp , user.otps?.resetPassword.code)
    if(!isOtpMatched) return res.status(404).json({message : "Invalid OTP"})

    const hashPassword = hashSync(newPassword , +process.env.SALT_ROUNDS)

    user.password = hashPassword

    user.otps.resetPassword = {}

    await user.save()

    return res.status(200).json({message : "Password updated successfully to your Email"})
}


export const UpdatePasswordService = async (req, res) => {
    const { _id: userId } = req.loggedInUser;
    const { oldPassword, newPassword } = req.body;

    if (oldPassword === newPassword) {
        return res.status(400).json({ message: "New password cannot be the same as the old password." });
    }

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    const isPasswordMatched = compareSync(oldPassword, user.password);

    if (!isPasswordMatched) {
        return res.status(400).json({ message: "Invalid old password." });
    }

    // Hash the new password
    const hashPassword = hashSync(newPassword, +process.env.SALT_ROUNDS);
    user.password = hashPassword;


    user.tokenVersion += 1;

    await user.save();

    return res.status(200).json({ message: "Password updated successfully. Please log in again." });
};






