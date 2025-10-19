// // routes/membership.js
// import express from "express";
// import mongoose from "mongoose";
// import MembershipPlan from "../database/schema/membershipPlans.js";
// import Membership from "../database/schema/membershipSchema.js";
// import auth from "../middleware/auth.js";
// import MembershipApplication from "../database/schema/membershipApplicationschema.js";

// const router = express.Router();

// // --- PUBLIC ROUTES ---

// // Get all active membership plans (public)
// router.get("/plans", async (req, res) => {
//   try {
//     const plans = await MembershipPlan.find({ isActive: true });
//     res.json(plans);
//   } catch (error) {
//     console.error("Error fetching membership plans:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // --- AUTHENTICATED USER ROUTES ---

// // Submit membership application
// router.post("/apply", auth.isAuthenticated, async (req, res) => {
//   try {
//     const { firstName, lastName, email, phone, address, membershipPlan } =
//       req.body;

//     if (!req.user || (!req.user.userId && !req.user._id)) {
//       return res
//         .status(401)
//         .json({ message: "Authentication issue: User ID not found in token" });
//     }

//     const userId = req.user._id || req.user.userId;

//     const existingApplication = await MembershipApplication.findOne({
//       userId: userId,
//       status: "pending",
//     });

//     if (existingApplication) {
//       return res
//         .status(400)
//         .json({ message: "You already have a pending membership application" });
//     }

//     const application = new MembershipApplication({
//       firstName,
//       lastName,
//       email,
//       phone,
//       address,
//       membershipPlan,
//       userId: userId,
//       status: "pending",
//       appliedDate: new Date(),
//     });

//     await application.save();

//     res.status(201).json({
//       message: "Membership application submitted successfully",
//       applicationId: application._id,
//     });
//   } catch (error) {
//     console.error("Error submitting membership application:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Get current user's membership details
// // FIX: This route has been moved to the correct top-level scope.
// router.get("/user-details", auth.isAuthenticated, async (req, res) => {
//   try {
//     const userId = req.user._id || req.user.userId;

//     const membership = await Membership.findOne({
//       userId: userId,
//       isActive: true,
//     }).populate("membershipPlan");

//     if (!membership) {
//       return res.status(404).json({ message: "No active membership found" });
//     }

//     const now = new Date();
//     if (membership.endDate < now) {
//       membership.isActive = false;
//       await membership.save();
//       return res
//         .status(404)
//         .json({ message: "Your membership has expired", expired: true });
//     }

//     const today = new Date();
//     const lastReset = new Date(
//       membership.lastResetDate || membership.startDate
//     );
//     if (
//       today.getMonth() !== lastReset.getMonth() ||
//       today.getFullYear() !== lastReset.getFullYear()
//     ) {
//       membership.booksRentedThisMonth = 0;
//       membership.lastResetDate = today;
//       await membership.save();
//     }

//     res.json(membership);
//   } catch (error) {
//     console.error("Error fetching user membership details:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // --- ADMIN ROUTES ---

// // Get all membership plans (including inactive)
// router.get("/admin/plans", auth.isAdmin, async (req, res) => {
//   try {
//     const plans = await MembershipPlan.find().sort({ createdAt: -1 });
//     res.json(plans);
//   } catch (error) {
//     console.error("Error fetching all membership plans:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Create new membership plan
// router.post("/admin/plans", auth.isAdmin, async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       pricePerMonth,
//       currency,
//       benefits,
//       maxBooksPerMonth,
//       durationDays,
//       isActive,
//     } = req.body;

//     if (!name || !description || !pricePerMonth || pricePerMonth <= 0) {
//       return res.status(400).json({
//         message: "Please provide all required fields with valid values",
//       });
//     }

//     const existingPlan = await MembershipPlan.findOne({ name });
//     if (existingPlan) {
//       return res
//         .status(400)
//         .json({ message: "A plan with this name already exists" });
//     }

//     const newPlan = new MembershipPlan({
//       name,
//       description,
//       pricePerMonth,
//       currency: currency || "Rs",
//       benefits: benefits || [],
//       maxBooksPerMonth: maxBooksPerMonth || 1,
//       durationDays: durationDays || 14,
//       isActive: isActive !== undefined ? isActive : true,
//     });

//     await newPlan.save();
//     res
//       .status(201)
//       .json({ message: "Membership plan created successfully", plan: newPlan });
//   } catch (error) {
//     console.error("Error creating membership plan:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Update membership plan
// router.put("/admin/plans/:id", auth.isAdmin, async (req, res) => {
//   try {
//     const planId = req.params.id;
//     const updates = req.body;

//     const plan = await MembershipPlan.findById(planId);
//     if (!plan) {
//       return res.status(404).json({ message: "Membership plan not found" });
//     }

//     if (updates.name && updates.name !== plan.name) {
//       const existingPlan = await MembershipPlan.findOne({ name: updates.name });
//       if (existingPlan) {
//         return res
//           .status(400)
//           .json({ message: "A plan with this name already exists" });
//       }
//     }

//     Object.assign(plan, updates);
//     plan.updatedAt = Date.now();
//     await plan.save();

//     res.json({ message: "Membership plan updated successfully", plan });
//   } catch (error) {
//     console.error("Error updating membership plan:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Delete membership plan
// router.delete("/admin/plans/:id", auth.isAdmin, async (req, res) => {
//   try {
//     const planId = req.params.id;

//     const plan = await MembershipPlan.findById(planId);
//     if (!plan) {
//       return res.status(404).json({ message: "Membership plan not found" });
//     }

