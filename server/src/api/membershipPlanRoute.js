// src/api/membershipPlanRoute.js

import express from "express";
import MembershipPlan from "../database/schema/membershipPlans.js";
import Membership from "../database/schema/membershipSchema.js";
import MembershipApplication from "../database/schema/membershipApplicationSchema.js";
import { isAdmin, isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// This will confirm the import worked.
console.log(
  `Membership Plan Route: Middleware imported: ${
    typeof isAdmin === "function" && typeof isAuthenticated === "function"
      ? "✅"
      : "❌"
  }`
);

// Get all active membership plans (Public)
router.get("/plans", async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true });
    res.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit membership application (Requires login)
router.post("/apply", isAuthenticated, async (req, res) => {
  try {
    const { membershipPlan } = req.body;
    const userId = req.user.userId;

    const existingApplication = await MembershipApplication.findOne({
      userId,
      status: "pending",
    });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You already have a pending application" });
    }

    const application = new MembershipApplication({ ...req.body, userId });
    await application.save();
    res
      .status(201)
      .json({ message: "Application submitted successfully", application });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// --- ADMIN ROUTES ---

// Get all membership plans (Admin Only)
router.get("/admin/plans", isAdmin, async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error("Error fetching all plans:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new membership plan (Admin Only)
router.post("/admin/plans", isAdmin, async (req, res) => {
  try {
    const newPlan = new MembershipPlan(req.body);
    await newPlan.save();
    res
      .status(201)
      .json({ message: "Plan created successfully", plan: newPlan });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update membership plan (Admin Only)
router.put("/admin/plans/:id", isAdmin, async (req, res) => {
  try {
    const updatedPlan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json({ message: "Plan updated successfully", plan: updatedPlan });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete membership plan (Admin Only)
router.delete("/admin/plans/:id", isAdmin, async (req, res) => {
  try {
    const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all membership applications (Admin Only)
router.get("/admin/applications", isAdmin, async (req, res) => {
  try {
    const applications = await MembershipApplication.find()
      .populate("membershipPlan", "name")
      .populate("userId", "fullName email")
      .sort({ appliedDate: -1 });
    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Process membership application (Admin Only)
router.put("/admin/applications/:id", isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await MembershipApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = status;
    application.processedDate = new Date();
    await application.save();

    if (status === "approved") {
      // Find the plan to get its duration
      const plan = await MembershipPlan.findById(application.membershipPlan);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

      // Create or update the user's actual membership
      await Membership.findOneAndUpdate(
        { userId: application.userId },
        {
          membershipPlan: application.membershipPlan,
          applicationId: application._id,
          startDate: new Date(),
          endDate: endDate,
          isActive: true,
        },
        { upsert: true, new: true } // Creates new doc if none found
      );
    }

    res.json({ message: `Application ${status} successfully`, application });
  } catch (error) {
    console.error("Error processing application:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
