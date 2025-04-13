// src/pages/admin/ApplicationReview.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

// Import shadcn components
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Import Lucide icons
import { 
  AlertCircle, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Eye, 
  Loader2, 
  RotateCcw,
  Search, 
  ThumbsDown,
  ThumbsUp,
  X, 
} from 'lucide-react';

const ApplicationReview = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [noteInput, setNoteInput] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'appliedDate', direction: 'desc' });
  const { currentUser, api, isAdmin } = useAuth();
  const { toast } = useToast();

  // Check for authentication first
  useEffect(() => {
    // If authentication is still loading, do nothing
    if (!currentUser && !loading) {
      setError('Please log in to access this page');
    } else if (currentUser && !isAdmin()) {
      setError('Unauthorized access. Admin privileges required.');
    }
  }, [currentUser, isAdmin, loading]);

  // Fetch applications based on filter
  const fetchApplications = async () => {
    if (!currentUser || !isAdmin()) {
      return; // Don't attempt to fetch if not admin
    }
    
    try {
      setLoading(true);
      console.log('Fetching applications...');
      
      // Fixed the API endpoint to match server.js route
      const response = await api.get('/membership/admin/applications');
      console.log('Applications data:', response.data);
      setApplications(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      
      // More detailed error handling
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view applications.');
      } else {
        setError(err.response?.data?.message || 'Failed to load applications. Please try again.');
      }
      
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle approve/reject action
  const handleAction = async (id, action) => {
    try {
      // Fixed the API endpoint to match server.js route and using api instead of authAxios
      await api.put(`/memberships/admin/applications/${id}/${action}`, {
        notes: noteInput
      });
      
      // Show success feedback with toast
      setError(null);
      
      toast({
        title: 'Success',
        description: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully!`,
        variant: 'default',
      });
      
      // Refresh the applications list
      fetchApplications();
      setNoteInput('');
      setSelectedApp(null);
    } catch (err) {
      console.error(`Error ${action}ing application:`, err);
      setError(err.response?.data?.message || `Failed to ${action} application. Please try again.`);
      
      toast({
        title: 'Error',
        description: err.response?.data?.message || `Failed to ${action} application. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort applications based on current config
  const sortedApplications = [...applications].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Filter applications based on status and search term
  const filteredApplications = sortedApplications.filter(app => {
    // Filter by status
    const statusMatch = filter === 'all' || app.status === filter;
    
    // Filter by search term
    const searchMatch = searchTerm === '' || 
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone.includes(searchTerm);
    
    return statusMatch && searchMatch;
  });

  // Fetch applications on component mount and when user changes
  useEffect(() => {
    if (currentUser && isAdmin()) {
      fetchApplications();
    }
  }, [currentUser, isAdmin]);

  // Status badge helper
  const StatusBadge = ({ status }) => {
    const variants = {
      pending: "warning",
      approved: "success",
      rejected: "destructive"
    };
    
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Loading applications...</p>
      </div>
    );
  }

  if (error && (error.includes('Unauthorized') || error.includes('Please log in'))) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.href = '/admin/login'} className="w-full">
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold tracking-tight">Membership Applications</h1>
        <Button variant="outline" onClick={fetchApplications} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" className="absolute top-4 right-4" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Rejected
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Applications Found</h3>
            <p className="text-muted-foreground text-center mt-2">
              {searchTerm ? 
                "No applications match your search criteria." : 
                `No ${filter !== 'all' ? filter : ''} applications at this time.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent/50 transition-colors" 
                    onClick={() => requestSort('firstName')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortConfig.key === 'firstName' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => requestSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortConfig.key === 'email' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => requestSort('phone')}
                  >
                    <div className="flex items-center">
                      Phone
                      {sortConfig.key === 'phone' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => requestSort('appliedDate')}
                  >
                    <div className="flex items-center">
                      Application Date
                      {sortConfig.key === 'appliedDate' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map(app => (
                  <TableRow key={app._id} className="group">
                    <TableCell className="font-medium">{`${app.firstName} ${app.lastName}`}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.phone}</TableCell>
                    <TableCell>
                      {format(new Date(app.appliedDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        
                        {app.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                              onClick={() => handleAction(app._id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                              onClick={() => handleAction(app._id, 'rejected')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
      
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        {selectedApp && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Application Details</DialogTitle>
              <DialogDescription>
                Review the applicant information and take action.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center gap-4 py-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-medium text-xl">
                {selectedApp.firstName.charAt(0)}{selectedApp.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">{`${selectedApp.firstName} ${selectedApp.lastName}`}</h3>
                <StatusBadge status={selectedApp.status} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div>{selectedApp.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div>{selectedApp.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Address</div>
                    <div>{selectedApp.address || 'Not provided'}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Application Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Applied Date</div>
                    <div>
                      {format(new Date(selectedApp.appliedDate), 'PPpp')}
                    </div>
                  </div>
                  
                  {selectedApp.reviewDate && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Review Date</div>
                      <div>
                        {format(new Date(selectedApp.reviewDate), 'PPpp')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {selectedApp.notes && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{selectedApp.notes}</p>
                </CardContent>
              </Card>
            )}
            
            {selectedApp.status === 'pending' && (
              <div className="space-y-4 mt-4">
                <h4 className="text-lg font-medium">Review Application</h4>
                <Textarea
                  placeholder="Add notes about this application..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={4}
                />
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedApp(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAction(selectedApp._id, 'approve')}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleAction(selectedApp._id, 'reject')}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
      
      <Toaster />
    </div>
  );
};

export default ApplicationReview;