import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const OWNER_EMAIL = "pragasarun1@gmail.com";
const OWNER_PASS = "arun20019048$";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "my_blog_app_secret_key_12345", {
    expiresIn: "1h"
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

export const registerUser = async (req, res) => {
  try {
    await ensureOwnerExists();

    const { name, email, password, requestedRole, profilePic } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
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
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    await ensureOwnerExists();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await bcrypt.compare(password, user.password))) {
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
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
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

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
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
