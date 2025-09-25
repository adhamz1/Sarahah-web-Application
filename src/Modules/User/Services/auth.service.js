import { compareSync, hashSync } from "bcrypt";
import { customAlphabet } from "nanoid";
import { v4 } from "uuid";
import { OAuth2Client } from "google-auth-library";
import { emitter, generateToken, encrypt } from "../../../Utils/index.js";
import { ProviderEnum } from "../../../Common/enums/user.enum.js";
import { User, BlacklistedTokens } from "../../../DB/Models/index.js";
const nanoid = customAlphabet("0123456789", 5);



// Sign up
export const SignUp = async (req, res) => {
  const { firstName, lastName, email, password, age, gender, phoneNumber } =
    req.body;

  const isEmailExists = await User.findOne({ email });
  if (isEmailExists) {
    return res.status(400).json({ message: "Email already exists" });
  }
  // Encrypt for phoneNumber
  const encryptedPhoneNumebr = encrypt(phoneNumber);

  // hash password
  const hashedPassword = hashSync(password, parseInt(process.env.SALT_ROUNDS));
  const otp = nanoid();
  // hash
  const hashedOtp = hashSync(otp, parseInt(process.env.SALT_ROUNDS));

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    age,
    gender,
    phoneNumber: encryptedPhoneNumebr,
    otps: { confirm: hashedOtp },
  });

  // Send email
  emitter.emit("sendEmails", {
    to: email,
    subject: "Confirmation Email",
    message: `<h1> Your OTP is ${otp}</h1>`,
  });

  res.status(201).json({ message: "User created successfully", user });
};

// Confirm email
export const ConfirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email, isConfirmed: false });
  if (!user) {
    // return res.status(400).json({message:'User not found'})
    return next(new Error("User not found", { cause: 400 }));
  }

  const isOtpMatched = compareSync(otp, user.otps?.confirm);
  if (!isOtpMatched) {
    return res.status(400).json({ message: "Otp invalid" });
  }

  user.isConfirmed = true;
  user.otps.confirm = undefined;
  await user.save();

  res.status(200).json({ message: "User confirmed successfully" });
};

// Login
export const Login= async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, provider: ProviderEnum.LOCAL });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isPasswordMatched = compareSync(password, user.password);
  if (!isPasswordMatched) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  // Generate access token
  const accessToken = generateToken({
    payload: {
      _id: user._id,
      email: user.email,
    },
    signature: process.env.JWT_ACCESS_SECRET,
    options: {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      jwtid: v4(),
    },
  });
  // Generate refresh token
  const refreshToken = generateToken({
    payload: {
      _id: user._id,
      email: user.email,
    },
    signature: process.env.JWT_REFRESH_SECRET,
    options: {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      jwtid: v4(),
    },
  });
  res
    .status(200)
    .json({
      message: "User logged in successfully",
      accessToken,
      refreshToken,
    });
};

// Logout
export const Logout= async (req, res) => {
  const {
    token: { tokenId, expiredAt },
  } = req.loggedInUser; // Access token data
  const { jti: refreshTokenId, exp: refreshTokenExpiredAt } = req.refreshToken; // refresht token

  await BlacklistedTokens.insertMany([
    {
      tokenId,
      expiredAt,
    },
    {
      tokenId: refreshTokenId,
      expiredAt: refreshTokenExpiredAt,
    },
  ]);

  res.status(200).json({ message: "User logged out successfully" });
};

// Refresh Token
export const RefreshToken = async (req, res) => {
  const { _id, email } = req.refreshToken;

  const accessToken = generateToken({
    payload: {
      _id,
      email,
    },
    signature: process.env.JWT_ACCESS_SECRET,
    options: {
      expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN),
      jwtid: v4(),
    },
  });

  res.status(200).json({ message: "User refreshed successfully", accessToken });
};

// Sign up with google
export const SignUpWithGmail = async (req, res) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });
  const { email, given_name, family_name, email_verified, sub } =
    ticket.getPayload();

  if (!email_verified) {
    return res.status(400).json({ message: "Email not verified" });
  }

  const ifSubExists = await User.findOne({ googleSub: sub });
  if (ifSubExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    firstName: given_name,
    lastName: family_name ?? " ",
    email,
    provider: ProviderEnum.GOOGLE,
    password: hashSync(
      Math.random().toString(),
      parseInt(process.env.SALT_ROUNDS),
    ),
    isConfirmed: true,
    googleSub: sub,
  });

  const accessToken = generateToken({
    payload: {
      _id: user._id,
      email: user.email,
    },
    signature: process.env.JWT_ACCESS_SECRET,
    options: {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      jwtid: v4(),
    },
  });
  // Generate refresh token
  const refreshToken = generateToken({
    payload: {
      _id: user._id,
      email: user.email,
    },
    signature: process.env.JWT_REFRESH_SECRET,
    options: {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      jwtid: v4(),
    },
  });

  res
    .status(200)
    .json({
      message: "User signed up successfully",
      token: { accessToken, refreshToken },
    });
};

// Login with google
export const LoginWithGmail = async (req, res) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });

  const { email, given_name, family_name, email_verified, sub } =
    ticket.getPayload();
  if (!email_verified) {
    return res.status(400).json({ message: "Email not verified" });
  }
  const user = await User.findOne({
    googleSub: sub,
    provider: ProviderEnum.GOOGLE,
  });

  let loggedInUser = user;
  if (!user) {
    loggedInUser = await User.create({
      firstName: given_name,
      lastName: family_name ?? " ",
      email,
      provider: ProviderEnum.GOOGLE,
      password: hashSync(
        Math.random().toString(),
        parseInt(process.env.SALT_ROUNDS),
      ),
      isConfirmed: true,
      googleSub: sub,
    });
  }

  const accessToken = generateToken({
    payload: {
      _id: loggedInUser._id,
      email: loggedInUser.email,
    },
    signature: process.env.JWT_ACCESS_SECRET,
    options: {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      jwtid: v4(),
    },
  });
  // Generate refresh token
  const refreshToken = generateToken({
    payload: {
      _id: loggedInUser._id,
      email: loggedInUser.email,
    },
    signature: process.env.JWT_REFRESH_SECRET,
    options: {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      jwtid: v4(),
    },
  });
res
    .status(200)
    .json({
      message: "User logged in successfully",
      token: { accessToken, refreshToken },
    });
};