//     const activeMemberships = await Membership.find({
//       membershipPlan: planId,
//       isActive: true,
//     });
//     if (activeMemberships.length > 0) {
//       return res.status(400).json({
//         message:
//           "Cannot delete plan in use by active memberships. Deactivate it instead.",
//       });
//     }

//     const pendingApplications = await MembershipApplication.find({
//       membershipPlan: planId,
//       status: "pending",
//     });
//     if (pendingApplications.length > 0) {
//       return res.status(400).json({
//         message: "Cannot delete plan with pending applications.",
//       });
//     }

//     await MembershipPlan.findByIdAndDelete(planId);
//     res.json({ message: "Membership plan deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting membership plan:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Get all membership applications
// router.get("/admin/applications", auth.isAdmin, async (req, res) => {
//   try {
//     const applications = await MembershipApplication.find()
//       .populate("membershipPlan", "name pricePerMonth")
//       .populate("userId", "username email")
//       .sort({ appliedDate: -1 });
//     res.json(applications);
//   } catch (error) {
//     console.error("Error fetching membership applications:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Process membership application (approve/reject)
// router.put(
//   "/admin/applications/:id/:action",
//   auth.isAdmin,
//   async (req, res) => {
//     try {
//       const { id: applicationId, action: status } = req.params;

//       if (!["approved", "rejected"].includes(status)) {
//         return res.status(400).json({ message: "Invalid action" });
//       }

//       const application = await MembershipApplication.findById(applicationId);
//       if (!application) {
//         return res.status(404).json({ message: "Application not found" });
//       }
//       if (application.status !== "pending") {
//         return res
//           .status(400)
//           .json({ message: `Application is already ${application.status}` });
//       }

//       application.status = status;
//       application.processedDate = new Date();
//       await application.save();

//       if (status === "approved") {
//         const plan = await MembershipPlan.findById(application.membershipPlan);
//         if (!plan) {
//           return res.status(404).json({ message: "Membership plan not found" });
//         }

//         const existingMembership = await Membership.findOne({
//           userId: application.userId,
//         });

//         const endDate = new Date();
//         endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

//         if (existingMembership) {
//           // Update/renew existing membership
//           existingMembership.membershipPlan = plan._id;
//           existingMembership.startDate = new Date();
//           existingMembership.endDate = endDate;
//           existingMembership.isActive = true;
//           existingMembership.renewalCount =
//             (existingMembership.renewalCount || 0) + 1;
//           existingMembership.booksRentedThisMonth = 0;
//           existingMembership.lastResetDate = new Date();
//           existingMembership.applicationId = application._id;
//           await existingMembership.save();
//         } else {
//           // Create new membership
//           await Membership.create({
//             userId: application.userId,
//             membershipPlan: plan._id,
//             applicationId: application._id,
//             startDate: new Date(),
//             endDate: endDate,
//             isActive: true,
//           });
//         }
//       }

//       res.json({
//         message: `Application ${status} successfully`,
//         application,
//       });
//     } catch (error) {
//       console.error("Error processing membership application:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// export default router;
// src/api/membershipRoute.js

import express from "express";
import MembershipPlan from "../database/schema/membershipPlans.js";
import Membership from "../database/schema/membershipSchema.js";
import MembershipApplication from "../database/schema/membershipApplicationschema.js";

//
// --- THE CRITICAL FIX IS HERE ---
// We are importing the middleware functions directly from the correct file.
//
import { isAdmin, isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get("/plans", async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching plans" });
  }
});

// --- AUTHENTICATED USER ROUTES ---
router.get("/user-details", isAuthenticated, async (req, res) => {
  try {
    const membership = await Membership.findOne({
      userId: req.user.userId,
      isActive: true,
    }).populate("membershipPlan");
    if (!membership) {
      return res.status(404).json({ message: "No active membership found" });
    }
    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching user details" });
  }
});

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
    res.status(201).json({ message: "Application submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error submitting application" });
  }
});

// --- ADMIN ROUTES ---
router.get("/admin/plans", isAdmin, async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching all plans" });
  }
});

router.post("/admin/plans", isAdmin, async (req, res) => {
  try {
    const newPlan = new MembershipPlan(req.body);
    await newPlan.save();
    res
      .status(201)
      .json({ message: "Plan created successfully", plan: newPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error creating plan" });
  }
});

router.put("/admin/plans/:id", isAdmin, async (req, res) => {
  try {
    const updatedPlan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: "Plan updated successfully", plan: updatedPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error updating plan" });
  }
});

router.delete("/admin/plans/:id", isAdmin, async (req, res) => {
  try {
    await MembershipPlan.findByIdAndDelete(req.params.id);
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting plan" });
  }
});

router.get("/admin/applications", isAdmin, async (req, res) => {
  try {
    const applications = await MembershipApplication.find()
      .populate("membershipPlan", "name")
      .populate("userId", "fullName email")
      .sort({ appliedDate: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching applications" });
  }
});

router.put("/admin/applications/:id/:action", isAdmin, async (req, res) => {
  try {
    const { id, action } = req.params;
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const application = await MembershipApplication.findByIdAndUpdate(
      id,
      { status: action, processedDate: new Date() },
      { new: true }
    );

    if (action === "approved") {
      const plan = await MembershipPlan.findById(application.membershipPlan);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

      await Membership.findOneAndUpdate(
        { userId: application.userId },
        {
          membershipPlan: plan._id,
          startDate: new Date(),
          endDate,
          isActive: true,
        },
        { upsert: true }
      );
    }
    res.json({ message: `Application ${action} successfully`, application });
  } catch (error) {
    res.status(500).json({ message: "Server error processing application" });
  }
});

export default router;
