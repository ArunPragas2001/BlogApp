/**
 * Brevo SMTP Connection Test
 * Run: node test-brevo-smtp.js
 *
 * Tests SMTP connectivity and sends a real email to a target address.
 * Edit TARGET_EMAIL below before running.
 */
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "backend", ".env") });

const TARGET_EMAIL = "pragasarun1@gmail.com"; // change to your inbox

const {
  BREVO_SMTP_HOST = "smtp-relay.brevo.com",
  BREVO_SMTP_PORT = "587",
  BREVO_SMTP_USER,
  BREVO_SMTP_KEY,
  EMAIL_FROM_NAME = "BlogSphere",
  EMAIL_FROM_ADDRESS
} = process.env;

if (!BREVO_SMTP_USER || !BREVO_SMTP_KEY) {
  console.error(
    "ERROR: BREVO_SMTP_USER and/or BREVO_SMTP_KEY are not set in .env\n" +
    "Fill them in before running this test.\n" +
    "Get the SMTP key from: https://app.brevo.com → SMTP & API → SMTP"
  );
  process.exit(1);
}

const fromAddress = EMAIL_FROM_ADDRESS || BREVO_SMTP_USER;

console.log("=================================================");
console.log("BREVO SMTP Connection & Send Test");
console.log("=================================================");
console.log(`Host     : ${BREVO_SMTP_HOST}:${BREVO_SMTP_PORT}`);
console.log(`SMTP User: ${BREVO_SMTP_USER}`);
console.log(`From     : "${EMAIL_FROM_NAME}" <${fromAddress}>`);
console.log(`To       : ${TARGET_EMAIL}`);
console.log("-------------------------------------------------");

const transporter = nodemailer.createTransport({
  host: BREVO_SMTP_HOST,
  port: parseInt(BREVO_SMTP_PORT, 10),
  secure: false,
  authMethod: "LOGIN",
  auth: { user: BREVO_SMTP_USER, pass: BREVO_SMTP_KEY },
  family: 4,
  tls: { rejectUnauthorized: false },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000
});

try {
  console.log("Step 1: Verifying SMTP connection...");
  await transporter.verify();
  console.log("✅ SMTP connection OK — credentials are valid!");

  console.log(`\nStep 2: Sending test email to ${TARGET_EMAIL}...`);
  const info = await transporter.sendMail({
    from: `"${EMAIL_FROM_NAME}" <${fromAddress}>`,
    to: TARGET_EMAIL,
    subject: "BlogSphere — Brevo SMTP Test ✅",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;">
        <h2 style="color:#4F46E5;margin:0 0 12px;">BlogSphere SMTP Test</h2>
        <p style="color:#334155;">This email confirms that your <strong>Brevo SMTP</strong> integration is working correctly.</p>
        <p style="color:#64748B;font-size:13px;">Sent at: ${new Date().toISOString()}</p>
      </div>
    `
  });

  console.log("✅ Test email sent successfully!");
  console.log("Message ID:", info.messageId);
  console.log("\n🎉 All tests passed — Brevo SMTP is ready to use in BlogSphere.");
} catch (err) {
  console.error("\n❌ SMTP Test FAILED:", err.message);
  if (err.message.includes("535") || err.message.includes("Authentication")) {
    console.error("→ Authentication error: Check BREVO_SMTP_USER and BREVO_SMTP_KEY.");
  } else if (err.message.includes("ENETUNREACH") || err.message.includes("ECONNREFUSED")) {
    console.error("→ Network error: Cannot reach smtp-relay.brevo.com. Check firewall or internet connection.");
  } else if (err.message.includes("ENOTFOUND")) {
    console.error("→ DNS error: Cannot resolve smtp-relay.brevo.com. Check internet connection.");
  }
  process.exit(1);
}
