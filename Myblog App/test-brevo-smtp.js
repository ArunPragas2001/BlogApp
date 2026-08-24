/**
 * BlogSphere Email Service Connection & Send Test
 * Run: node test-brevo-smtp.js
 *
 * Tests SMTP/Gmail connectivity and sends a real email to target address.
 */
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "backend", ".env") });

const TARGET_EMAIL = process.env.OWNER_EMAIL || "pragasarun1@gmail.com";

const {
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  GMAIL_PASS,
  BREVO_SMTP_HOST = "smtp-relay.brevo.com",
  BREVO_SMTP_PORT = "587",
  BREVO_SMTP_USER,
  BREVO_SMTP_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM_NAME = "BlogSphere",
  EMAIL_FROM_ADDRESS
} = process.env;

let transporter;
let providerName = "";
let fromAddress = "";

if (GMAIL_USER && (GMAIL_APP_PASSWORD || GMAIL_PASS)) {
  providerName = "Gmail (App Password)";
  const pass = GMAIL_APP_PASSWORD || GMAIL_PASS;
  fromAddress = EMAIL_FROM_ADDRESS || GMAIL_USER;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: pass.replace(/\s+/g, "") },
    family: 4
  });
} else if (BREVO_SMTP_USER && BREVO_SMTP_KEY && !BREVO_SMTP_USER.includes("example.com")) {
  providerName = "Brevo (Sendinblue) SMTP";
  fromAddress = EMAIL_FROM_ADDRESS || BREVO_SMTP_USER;
  transporter = nodemailer.createTransport({
    host: BREVO_SMTP_HOST,
    port: parseInt(BREVO_SMTP_PORT, 10),
    secure: false,
    authMethod: "LOGIN",
    auth: { user: BREVO_SMTP_USER, pass: BREVO_SMTP_KEY },
    family: 4,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000
  });
} else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  providerName = `Custom SMTP (${SMTP_HOST})`;
  fromAddress = EMAIL_FROM_ADDRESS || SMTP_USER;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    family: 4,
    tls: { rejectUnauthorized: false }
  });
} else {
  console.error("\n❌ No email credentials configured in backend/.env!");
  console.log("\nPlease choose one option in backend/.env:");
  console.log("  OPTION 1 (Gmail): Set GMAIL_USER and GMAIL_APP_PASSWORD");
  console.log("  OPTION 2 (Brevo): Set BREVO_SMTP_USER and BREVO_SMTP_KEY\n");
  process.exit(1);
}

console.log("=================================================");
console.log(`BlogSphere Email Diagnostic: ${providerName}`);
console.log("=================================================");
console.log(`From     : "${EMAIL_FROM_NAME}" <${fromAddress}>`);
console.log(`To       : ${TARGET_EMAIL}`);
console.log("-------------------------------------------------");

try {
  console.log("Step 1: Verifying credentials & connecting...");
  await transporter.verify();
  console.log(`✅ Connection established with ${providerName}!`);

  console.log(`\nStep 2: Dispatching test email to ${TARGET_EMAIL}...`);
  const info = await transporter.sendMail({
    from: `"${EMAIL_FROM_NAME}" <${fromAddress}>`,
    to: TARGET_EMAIL,
    subject: "BlogSphere — Email System Test ✅",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#F8FAFC;border-radius:14px;border:1px solid #E2E8F0;">
        <h2 style="color:#4F46E5;margin:0 0 10px;">BlogSphere Email Integration OK 🎉</h2>
        <p style="color:#334155;font-size:15px;line-height:1.5;">This email confirms that your email provider (<strong>${providerName}</strong>) is functioning properly in BlogSphere.</p>
        <p style="color:#64748B;font-size:13px;margin-top:16px;">Dispatched at: ${new Date().toISOString()}</p>
      </div>
    `
  });

  console.log("✅ Test email delivered successfully!");
  console.log("Message ID:", info.messageId);
  console.log("\n🎉 All tests passed — email service is fully operational.");
} catch (err) {
  console.error("\n❌ Email test failed:", err.message);
  if (err.message.includes("535") || err.message.includes("BadCredentials") || err.message.includes("Invalid login")) {
    console.error("→ Check your username and password/API key in backend/.env.");
    if (providerName.includes("Gmail")) {
      console.error("→ For Gmail, remember to use a 16-character Google App Password (not your personal account password).");
    }
  } else if (err.message.includes("ENETUNREACH") || err.message.includes("ECONNREFUSED")) {
    console.error("→ Network error: cannot reach mail server. Check firewall / internet connection.");
  }
  process.exit(1);
}
