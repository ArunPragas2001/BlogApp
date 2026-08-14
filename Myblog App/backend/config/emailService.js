import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "blogapp.notifications@gmail.com",
    pass: process.env.EMAIL_PASS || "sample_pass"
  }
});

export const sendNewBlogNotification = async (blogTitle, authorName, recipientEmail) => {
  try {
    const mailOptions = {
      from: `"BlogSphere Notifications" <${process.env.EMAIL_USER || "blogapp.notifications@gmail.com"}>`,
      to: recipientEmail,
      subject: `🎉 New Blog Published: ${blogTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1E293B;">
          <h2 style="color: #4F46E5;">New Blog Story on BlogSphere</h2>
          <p>Hi there!</p>
          <p>A new story titled <strong>"${blogTitle}"</strong> was just published by <strong>${authorName}</strong>.</p>
          <p>Head over to <a href="http://localhost:5000">BlogSphere</a> to read the latest post!</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email notification sent:", info.messageId);
  } catch (error) {
    console.log("Email service notification info:", error.message);
  }
};
