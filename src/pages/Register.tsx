import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Crown, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use Vite's environment variable syntax
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Check if passwords match
    if (password !== confirmPassword) {
      toast({
        title: "Registration Failed",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/coordinators/register/`, {
        email,
        name,
        department: "Event Management",
        password,
      });

      // Registration successful
      toast({
        title: "Registration Successful",
        description: `Welcome, ${name}! Please sign in to continue.`,
      });

      setIsLoading(false);
      navigate("/login");
    } catch (error) {
      const errorMessage =
        error.response?.data?.email?.[0] || error.response?.data?.detail || "Registration failed. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Crown className="h-8 w-8 text-yellow-600" />
            <h1 className="text-2xl font-bold text-black">VoteRoyale</h1>
          </div>
          <h2 className="text-xl text-gray-700">Coordinator Portal</h2>
        </div>

        <Card className="border-2 border-yellow-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-black">Create Account</CardTitle>
            <CardDescription>
              Register as a coordinator to start managing events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-black font-medium">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-black font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-2 border-2 border-yellow-600"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                Already have an account? Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;