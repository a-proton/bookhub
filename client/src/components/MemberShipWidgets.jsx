// src/components/MembershipPlansWidget.jsx
import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const MembershipPlansWidget = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/membership/admin/plans`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPlans(response.data.filter((plan) => plan.isActive));
        setError(null);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow">
        <p>Loading membership plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Recent Membership Plans</h2>
      </div>
      {plans.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No active membership plans found.</p>
          <Link
            to="/admin/membership-plans"
            className="text-blue-500 hover:underline block mt-2"
          >
            Create a plan
          </Link>
        </div>
      ) : (
        <div className="divide-y">
          {plans.slice(0, 3).map((plan) => (
            <div
              key={plan._id}
              className="p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium">{plan.name}</h3>
                <p className="text-sm text-gray-500">
                  {plan.currency}
                  {plan.pricePerMonth}/month
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {plan.maxBooksPerMonth} books • {plan.durationDays} days
              </div>
            </div>
          ))}
          <div className="p-3 bg-gray-50 text-center">
            <Link
              to="/admin/membership-plans"
              className="text-sm text-blue-500 hover:underline"
            >
              View all plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipPlansWidget;
