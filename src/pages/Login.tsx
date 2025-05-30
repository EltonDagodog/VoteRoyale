import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Crown, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use Vite's environment variable syntax
  const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/coordinators/login/`, {
        email,
        password,
      });

      // Store the tokens and user data
      const { access, refresh, user } = response.data;
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("currentUser", JSON.stringify({
        ...user,
        loginTime: new Date().toISOString(),
      }));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      });

      setIsLoading(false);
      navigate("/coordinator-dashboard");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.response?.data?.detail || "Login failed. Please try again.";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
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
            <CardTitle className="text-2xl text-black">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your coordinator account to manage events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-2 border-2 border-yellow-600"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

           

            <div className="mt-6 text-center space-y-2">
              <div>
                <Link to="/judge-login" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                  Are you a judge? Click here to access with your code
                </Link>
              </div>
              <div>
                <Link to="/register" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                  Don't have an account? Register here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;