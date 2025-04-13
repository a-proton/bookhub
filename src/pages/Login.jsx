import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../contexts/AuthContext"
 import{ AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authError } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showDialog, setShowDialog] = React.useState(false);
  const [dialogMessage, setDialogMessage] = React.useState('');
  const [dialogTitle, setDialogTitle] = React.useState('Login Status');
  const [errors, setErrors] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);

  // Get redirect location if available (for redirecting after login)
  const from = location.state?.from || '/';

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setIsLoading(true);
        
        // Use the Auth Context login function instead of direct fetch
        const result = await login(email, password);
        
        if (result.success) {
          setDialogTitle('Login Successful');
          setDialogMessage('You have successfully logged in!');
          setShowDialog(true);
        } else {
          throw new Error(result.message || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        setDialogTitle('Login Failed');
        setDialogMessage(error.message || authError || 'Something went wrong. Please try again.');
        setShowDialog(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    
    // If login was successful, redirect to intended page or home
    if (dialogTitle === 'Login Successful') {
      // Small delay to ensure context updates are fully propagated
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  };
// Inside your Login component after successful login
const onLoginSuccess = () => {
  if (location.state?.returnToCheckout) {
    navigate('/cart', { state: { fromLogin: true } });
  } else if (location.state?.from) {
    navigate(location.state.from);
  } else {
    navigate('/'); // Default redirect
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 pt-8 pb-8">
          <p className="text-lg text-purple-900 text-center">Welcome back</p>
          <CardTitle className="text-2xl text-center text-purple-900">Login to Your Account</CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-900">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: '' });
                  }}
                  className={`pl-10 h-12 ${errors.email ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-900">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: '' });
                  }}
                  className={`pl-10 h-12 ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="text-purple-900" />
                <Label htmlFor="remember" className="text-purple-900">Remember me</Label>
              </div>
              <Button variant="link" className="px-0 text-purple-900">Forgot Password?</Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-purple-900 hover:bg-purple-800 h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <div className="text-center text-sm text-purple-900">
              Don't have an account?{' '}
              <a href="/signup" className="text-purple-900 hover:underline font-medium">
                Create Account
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-purple-900 hover:bg-purple-800" onClick={handleDialogClose}>
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;