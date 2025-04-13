// src/pages/ContactUs.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

// Icons
import { Mail, Send, Loader2, MessageSquare, Check } from "lucide-react";

const ContactUs = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Auto-fill email and name when component mounts if user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setFormData(prevState => ({
        ...prevState,
        email: currentUser.email || '',
        name: currentUser.fullName || ''
      }));
    }
  }, [isAuthenticated, currentUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      console.log('Form submitted:', formData);
      
      // Show success toast
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully! We will get back to you soon.",
        variant: "success",
      });
      
      setIsSubmitting(false);
      setSubmitted(true);
      
      // Reset form after successful submission
      if (!isAuthenticated) {
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setFormData({
          name: currentUser.fullName || '',
          email: currentUser.email || '',
          subject: '',
          message: ''
        });
      }
    }, 1500);
  };
  
  const handleSendAnother = () => {
    setSubmitted(false);
  };
  
  return (
    <div className="container mx-auto p-4 mt-8 max-w-2xl">
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white p-6 rounded-t-lg shadow-lg">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Contact Us</h1>
        </div>
        <p className="mt-2 text-purple-200">
          Have a question or feedback? We'd love to hear from you!
        </p>
      </div>
      
      <Card className="rounded-t-none shadow-lg">
        <CardContent className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-center">Message Sent!</CardTitle>
              <p className="text-center text-gray-600 max-w-md">
                Thanks for reaching out. Your message has been sent successfully! Our team will get back to you soon.
              </p>
              <Button 
                onClick={handleSendAnother}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your email address"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is your message about?"
                  required
                />
              </div>
              
              <Separator className="my-2" />
              
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message here..."
                  className="min-h-32 resize-y"
                  required
                />
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 px-8"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      
      <Toaster />
    </div>
  );
};

export default ContactUs;