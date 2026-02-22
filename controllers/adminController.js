// server/controllers/adminController.js
import User from "../models/User.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";

/* ================= GET ALL USERS ================= */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE USER ROLE ================= */
export const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const allowedRoles = ["user", "manager", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= ADMIN DASHBOARD STATS (STEP E) ================= */
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await EventRegistration.countDocuments();

    const upcomingEvents = await Event.countDocuments({
      date: { $gte: new Date() },
    });

    res.json({
      totalUsers,
      totalEvents,
      totalRegistrations,
      upcomingEvents,
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ message: "Failed to load admin stats" });
  }
};
