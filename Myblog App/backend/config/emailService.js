import nodemailer from "nodemailer";
import Subscriber from "../models/subscriber.js";
import dotenv from "dotenv";

dotenv.config();

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "https://blogsphere-wtrv.onrender.com").replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Brevo (formerly Sendinblue) SMTP configuration
// Required environment variables:
//   BREVO_SMTP_HOST   — smtp-relay.brevo.com
//   BREVO_SMTP_PORT   — 587
//   BREVO_SMTP_USER   — your Brevo account login email
//   BREVO_SMTP_KEY    — the SMTP key from Brevo dashboard (not your account password)
//   EMAIL_FROM_NAME   — optional display name, defaults to "BlogSphere"
//   EMAIL_FROM_ADDRESS — verified sender email in Brevo
// ---------------------------------------------------------------------------

function getEmailConfig() {
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_KEY;
  const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const port = parseInt(process.env.BREVO_SMTP_PORT || "587", 10);
  const fromName = process.env.EMAIL_FROM_NAME || "BlogSphere";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || user;

  if (!user || !pass) {
    console.warn(
      "⚠️  Email service is not configured. Set BREVO_SMTP_USER and BREVO_SMTP_KEY in .env (or Render environment variables)."
    );
    return null;
  }

  return { user, pass, host, port, fromName, fromAddress };
}

const getTransporter = () => {
  const config = getEmailConfig();
  if (!config) return null;

  const { user, pass, host, port } = config;

  return nodemailer.createTransport({
    host,
    port,
    secure: false,           // STARTTLS on port 587
    authMethod: "LOGIN",     // Brevo requires LOGIN (not PLAIN)
    auth: { user, pass },
    family: 4,               // force IPv4 — avoids ENETUNREACH on IPv6-only paths
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });
};

async function sendEmail(mailOptions) {
  const config = getEmailConfig();
  if (!config) {
    console.warn("Skipping email dispatch: BREVO_SMTP_USER and BREVO_SMTP_KEY are not configured.");
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
      console.log(`Welcome registration email sent to ${email}:`, info.messageId);
    }
    return true;
  } catch (error) {
    console.error("Welcome registration email dispatch warning:", error.message);
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
      console.log(`Welcome email sent to subscriber ${email}:`, info.messageId);
    }
    return true;
  } catch (error) {
    console.error("Welcome subscription email dispatch warning:", error.message);
    return false;
  }
};

export const sendPasswordResetEmail = async (email, resetCode) => {
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
      console.log(`Password reset code email sent to ${email}:`, info.messageId);
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
      console.log(`Email notification sent to ${subscriberEmails.length} subscribers:`, info.messageId);
    }
  } catch (error) {
    console.error("Email notification dispatch error:", error.message);
  }
};
