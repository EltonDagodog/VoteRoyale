import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut, User, Calendar, Users, Vote, CheckCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const JudgeDashboard = () => {
  const [judgeData, setJudgeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
  const token = localStorage.getItem("accessToken");


  useEffect(() => {
    const fetchDashboardData = async () => {
      const user = localStorage.getItem("judge");
      if (!user) {
        navigate("/judge-login");
        return;
      }

      const userData = JSON.parse(user);
      if (userData.role !== "judge") {
        navigate("/judge-login");
        return;
      }

      try {
        
        const response = await axios.get(
          `${API_URL}/events/judges/dashboard/`, // Corrected endpoint
          {
            headers: { Authorization: `Bearer ${token}` }, // Proper header configuration
          }
        );
        setJudgeData(response.data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to load dashboard data.",
          variant: "destructive",
        });
        navigate("/judge-login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, toast]);

 const handleLogout = () => {
    // Prompt user for confirmation
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      // Proceed with logout
      localStorage.clear();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } // If "No" or cancel, do nothing
  };

  const getVoteStatus = (participantId: string, categoryId: string) => {
    if (!judgeData?.votes) return false;
    return judgeData.votes.some((v: any) => v.participant === participantId && v.category === categoryId);
  };

  const getTotalVotesSubmitted = () => {
    return judgeData?.votes?.length || 0;
  };

  const getTotalPossibleVotes = () => {
    if (!judgeData) return 0;
    return (judgeData.participants?.length || 0) * (judgeData.categories?.length || 0);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  if (!judgeData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white border-b-2 border-yellow-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold">VoteRoyale</h1>
                <p className="text-sm text-gray-300">Judge Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">Welcome,</p>
                <p className="font-semibold">{judgeData.judge.name}</p>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Judge Profile */}
        <Card className="border-l-4 border-l-yellow-500 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-black flex items-center space-x-2">
              <User className="h-6 w-6 text-yellow-600" />
              <span>Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={judgeData.judge.image} alt={judgeData.judge.name} />
                <AvatarFallback>{judgeData.judge.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-gray-700"><strong>Name:</strong> {judgeData.judge.name}</p>
                <p className="text-gray-700"><strong>Email:</strong> {judgeData.judge.email}</p>
                <p className="text-gray-700"><strong>Access Code:</strong> {judgeData.judge.access_code}</p>
                <p className="text-gray-700"><strong>Specialization:</strong> {judgeData.judge.specialization}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Overview */}
        <div className="mb-8">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-black flex items-center space-x-2">
                    <Crown className="h-6 w-6 text-yellow-600" />
                    <span>{judgeData.event.title}</span>
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    {judgeData.event.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  {judgeData.event.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">{new Date(judgeData.event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">{judgeData.event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">{judgeData.participants.length} / {judgeData.event.max_participants} Contestants</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Voting Progress */}
        <div className="mb-8">
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
                <span>Voting Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{getTotalVotesSubmitted()}</div>
                  <div className="text-gray-600">Votes Submitted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-700">{getTotalPossibleVotes()}</div>
                  <div className="text-gray-600">Total Required</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((getTotalVotesSubmitted() / getTotalPossibleVotes()) * 100)}%
                  </div>
                  <div className="text-gray-600">Complete</div>
                </div>
              </div>
              <div className="mt-4 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(getTotalVotesSubmitted() / getTotalPossibleVotes()) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Awards Sections */}
        <div className="grid grid-cols-2 gap-8">
          {/* Major Awards */}
          <div>
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-black">
                  <Crown className="h-6 w-6 text-yellow-600" />
                  <span>Major Awards</span>
                </CardTitle>
                <p className="text-gray-600 text-sm">Primary competition categories</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {judgeData.categories
                    .filter((cat: any) => cat.award_type === "major")
                    .map((category: any) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-black">{category.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">{category.criteria.length} criteria</span>
                          <Button 
                            size="sm" 
                            className={category.status === "open" ? "bg-yellow-600 hover:bg-yellow-700 text-black" : "bg-gray-300 text-gray-700 cursor-not-allowed"} 
                            disabled={category.status !== "open"}
                            onClick={() => navigate(`/judge-dashboard/awards/${category.id}`)}
                          >
                            {category.status}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Minor Awards */}
          <div>
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-black">
                  <Crown className="h-6 w-6 text-yellow-600" />
                  <span>Minor Awards</span>
                </CardTitle>
                <p className="text-gray-600 text-sm">Secondary competition categories</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {judgeData.categories
                    .filter((cat: any) => cat.award_type === "minor")
                    .map((category: any) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-black">{category.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">{category.criteria.length} criteria</span>
                          <Button 
                            size="sm" 
                            className={category.status === "open" ? "bg-yellow-600 hover:bg-yellow-700 text-black" : "bg-gray-300 text-gray-700 cursor-not-allowed"} 
                            disabled={category.status !== "open"}
                            onClick={() => navigate(`/judge-dashboard/awards/${category.id}`)}
                          >
                            {category.status}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Link to="/judge-dashboard/awards">
            <Button 
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 hover:text-black shadow-md hover:shadow-lg"
            >
              Ready to Judge?
            </Button>
            <span className="ml-2 rounded-full font-normal py-3 px-8 text-black transition-all duration-300 transform hover:scale-105 hover:text-white shadow-md hover:bg-yellow-600">
              View awards and score contestants
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JudgeDashboard;