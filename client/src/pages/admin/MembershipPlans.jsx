// src/pages/admin/MembershipPlans.jsx
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
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
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

const MembershipPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { currentUser, api, isAdmin } = useAuth();
  const { toast } = useToast();

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

  // Check for authentication first
  useEffect(() => {
    if (!currentUser && !loading) {
      setError("Please log in to access this page");
    } else if (currentUser && !isAdmin) {
      setError("Unauthorized access. Admin privileges required.");
    }
  }, [currentUser, isAdmin, loading]);

  const fetchMembershipPlans = async () => {
    if (!currentUser || !isAdmin) {
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching membership plans...");

      // Use the consistent endpoint with 's' in 'memberships'
      const response = await api.get("/memberships/admin/plans");
      console.log("Plans data:", response.data);
      setPlans(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching membership plans:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to view membership plans.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load membership plans. Please check your connection and try again."
        );
      }

      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchMembershipPlans();
    }
  }, [currentUser, isAdmin]);

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
      // Fixed endpoint: use 'memberships' (with 's') consistently
      await api.delete(`/memberships/admin/plans/${planToDelete._id}`);

      toast({
        title: "Success",
        description: "Plan deleted successfully!",
        variant: "default",
      });

      // Refresh plans after deletion
      fetchMembershipPlans();
      setShowDeleteDialog(false);
      setPlanToDelete(null);
      setError(null);
    } catch (err) {
      console.error("Error deleting plan:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to delete plan. Please try again.";
      setError(errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
      // Filter out empty benefits
      const dataToSubmit = {
        ...formData,
        benefits: formData.benefits.filter((benefit) => benefit.trim() !== ""),
      };

      if (isEditing) {
        // Fixed endpoint: use 'memberships' (with 's') consistently
        await api.put(`/memberships/admin/plans/${formData._id}`, dataToSubmit);

        toast({
          title: "Success",
          description: "Plan updated successfully!",
          variant: "default",
        });
      } else {
        // Fixed endpoint: use 'memberships' (with 's') consistently
        await api.post("/memberships/admin/plans", dataToSubmit);

        toast({
          title: "Success",
          description: "Plan created successfully!",
          variant: "default",
        });
      }

      // Refresh plans and reset form
      fetchMembershipPlans();
      resetForm();
      setShowPlanForm(false);
      setError(null);
    } catch (err) {
      console.error("Error saving plan:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to save plan. Please try again.";
      setError(errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-lg font-medium text-muted-foreground">
          Loading membership plans...
        </p>
      </div>
    );
  }

  if (
    error &&
    (error.includes("Unauthorized") || error.includes("Please log in"))
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => (window.location.href = "/admin/login")}
              className="w-full"
            >
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Membership Plans</h1>
          <Button
            onClick={() => {
              resetForm();
              setShowPlanForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Plan
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {plans.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-10 text-gray-500">
                No membership plans found. Create your first plan to get
                started.
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
                        <TableCell className="font-medium">
                          {plan.name}
                        </TableCell>
                        <TableCell>
                          {plan.currency}
                          {plan.pricePerMonth}/month
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
                    <Label htmlFor="maxBooksPerMonth">
                      Max Books At Once *
                    </Label>
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
                    <Label htmlFor="durationDays">
                      Borrow Duration (Days) *
                    </Label>
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
                  <Label htmlFor="isActive">
                    Activate this plan immediately
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowPlanForm(false);
                  }}
                >
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
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Membership Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the "{planToDelete?.name}" plan?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPlanToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeletePlan}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster />
      </div>
    </AdminLayout>
  );
};

export default MembershipPlansPage;
