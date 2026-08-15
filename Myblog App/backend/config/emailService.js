import nodemailer from "nodemailer";
import Subscriber from "../models/subscriber.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "blogapp.notifications@gmail.com",
    pass: process.env.EMAIL_PASS || "sample_pass"
  }
});

export const sendNewBlogNotification = async (blogTitle, authorName, authorEmail, category = "General", previewText = "") => {
  try {
    // Retrieve all active subscribers from database
    const subscribers = await Subscriber.find({ isActive: true });
    const subscriberEmails = subscribers.map((sub) => sub.email);

    // Also include author email if not already in list
    if (authorEmail && !subscriberEmails.includes(authorEmail.toLowerCase())) {
      subscriberEmails.push(authorEmail.toLowerCase());
    }

    if (subscriberEmails.length === 0) {
      console.log("No active subscribers found for email notification.");
      return;
    }

    const mailOptions = {
      from: `"BlogSphere" <${process.env.EMAIL_USER || "blogapp.notifications@gmail.com"}>`,
      to: subscriberEmails.join(", "),
      subject: `🎉 New Story Published on BlogSphere: "${blogTitle}"`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0; color: #0F172A;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4F46E5; font-size: 24px; margin: 0; font-weight: 800;">✨ BlogSphere</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Fresh stories for curious minds</p>
          </div>
          <div style="background: #FFFFFF; padding: 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <span style="background: #EEF2FF; color: #4F46E5; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">${category}</span>
            <h2 style="color: #0F172A; font-size: 20px; margin: 16px 0 10px; line-height: 1.3;">${blogTitle}</h2>
            <p style="color: #64748B; font-size: 14px; margin-bottom: 16px;">Written by <strong>${authorName}</strong></p>
            ${previewText ? `<p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px; background: #F1F5F9; padding: 14px; border-radius: 8px;">"${previewText}"</p>` : ''}
            <div style="text-align: center;">
              <a href="http://localhost:5000" style="display: inline-block; background: #4F46E5; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: 700; font-size: 14px;">Read Full Post on BlogSphere</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
            <p>You received this email because you subscribed to BlogSphere post notifications.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email notification sent to ${subscriberEmails.length} subscribers:`, info.messageId);
  } catch (error) {
    console.log("Email notification dispatch info:", error.message);
  }
};

