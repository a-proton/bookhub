// MembershipDetails.js - Updated version
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

// Icons
import { 
  ShieldCheck, CalendarDays, BookOpen, Clock, Calendar, 
  CreditCard, RefreshCw, Loader2
} from "lucide-react";

const MembershipDetails = () => {
  const { currentUser, userToken } = useAuth();
  const [membershipDetails, setMembershipDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembershipDetails();
  }, [currentUser]);

  const fetchMembershipDetails = async () => {
    setLoading(true);
    try {
      // Always try to fetch membership details, even if hasMembership flag is false
      // This helps us catch cases where the flag is out of sync
      const response = await axios.get('/api/memberships/user-details', {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      if (response.data && !response.data.error) {
        // If we get valid membership data, update our state
        setMembershipDetails(response.data);
        setError(null);
      } else {
        // If the API returns an error or no data, set membership to null
        setMembershipDetails(null);
        // We won't set an error here, as this is an expected state for users without membership
      }
    } catch (err) {
      console.error('Error fetching membership details:', err);
      setMembershipDetails(null);
      
      // Only show error toast for unexpected errors, not for 404 (no membership found)
      if (err.response && err.response.status !== 404) {
        setError('Failed to load membership details. Please try again later.');
        toast({
          title: "Error",
          description: "Failed to load your membership details",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getMembershipStatusColor = () => {
    if (!membershipDetails) return 'bg-gray-400';
    
    const daysRemaining = calculateDaysRemaining(membershipDetails.endDate);
    if (daysRemaining === 0) return 'bg-red-600';
    if (daysRemaining < 7) return 'bg-amber-500';
    return 'bg-green-600';
  };

  const getProgressValue = () => {
    if (!membershipDetails) return 0;
    
    const startDate = new Date(membershipDetails.startDate);
    const endDate = new Date(membershipDetails.endDate);
    const today = new Date();
    
    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;
    
    let percentage = Math.floor((elapsed / totalDuration) * 100);
    return Math.min(Math.max(percentage, 0), 100); // Ensure between 0 and 100
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-24 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500 py-4">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={fetchMembershipDetails}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show the "no membership" card if we don't have membership details or if membershipDetails is null
  if (!membershipDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-800">Membership Status</CardTitle>
          <CardDescription>
            Upgrade to access exclusive books and premium features
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-lg border p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-400" />
                <span className="font-medium">Standard Account</span>
              </div>
              
              <Badge variant="outline">Inactive</Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Premium Benefits You're Missing</h4>
            <ul className="list-disc list-inside space-y-1 text-sm pl-2">
              <li>Access to exclusive premium books</li>
              <li>Extended borrowing periods (21 days)</li>
              <li>Reserve books in advance</li>
              <li>Free home delivery of books</li>
              <li>Priority customer support</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 w-full"
            onClick={() => window.location.href = '/MembershipPage'}
          >
            Upgrade to Premium Membership
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If we have membership details, show the membership card
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2 text-purple-800">
          <ShieldCheck className="h-5 w-5" /> Your Membership
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchMembershipDetails}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <Separator className="my-3" />
      
      <Card className="border-2 border-purple-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              {membershipDetails.membershipPlan?.name || 'Premium Membership'}
            </CardTitle>
            <Badge className={getMembershipStatusColor()}>
              {membershipDetails.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Time remaining indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Membership Period</span>
                <span className="font-medium">{calculateDaysRemaining(membershipDetails.endDate)} days remaining</span>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
            </div>
            
            {/* Membership details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Start Date</span>
                </div>
                <p>{formatDate(membershipDetails.startDate)}</p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">End Date</span>
                </div>
                <p>{formatDate(membershipDetails.endDate)}</p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Books This Month</span>
                </div>
                <p>
                  {membershipDetails.booksRentedThisMonth} / 
                  {membershipDetails.membershipPlan?.maxBooksPerMonth || 'Unlimited'}
                </p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Rental Duration</span>
                </div>
                <p>{membershipDetails.membershipPlan?.durationDays || 21} days per book</p>
              </div>
            </div>
            
            {/* Plan Benefits */}
            <div>
              <h4 className="text-sm font-medium mb-2">Your Membership Benefits:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm pl-2 text-gray-700">
                {membershipDetails.membershipPlan?.benefits?.length > 0 ? (
                  membershipDetails.membershipPlan.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))
                ) : (
                  <>
                    <li>Access to exclusive premium books</li>
                    <li>Extended borrowing periods</li>
                    <li>Reserve books in advance</li>
                    <li>Free home delivery</li>
                    <li>Priority customer support</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-6">
          <div className="w-full flex flex-col sm:flex-row gap-3 justify-between">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.href = '/MembershipPage'}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Update Plan
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 flex-1"
              onClick={() => window.location.href = '/MembershipRenewal'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Renew Membership
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MembershipDetails;