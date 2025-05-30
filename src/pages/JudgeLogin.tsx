import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Crown, ArrowLeft, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const JudgeLogin = () => {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Step 1: Authenticate the judge
      const response = await axios.post(`${API_URL}/events/judges/login/`, {
        access_code: accessCode.toUpperCase(),
      });
      console.log(response.data)

      const { access_token, refresh_token, judge } = response.data;

      // Step 2: Fetch event details using event_id
      if (!judge.event) {
        throw new Error("Event ID not found in judge data.");
      }

      const eventResponse = await axios.get(`${API_URL}/events/${judge.event}/`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const eventStatus = eventResponse.data.status;

      // Step 3: Store tokens and judge info in localStorage
      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("refreshToken", refresh_token);
      localStorage.setItem("judge", JSON.stringify({
        ...judge,
        role: "judge",
        loginTime: new Date().toISOString()
      }));

      // Step 4: Check event status and handle navigation
      if (eventStatus === "open") {
        toast({
          title: "Access Granted",
          description: `Welcome, ${judge.name}! Redirecting to your dashboard.`,
        });
        navigate("/judge-dashboard");
      } else if (eventStatus === "upcoming") {
        toast({
          title: "Access Restricted",
          description: "The event is upcoming. You can log in when it opens.",
          variant: "destructive",
        });
        // Clear tokens since login isn't allowed
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("judge");
      } else if (eventStatus === "closed") {
        toast({
          title: "Access Restricted",
          description: "The event is closed. Judging is no longer available.",
          variant: "destructive",
        });
        // Clear tokens
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("judge");
      } else {
        toast({
          title: "Access Denied",
          description: "Unknown event status. Please contact your coordinator.",
          variant: "destructive",
        });
        // Clear tokens
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("judge");
      }
    } catch (error: any) {
      console.log(error);
      toast({
        title: "Access Denied",
        description: error.response?.data?.error || error.message || "Invalid access code or event fetch failed. Please try again.",
        variant: "destructive",
      });
      // Clear any stored tokens in case of error
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("judge");
    } finally {
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
          <h2 className="text-xl text-gray-700 flex items-center justify-center space-x-2">
            <Scale className="h-5 w-5" />
            <span>Judge Portal</span>
          </h2>
        </div>

        <Card className="border-2 border-yellow-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-black">Judge Access</CardTitle>
            <CardDescription>
              Enter your unique access code to begin judging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-black font-medium">Access Code</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  required
                  className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 text-center text-lg font-mono tracking-wider"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 text-center">
                  Access codes are case-insensitive and provided by your event coordinator
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-3 border-2 border-yellow-600"
                disabled={isLoading}
              >
                {isLoading ? "Verifying Access..." : "Enter Judging Portal"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                Are you a coordinator? Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JudgeLogin;