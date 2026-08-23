import nodemailer from "nodemailer";
import Subscriber from "../models/subscriber.js";
import dotenv from "dotenv";

dotenv.config();

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "https://blogsphere-wtrv.onrender.com").replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Multi-Provider Email Configuration
// Supported Providers:
//   1. Gmail App Password:
//      GMAIL_USER=your_email@gmail.com
//      GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  (16-char Google App Password)
//
//   2. Brevo (Sendinblue) SMTP:
//      BREVO_SMTP_USER=your_brevo_account_email@example.com
//      BREVO_SMTP_KEY=your_brevo_smtp_key
//      BREVO_SMTP_HOST=smtp-relay.brevo.com (optional, defaults to smtp-relay.brevo.com)
//      BREVO_SMTP_PORT=587 (optional, defaults to 587)
//
//   3. Standard / Custom SMTP:
//      SMTP_HOST=smtp.yourhost.com
//      SMTP_PORT=587 (or 465)
//      SMTP_USER=your_user
//      SMTP_PASS=your_password
//      SMTP_SECURE=false (or true for port 465)
// ---------------------------------------------------------------------------

function getEmailConfig() {
  const fromName = process.env.EMAIL_FROM_NAME || "BlogSphere";

  // Check Provider 1: Gmail
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS;
  if (gmailUser && gmailPass) {
    return {
      type: "gmail",
      user: gmailUser.trim(),
      pass: gmailPass.trim(),
      fromName,
      fromAddress: process.env.EMAIL_FROM_ADDRESS || gmailUser.trim()
    };
  }

  // Check Provider 2: Brevo SMTP
  const brevoUser = process.env.BREVO_SMTP_USER;
  const brevoPass = process.env.BREVO_SMTP_KEY;
  if (brevoUser && brevoPass && !brevoUser.includes("example.com") && !brevoPass.includes("your_brevo")) {
    return {
      type: "brevo",
      user: brevoUser.trim(),
      pass: brevoPass.trim(),
      host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.BREVO_SMTP_PORT || "587", 10),
      fromName,
      fromAddress: process.env.EMAIL_FROM_ADDRESS || brevoUser.trim()
    };
  }

  // Check Provider 3: Custom / Generic SMTP
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    return {
      type: "smtp",
      host: smtpHost.trim(),
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      fromName,
      fromAddress: process.env.EMAIL_FROM_ADDRESS || smtpUser.trim()
    };
  }

  return null;
}

const getTransporter = () => {
  const config = getEmailConfig();
  if (!config) return null;

  if (config.type === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.user,
        pass: config.pass
      },
      family: 4
    });
  }

  if (config.type === "brevo") {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: false,           // STARTTLS on port 587
      authMethod: "LOGIN",
      auth: { user: config.user, pass: config.pass },
      family: 4,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    });
  }

  // Standard SMTP
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    family: 4,
    tls: {
      rejectUnauthorized: false
    }
  });
};

async function sendEmail(mailOptions) {
  const config = getEmailConfig();
  if (!config) {
    console.warn("ℹ️  No external email credentials configured in .env. Logging email details in console instead.");
    return null;
  }

  const transporter = getTransporter();
  if (!transporter) return null;

  const from = `"${config.fromName}" <${config.fromAddress}>`;

  const info = await transporter.sendMail({
    from,
    ...mailOptions
  });

  return info;
}

export const sendWelcomeRegistrationEmail = async (name, email) => {
  try {
    const info = await sendEmail({
      to: email,
      subject: "Welcome to BlogSphere! 🎉",
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0; color: #0F172A;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4F46E5; font-size: 26px; margin: 0; font-weight: 800;">BlogSphere</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Where Ideas Meet Curious Minds</p>
          </div>
          <div style="background: #FFFFFF; padding: 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <div style="font-size: 40px; margin-bottom: 12px;">👋</div>
            <h2 style="color: #0F172A; font-size: 20px; margin: 0 0 12px;">Welcome, ${name}!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              Your BlogSphere account has been successfully created. You can now publish articles, share insights, and engage with our global creator community.
            </p>
            <a href="${getFrontendUrl()}/login.html" style="display: inline-block; background: #4F46E5; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: 700; font-size: 14px;">Go to Dashboard</a>
          </div>
        </div>
      `
    });

    if (info) {
      console.log(`✅ Welcome registration email sent to ${email}:`, info.messageId);
    }
    return true;
  } catch (error) {
    console.warn("Welcome registration email dispatch notice:", error.message);
    return false;
  }
};

export const sendWelcomeSubscriptionEmail = async (email) => {
  try {
    const info = await sendEmail({
      to: email,
      subject: "Welcome to BlogSphere Stories! 💌",
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0; color: #0F172A;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4F46E5; font-size: 26px; margin: 0; font-weight: 800;">BlogSphere</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Welcome to our vibrant writer & reader community</p>
          </div>
          <div style="background: #FFFFFF; padding: 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <div style="font-size: 40px; margin-bottom: 12px;">💌</div>
            <h2 style="color: #0F172A; font-size: 20px; margin: 0 0 12px;">You're now Subscribed!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for joining our community. Whenever our top authors publish fresh insights on Technology, Programming, Politics, and Education, you'll be the first to know!
            </p>
            <a href="${getFrontendUrl()}" style="display: inline-block; background: #4F46E5; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: 700; font-size: 14px;">Explore Latest Stories</a>
          </div>
        </div>
      `
    });

    if (info) {
      console.log(`✅ Welcome email sent to subscriber ${email}:`, info.messageId);
    }
    return true;
  } catch (error) {
    console.warn("Welcome subscription email dispatch notice:", error.message);
    return false;
  }
};

