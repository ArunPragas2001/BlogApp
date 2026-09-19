import User from "../models/user.js";

export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only Owner and Admin can view all users" });
    }
    const users = await User.find({ role: { $ne: "owner" } }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only Owner can block/unblock users" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `User successfully ${user.isBlocked ? "blocked" : "unblocked"}`, user });
  } catch (error) {
    res.status(500).json({ message: "Error toggling block status", error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only the Platform Owner can change user roles and promote administrators" });
    }
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified. Allowed roles: 'user', 'admin'" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === "owner" || targetUser.email === "pragasarun1@gmail.com") {
      return res.status(400).json({ message: "Cannot modify Owner account role" });
    }

    targetUser.role = role;
    targetUser.adminStatus = role === "admin" ? "approved" : "none";
    await targetUser.save();

    res.json({
      message: `User ${targetUser.name} is now a ${role === "admin" ? "🛡️ Administrator" : "✍️ Normal Blogger"}!`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        adminStatus: targetUser.adminStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating user role", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only Owner can delete users" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User completely removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};


