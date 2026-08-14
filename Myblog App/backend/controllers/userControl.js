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
