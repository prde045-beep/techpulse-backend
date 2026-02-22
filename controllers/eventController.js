import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";

/* ============================= */
/* CREATE EVENT (ADMIN / MANAGER) */
/* ============================= */
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      venue,
      capacity,
      category,
      status,
      banner,
    } = req.body;

    if (!title || !description || !date || !time || !venue || !capacity) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      capacity,
      category,
      status,
      banner: banner || "",
      createdBy: req.user.id,
      certificateEnabled: false,
      certificateTemplate: null,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
};

/* ============================= */
/* GET ALL EVENTS (USER VIEW) ✅ UPDATED */
/* ============================= */
export const getEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.aggregate([
      {
        $match: { status: "Published" },
      },
      {
        $lookup: {
          from: "event_registrations",
          localField: "_id",
          foreignField: "event",
          as: "registrations",
        },
      },
      {
        $addFields: {
          registrationCount: { $size: "$registrations" },
          isRegistered: {
            $in: [userId, "$registrations.user"],
          },
        },
      },
      {
        $project: {
          registrations: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    res.status(200).json(events);
  } catch (error) {
    console.error("Get Events Error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

/* ============================= */
/* GET EVENTS WITH REGISTRATION COUNT (ADMIN) */
/* ============================= */
export const getEventsWithRegistrationCount = async (req, res) => {
  try {
    const events = await Event.aggregate([
      {
        $lookup: {
          from: "event_registrations",
          localField: "_id",
          foreignField: "event",
          as: "registrations",
        },
      },
      {
        $addFields: {
          registrationCount: { $size: "$registrations" },
        },
      },
      {
        $project: {
          registrations: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch events with count" });
  }
};

/* ============================= */
/* GET SINGLE EVENT */
/* ============================= */
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch event" });
  }
};

/* ============================= */
/* UPDATE EVENT (ADMIN / MANAGER) */
/* ============================= */
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      req.user.role !== "admin" &&
      event.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    Object.assign(event, req.body);
    await event.save();

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Failed to update event" });
  }
};

/* ============================= */
/* ENABLE / DISABLE CERTIFICATE */
/* ============================= */
export const toggleCertificate = async (req, res) => {
  try {
    const { enabled } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.certificateEnabled = Boolean(enabled);
    await event.save();

    res.status(200).json({
      message: `Certificate ${enabled ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update certificate status" });
  }
};

/* ============================= */
/* UPLOAD CERTIFICATE TEMPLATE ✅ FIXED */
/* ============================= */
export const uploadCertificateTemplate = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (
      req.user.role !== "admin" &&
      event.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Certificate template file is required",
      });
    }

    // ✅ STRICT IMAGE VALIDATION (CRITICAL)
    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Only PNG or JPG images are allowed as certificate templates",
      });
    }

    event.certificateTemplate = req.file.path;
    await event.save();

    res.status(200).json({
      message: "Certificate template uploaded successfully",
      certificateTemplate: event.certificateTemplate,
    });
  } catch (error) {
    console.error("Certificate upload error:", error);
    res.status(500).json({
      message: "Failed to upload certificate template",
    });
  }
};

/* ============================= */
/* DELETE EVENT */
/* ============================= */
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      req.user.role !== "admin" &&
      event.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await event.deleteOne();
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete event" });
  }
};
