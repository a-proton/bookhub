// In: src/controllers/membershipController.js

import { models } from "../database/index.js";

// Get a user's membership details
export const getMembershipDetailsForUser = async (req, res) => {
  try {
    // req.user comes from your auth.isAuthenticated middleware
    const membership = await models.Membership.findOne({
      userId: req.user.userId,
    })
      .populate("membershipPlan")
      .populate("applicationId");

    if (!membership) {
      return res
        .status(404)
        .json({ message: "No active membership found for this user." });
    }

    res.status(200).json(membership);
  } catch (error) {
    console.error("Error fetching membership details:", error);
    res.status(500).json({ message: "Failed to retrieve membership details" });
  }
};

// Add other controller functions here...
