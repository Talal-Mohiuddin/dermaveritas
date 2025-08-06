import nodemailer from "nodemailer";
import crypto from "crypto";

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Send verification email
export const sendVerificationEmail = async (user, verificationToken) => {
  try {
    const transporter = createTransporter();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Verify Your Email - DermaVeritas",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Welcome to DermaVeritas!</h1>
            <p style="color: #666; font-size: 16px;">Thank you for registering with us.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Hi ${user.name},<br><br>
              To complete your registration and access your account, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #ff6b6b; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-bottom: 10px;">Important:</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>This verification link will expire in 24 hours</li>
              <li>You must verify your email to access your account</li>
              <li>If you didn't create this account, please ignore this email</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 14px;">
              Best regards,<br>
              The DermaVeritas Team
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset Your Password - DermaVeritas",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Password Reset Request</h1>
            <p style="color: #666; font-size: 16px;">We received a request to reset your password.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Hi ${user.name},<br><br>
              You requested to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #ff6b6b; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-bottom: 10px;">Important:</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>This reset link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password will remain unchanged if you don't use this link</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 14px;">
              Best regards,<br>
              The DermaVeritas Team
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send contact form email
export const sendContactFormEmail = async (contactData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission - ${
        contactData.service || "General Inquiry"
      }`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">New Contact Form Submission</h1>
            <p style="color: #666; font-size: 16px;">A new inquiry has been submitted through the website.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">Contact Details</h2>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #333;">Name:</strong>
              <p style="color: #666; margin: 5px 0;">${contactData.name}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #333;">Email:</strong>
              <p style="color: #666; margin: 5px 0;">${contactData.email}</p>
            </div>
            
            ${
              contactData.phone
                ? `
            <div style="margin-bottom: 20px;">
              <strong style="color: #333;">Phone:</strong>
              <p style="color: #666; margin: 5px 0;">${contactData.phone}</p>
            </div>
            `
                : ""
            }
            
            ${
              contactData.service
                ? `
            <div style="margin-bottom: 20px;">
              <strong style="color: #333;">Service Interested In:</strong>
              <p style="color: #666; margin: 5px 0;">${contactData.service}</p>
            </div>
            `
                : ""
            }
            
            ${
              contactData.message
                ? `
            <div style="margin-bottom: 20px;">
              <strong style="color: #333;">Message:</strong>
              <p style="color: #666; margin: 5px 0; line-height: 1.6;">${contactData.message}</p>
            </div>
            `
                : ""
            }
          </div>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-bottom: 10px;">Submission Details:</h3>
            <p style="color: #155724; margin: 0;">
              Submitted on: ${new Date().toLocaleString()}<br>
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 14px;">
              This is an automated message from the DermaVeritas contact form.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `Contact form email sent for ${contactData.name} (${contactData.email})`
    );
  } catch (error) {
    console.error("Error sending contact form email:", error);
    throw new Error("Failed to send contact form email");
  }
};