export const sendPasswordResetEmail = async (email, resetCode) => {
  console.log("\n==========================================================");
  console.log(`🔐 [BLOGSPHERE PASSWORD RECOVERY CODE]`);
  console.log(`👤 Target User: ${email}`);
  console.log(`🔑 Verification Code: ${resetCode}`);
  console.log(`⏳ Valid For: 15 Minutes`);
  console.log("==========================================================\n");

  try {
    const info = await sendEmail({
      to: email,
      subject: "BlogSphere Password Reset Verification Code",
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0; color: #0F172A;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4F46E5; font-size: 26px; margin: 0; font-weight: 800;">BlogSphere</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Account Security & Recovery</p>
          </div>
          <div style="background: #FFFFFF; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <h2 style="color: #0F172A; font-size: 20px; margin: 0 0 10px;">Password Reset Request</h2>
            <p style="color: #64748B; font-size: 14px; margin-bottom: 24px;">Use the 6-digit verification code below to reset your BlogSphere password. This code will expire in 15 minutes.</p>
            <div style="background: #EEF2FF; border: 2px dashed #6366F1; border-radius: 12px; padding: 18px; display: inline-block; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4F46E5;">${resetCode}</span>
            </div>
            <p style="color: #94A3B8; font-size: 13px; margin: 0;">If you did not request this password reset, please ignore this email.</p>
          </div>
        </div>
      `
    });

    if (info) {
      console.log(`✅ Password reset code email delivered to ${email}:`, info.messageId);
    }
    return true;
  } catch (error) {
    console.error("Password reset email dispatch error:", error.message);
    throw error;
  }
};

export const sendNewBlogNotification = async (blogTitle, authorName, authorEmail, category = "General", previewText = "") => {
  try {
    const subscribers = await Subscriber.find({ isActive: true });
    const subscriberEmails = subscribers.map((sub) => sub.email);

    if (authorEmail && !subscriberEmails.includes(authorEmail.toLowerCase())) {
      subscriberEmails.push(authorEmail.toLowerCase());
    }

    if (subscriberEmails.length === 0) {
      console.log("No active subscribers found for email notification.");
      return;
    }

    const config = getEmailConfig();
    const senderAddress = config ? config.fromAddress : "noreply@blogsphere.com";

    const info = await sendEmail({
      to: senderAddress,
      bcc: subscriberEmails.join(", "),
      subject: `New Story Published on BlogSphere: "${blogTitle}"`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0; color: #0F172A;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4F46E5; font-size: 24px; margin: 0; font-weight: 800;">BlogSphere</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Fresh stories for curious minds</p>
          </div>
          <div style="background: #FFFFFF; padding: 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <span style="background: #EEF2FF; color: #4F46E5; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">${category}</span>
            <h2 style="color: #0F172A; font-size: 20px; margin: 16px 0 10px; line-height: 1.3;">${blogTitle}</h2>
            <p style="color: #64748B; font-size: 14px; margin-bottom: 16px;">Written by <strong>${authorName}</strong></p>
            ${previewText ? `<p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px; background: #F1F5F9; padding: 14px; border-radius: 8px;">"${previewText}"</p>` : ""}
            <div style="text-align: center;">
              <a href="${getFrontendUrl()}" style="display: inline-block; background: #4F46E5; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: 700; font-size: 14px;">Read Full Post on BlogSphere</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
            <p>You received this email because you subscribed to BlogSphere post notifications.</p>
          </div>
        </div>
      `
    });

    if (info) {
      console.log(`✅ Email notification sent to ${subscriberEmails.length} subscribers:`, info.messageId);
    }
  } catch (error) {
    console.error("Email notification dispatch error:", error.message);
  }
};
