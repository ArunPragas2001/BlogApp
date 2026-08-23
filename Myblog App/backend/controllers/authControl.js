import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@blogsphere.com";
const OWNER_PASS = process.env.OWNER_PASSWORD || "ChangeMe_Owner_2026!";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "my_blog_app_secret_key_12345", {
    expiresIn: "7d"
  });
};

const ensureOwnerExists = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(OWNER_PASS, salt);

    let owner = await User.findOne({ email: OWNER_EMAIL });
    if (!owner) {
      owner = await User.create({
        name: "Arun Pragas (Owner)",
        email: OWNER_EMAIL,
        password: hashedPassword,
        role: "owner",
        adminStatus: "approved",
        bio: "Platform Owner & Administrator"
      });
    } else {
      let needsUpdate = false;
      const isMatch = await bcrypt.compare(OWNER_PASS, owner.password);
      if (!isMatch) {
        owner.password = hashedPassword;
        needsUpdate = true;
      }
      if (owner.role !== "owner" || owner.adminStatus !== "approved") {
        owner.role = "owner";
        owner.adminStatus = "approved";
        needsUpdate = true;
      }
      if (needsUpdate) {
        await owner.save();
      }
    }
  } catch (err) {
    console.error("Owner seeding info:", err.message);
  }
};

ensureOwnerExists();

import { sendPasswordResetEmail, sendWelcomeRegistrationEmail } from "../config/emailService.js";

export const registerUser = async (req, res) => {
  try {
    await ensureOwnerExists();

    const { name, email, password, requestedRole, profilePic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Full Name is required." });
    }
    if (name.trim().length < 3) {
      return res.status(400).json({ message: "Full Name must be at least 3 characters long." });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email address is required." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "An account with this email already exists. Please log in instead." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let assignedRole = "user";
    let assignedAdminStatus = "none";

    if (normalizedEmail === OWNER_EMAIL) {
      assignedRole = "owner";
      assignedAdminStatus = "approved";
    } else if (requestedRole === "admin") {
      assignedRole = "user";
      assignedAdminStatus = "pending";
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      adminStatus: assignedAdminStatus,
      profilePic: profilePic || undefined
    });

    if (user) {
      sendWelcomeRegistrationEmail(user.name, user.email).catch((err) =>
        console.warn("Welcome email async notification error:", err.message)
      );

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminStatus: user.adminStatus,
        profilePic: user.profilePic,
        bio: user.bio,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: "Invalid user registration data." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during registration. " + error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    await ensureOwnerExists();

    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Please enter your email address." });
    }
    if (!password) {
      return res.status(400).json({ message: "Please enter your password." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address. Please register first." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been deactivated by the administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password. Please verify your credentials and try again." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminStatus: user.adminStatus,
      profilePic: user.profilePic,
      bio: user.bio,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login. " + error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Please provide your registered email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No registered account found with that email address." });
    }

    // Generate 6-digit numeric verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    await user.save();

    let emailSent = false;
    try {
      await sendPasswordResetEmail(normalizedEmail, resetCode);
      emailSent = true;
    } catch (emailError) {
      console.warn("⚠️  Password reset email delivery note:", emailError.message);
      console.log(`ℹ️  Password Reset Code for ${normalizedEmail} is active: ${resetCode}`);
    }

    res.json({
      message: emailSent
        ? "A 6-digit verification code has been sent to your email. Please check your inbox."
        : "Verification code generated! Please check your inbox (or backend console if email service is in test mode)."
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to process password recovery request. " + error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ message: "Email, verification code, and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordCode: resetCode.trim()
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or incorrect verification code." });
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "🎉 Password successfully updated! You can now log in with your new password." });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password. " + error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching user profile", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name ? req.body.name.trim() : user.name;
    user.email = req.body.email ? req.body.email.trim().toLowerCase() : user.email;
    user.profilePic = req.body.profilePic !== undefined ? req.body.profilePic : user.profilePic;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

    if (req.body.newPassword) {
      // Require old password to change to new password
      if (!req.body.oldPassword) {
        return res.status(400).json({ message: "Please provide your current password to set a new one." });
      }
      const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }
      if (req.body.newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters." });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.newPassword, salt);
    } else if (req.body.password) {
      // Legacy support: if just "password" is sent (no oldPassword check, for backwards compat during profile save without pw change)
      // Only allow if no oldPassword was sent - means user is not changing password
      // If someone sends just "password" without "oldPassword", skip it silently
      // (old behavior that auto-saves profile photo does not send oldPassword)
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      adminStatus: updatedUser.adminStatus,
      profilePic: updatedUser.profilePic,
      bio: updatedUser.bio,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

export const getPendingAdminRequests = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.email !== OWNER_EMAIL) {
      return res.status(403).json({ message: "Only the Owner can view Admin requests" });
    }

    const pendingAdmins = await User.find({ adminStatus: "pending" }).select("-password");
    res.json(pendingAdmins);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin requests", error: error.message });
  }
};

export const approveAdminRequest = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.email !== OWNER_EMAIL) {
      return res.status(403).json({ message: "Only the Owner can approve Admin requests" });
    }

    const { approve } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    if (approve) {
      targetUser.role = "admin";
      targetUser.adminStatus = "approved";
    } else {
      targetUser.role = "user";
      targetUser.adminStatus = "rejected";
    }

    const updatedUser = await targetUser.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      adminStatus: updatedUser.adminStatus
    });
  } catch (error) {
    res.status(500).json({ message: "Error processing admin request", error: error.message });
  }
};
