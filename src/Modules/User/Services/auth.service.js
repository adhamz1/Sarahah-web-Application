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

// Resend Email (confirm or reset)
export const ResendEmail = async (req, res) => {
  const { type, email } = req.body
  if (!type || !email) return res.status(400).json({ message: "type and email are required" })
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: "User not found" })

  if (type === 'confirm') {
    const otp = customAlphabet("0123456789", 5)();
    const hashedOtp = hashSync(otp, parseInt(process.env.SALT_ROUNDS));
    user.otps = { ...(user.otps || {}), confirm: hashedOtp }
    await user.save()
    emitter.emit("sendEmails", {
      to: email,
      subject: "Confirmation Email",
      message: `<h1> Your OTP is ${otp}</h1>`,
    });
    return res.status(200).json({ message: "Confirmation code resent" })
  }

  if (type === 'reset') {
    const resetToken = generateToken({
      payload: { _id: user._id, email: user.email },
      signature: process.env.JWT_RESET_SECRET,
      options: { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m", jwtid: v4() },
    });
    const resetLink = `${process.env.FRONTEND_BASE_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(user.email)}`;
    emitter.emit("sendEmails", {
      to: user.email,
      subject: "Reset your password",
      message: `<p>Click the link to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
    });
    return res.status(200).json({ message: "Reset email resent" })
  }

  return res.status(400).json({ message: "Invalid type. Use 'confirm' or 'reset'" })
}

// Forgot Password: generate a reset token and send via email
export const ForgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ message: "If the email exists, a reset link has been sent" });

  const resetToken = generateToken({
    payload: { _id: user._id, email: user.email },
    signature: process.env.JWT_RESET_SECRET,
    options: { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m", jwtid: v4() },
  });

  const resetLink = `${process.env.FRONTEND_BASE_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(user.email)}`;

  emitter.emit("sendEmails", {
    to: user.email,
    subject: "Reset your password",
    message: `<p>Click the link to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
  });

  return res.status(200).json({ message: "If the email exists, a reset link has been sent" });
};

// Reset Password: verify token and set new password
export const ResetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: "Token and new password are required" });

  let payload;
  try {
    // We use verifyToken from Utils via services typically, but here use jsonwebtoken directly through our utils index
    const { verifyToken } = await import("../../../Utils/index.js");
    payload = verifyToken(token, process.env.JWT_RESET_SECRET);
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  const user = await User.findOne({ _id: payload._id, email: payload.email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = hashSync(password, parseInt(process.env.SALT_ROUNDS));
  await user.save();

  return res.status(200).json({ message: "Password reset successfully" });
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

  // Enforce at most 2 distinct devices
  const deviceId = req.headers["x-device-id"] || req.body?.deviceId || req.headers["user-agent"] || "unknown-device";
  if (!user.devices?.includes(deviceId)) {
    if ((user.devices?.length || 0) >= 2) {
      return res.status(403).json({ message: "Device limit reached. Only 2 devices allowed." });
    }
    user.devices = Array.from(new Set([...(user.devices || []), deviceId]))
    await user.save()
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

  // Enforce at most 2 distinct devices
  const deviceId = req.headers["x-device-id"] || req.body?.deviceId || req.headers["user-agent"] || "unknown-device";
  if (!loggedInUser.devices?.includes(deviceId)) {
    if ((loggedInUser.devices?.length || 0) >= 2) {
      return res.status(403).json({ message: "Device limit reached. Only 2 devices allowed." });
    }
    loggedInUser.devices = Array.from(new Set([...(loggedInUser.devices || []), deviceId]))
    await loggedInUser.save()
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
