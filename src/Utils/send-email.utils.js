import nodemailer from "nodemailer";
import { EventEmitter } from "node:events";

export const sendEmail = async ({
  to,
  cc = process.env.USER_EMAIL,
  subject,
  message,
  attachments = [],
}) => {
  try {
    // Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
      tls:{
          rejectUnauthorized:false
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to,
      cc,
      subject,
      html: message,
      attachments,
    });
    return info;
  } catch (error) {
    console.log("Email not sent Error details:");
    console.log(error);
  }
};

export const emitter = new EventEmitter();

emitter.on("sendEmails", async (args) => {
  console.log("Email sent");
  await sendEmail(args);
});
