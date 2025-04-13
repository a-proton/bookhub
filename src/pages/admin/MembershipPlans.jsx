// src/pages/admin/MembershipPlans.jsx
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MembershipPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricePerMonth: "",
    currency: "Rs",
    maxBooksPerMonth: 1,
    durationDays: 14,
    benefits: [""],
    isActive: true,
  });

  useEffect(() => {
    fetchMembershipPlans();
  }, []);

  const fetchMembershipPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/membership/admin/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPlans(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching membership plans:", err);
      setError(
        "Failed to load membership plans. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData({
        ...formData,
        [name]: value === "" ? "" : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSwitchChange = (checked) => {
    setFormData({
      ...formData,
      isActive: checked,
    });
  };

  const handleBenefitChange = (index, value) => {
    const updatedBenefits = [...formData.benefits];
    updatedBenefits[index] = value;
    setFormData({
      ...formData,
      benefits: updatedBenefits,
    });
  };

  const addBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, ""],
    });
  };

  const removeBenefit = (index) => {
    const updatedBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      benefits: updatedBenefits,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      pricePerMonth: "",
      currency: "Rs",
      maxBooksPerMonth: 1,
      durationDays: 14,
      benefits: [""],
      isActive: true,
    });
    setIsEditing(false);
  };

  const handleEditPlan = (plan) => {
    setFormData({
      _id: plan._id,
      name: plan.name,
      description: plan.description,
      pricePerMonth: plan.pricePerMonth,
      currency: plan.currency,
      maxBooksPerMonth: plan.maxBooksPerMonth,
      durationDays: plan.durationDays,
      benefits: plan.benefits.length > 0 ? plan.benefits : [""],
      isActive: plan.isActive,
    });
    setIsEditing(true);
    setShowPlanForm(true);
  };

  const handleDeletePlan = (plan) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/membership/admin/plans/${planToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh plans after deletion
      fetchMembershipPlans();
      setShowDeleteDialog(false);
      setPlanToDelete(null);
    } catch (err) {
      console.error("Error deleting plan:", err);
      setError("Failed to delete plan. Please try again.");
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.description || !formData.pricePerMonth) {
      setError("Please fill in all required fields");
      return false;
    }
    
    if (formData.pricePerMonth <= 0) {
      setError("Price must be greater than zero");
      return false;
    }
    
    if (formData.maxBooksPerMonth < 1) {
      setError("Max books must be at least 1");
      return false;
    }
    
    if (formData.durationDays < 1) {
      setError("Duration days must be at least 1");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Filter out empty benefits
      const dataToSubmit = {
        ...formData,
        benefits: formData.benefits.filter(benefit => benefit.trim() !== "")
      };

      if (isEditing) {
        await axios.put(
          `${API_URL}/membership/admin/plans/${formData._id}`,
          dataToSubmit,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(`${API_URL}/membership/admin/plans`, dataToSubmit, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Refresh plans and reset form
      fetchMembershipPlans();
      resetForm();
      setShowPlanForm(false);
      setError(null);
    } catch (err) {
      console.error("Error saving plan:", err);
      setError("Failed to save plan. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Membership Plans</h1>
          <Button onClick={() => {
            resetForm();
            setShowPlanForm(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add New Plan
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">Loading membership plans...</div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-10 text-gray-500">
                No membership plans found. Create your first plan to get started.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Max Books</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan._id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>
                          {plan.currency}{plan.pricePerMonth}/month
                        </TableCell>
                        <TableCell>{plan.maxBooksPerMonth}</TableCell>
                        <TableCell>{plan.durationDays} days</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              plan.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {plan.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlan(plan)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plan Form Dialog */}
        <Dialog open={showPlanForm} onOpenChange={setShowPlanForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Membership Plan" : "Create Membership Plan"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the details of your membership plan"
                  : "Define a new membership plan for your users"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter plan name (e.g., Basic, Premium)"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the membership plan"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pricePerMonth">Monthly Price *</Label>
                    <Input
                      id="pricePerMonth"
                      name="pricePerMonth"
                      type="number"
                      placeholder="Enter price per month"
                      value={formData.pricePerMonth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      name="currency"
                      placeholder="Currency symbol"
                      value={formData.currency}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxBooksPerMonth">Max Books At Once *</Label>
                    <Input
                      id="maxBooksPerMonth"
                      name="maxBooksPerMonth"
                      type="number"
                      placeholder="Max books allowed"
                      value={formData.maxBooksPerMonth}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="durationDays">Borrow Duration (Days) *</Label>
                    <Input
                      id="durationDays"
                      name="durationDays"
                      type="number"
                      placeholder="Number of days"
                      value={formData.durationDays}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Plan Benefits</Label>
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Benefit ${index + 1}`}
                        value={benefit}
                        onChange={(e) =>
                          handleBenefitChange(index, e.target.value)
                        }
                      />
                      {formData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBenefit(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBenefit}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Benefit
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="isActive">Activate this plan immediately</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  resetForm();
                  setShowPlanForm(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? "Update Plan" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Membership Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the "{planToDelete?.name}" plan? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPlanToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePlan} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default MembershipPlansPage;