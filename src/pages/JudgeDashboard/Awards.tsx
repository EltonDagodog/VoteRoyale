import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Define interfaces for TypeScript
interface Criterion {
  id: number;
  name: string;
  description: string;
  percentage: number;
}

interface Category {
  id: string;
  name: string;
  event: string;
  description: string;
  maxScore: number;
  weight: number;
  status: string;
  criteria: Criterion[];
  gender: "male" | "female" | "everyone";
  award_type: "major" | "minor"; // Added to match the updated model
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  location: string;
  maxParticipants: number;
  coordinatorId: string;
}

interface Participant {
  id: string;
  name: string;
  eventId: string;
  category: string;
  entry: string;
  registrationDate: string;
  contestantNumber: number;
  email: string;
  origin: string;
  gender: string;
  image: string;
}

interface Vote {
  id: string;
  judgeId: string;
  participantId: string;
  categoryId: string;
  eventId: string;
  score: number;
  comments: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  event: string;
}

const AwardsPage = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [assignedEvent, setAssignedEvent] = useState<Event | null>(null);
  const [eventCategories, setEventCategories] = useState<Category[]>([]);
  const [myVotes, setMyVotes] = useState<Vote[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      const user = localStorage.getItem("judge");
      if (!user) {
        navigate("/judge-login");
        return;
      }

      const userData: User = JSON.parse(user);
      if (userData.role !== "judge") {
        navigate("/judge-login");
        return;
      }

      setCurrentUser(userData);

      try {
        // Fetch event
        const eventResponse = await axios.get(`${API_URL}/events/${userData.event}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignedEvent(eventResponse.data);

        // Fetch categories for the event
        const categoriesResponse = await axios.get(`${API_URL}/events/${userData.event}/categories/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventCategories(categoriesResponse.data);

        // Fetch votes for the judge
        const votesResponse = await axios.get(`${API_URL}/events/judges/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyVotes(votesResponse.data.votes || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to load data. Please try again.",
          variant: "destructive",
        });
        navigate("/judge-login");
      }
    };

    fetchData();
  }, [navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem("judge");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/judge-login");
  };

  const handleStartJudging = (award: Category, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default navigation behavior of the Link

    if (award.status !== "open") {
      toast({
        title: "Award Closed",
        description: "This award is not open for judging.",
        variant: "destructive",
      });
      return;
    }

    const eventDeadline = new Date(assignedEvent?.date || "");
    const currentDate = new Date("2025-05-30T00:56:00-07:00"); // Current date and time
    if (currentDate > eventDeadline) {
      toast({
        title: "Deadline Passed",
        description: "The judging deadline for this event has passed.",
        variant: "destructive",
      });
      return;
    }

    const hasVoted = myVotes.some((vote) => vote.categoryId === award.id && vote.judgeId === currentUser?.id);
    if (hasVoted) {
      toast({
        title: "Already Judged",
        description: "You have already submitted scores for this category.",
      });
      return;
    }

    const activityLog = {
      judgeId: currentUser?.id,
      awardId: award.id,
      action: "Started Judging",
      timestamp: currentDate.toISOString(),
    };

    // Proceed to voting page
    navigate(`/judge-dashboard/vote/${assignedEvent.id}/${award.id}?gender=${award.gender}`);
  };

  const filteredCategories = eventCategories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const majorAwards = filteredCategories.filter((cat) => cat.award_type === "major");
  const minorAwards = filteredCategories.filter((cat) => cat.award_type === "minor");

  const totalAwards = filteredCategories.length;
  const openAwards = filteredCategories.filter((cat) => cat.status === "open").length;
  const completedAwards = myVotes.length;

  if (!currentUser || !assignedEvent) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1A1A1A] text-white border-b-2 border-yellow-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold">VoteRoyale</h1>
                <p className="text-sm text-gray-300">Judge Page</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">Welcome,</p>
                <p className="font-semibold">{currentUser.name}</p>
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
        <Link to="/judge-dashboard">
              <Button variant="outline" className="my-4 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                ← Back to Awards
              </Button>
            </Link>
        <div className="mb-8">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-black flex items-center space-x-2">
                    <Crown className="h-6 w-6 text-yellow-600" />
                    <span>{assignedEvent.title}</span>
                  </CardTitle>
                  <div className="text-gray-600 mt-2">
                    {assignedEvent.location}, {new Date(assignedEvent.date).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  {assignedEvent.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Sticky Search Input */}
        <div className="sticky top-0 z-10 bg-gray-50 py-4">
          <input
            type="text"
            placeholder="Search awards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-black">
                  <span>Major Awards ({majorAwards.length})</span>
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Primary competition categories with significant weight in the overall competition.
                </p>
              </CardHeader>
              <CardContent>
                {majorAwards.map((award) => (
                  <div key={award.id} className="mb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-black">
                        {award.name} <span className="text-gray-500 text-sm">({award.gender.charAt(0).toUpperCase() + award.gender.slice(1)})</span>
                      </span>
                      <Button
                        size="sm"
                        className={
                          award.status === "open"
                            ? "bg-yellow-600 hover:bg-yellow-700 text-black"
                            : "bg-gray-300 text-gray-700 cursor-not-allowed"
                        }
                        disabled={award.status !== "open"}
                      >
                        {award.status}
                      </Button>
                    </div>
                    <div className="mt-2 pl-4">
                      <h4 className="text-gray-700 font-semibold">Judging Criteria</h4>
                      <div className="mt-1 space-y-1">
                        {award.criteria.map((criterion) => (
                          <div key={criterion.id} className="flex justify-between text-sm text-gray-600">
                            <span>{criterion.name}</span>
                            <span>{criterion.percentage}%</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold text-gray-700 mt-2 pt-2 border-t border-gray-200">
                          <span>Total:</span>
                          <span>{award.criteria.reduce((sum, crit) => sum + crit.percentage, 0)}%</span>
                        </div>
                      </div>
                    </div>
                    {award.status === "open" && (
                      <Link
                        to={`/judge-dashboard/vote/${assignedEvent.id}/${award.id}?gender=${award.gender}`}
                        onClick={(e) => handleStartJudging(award, e)}
                      >
                        <Button
                          className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-black"
                          onClick={(e) => handleStartJudging(award, e)}
                        >
                          Start Judging
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-black">
                  <span>Minor Awards ({minorAwards.length})</span>
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Secondary competition categories with less weight in the overall competition.
                </p>
              </CardHeader>
              <CardContent>
                {minorAwards.map((award) => (
                  <div key={award.id} className="mb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-black">
                        {award.name} <span className="text-gray-500 text-sm">({award.gender.charAt(0).toUpperCase() + award.gender.slice(1)})</span>
                      </span>
                      <Button
                        size="sm"
                        className={
                          award.status === "open"
                            ? "bg-yellow-600 hover:bg-yellow-700 text-black"
                            : "bg-gray-300 text-gray-700 cursor-not-allowed"
                        }
                        disabled={award.status !== "open"}
                      >
                        {award.status}
                      </Button>
                    </div>
                    <div className="mt-2 pl-4">
                      <h4 className="text-gray-700 font-semibold">Judging Criteria</h4>
                      <div className="mt-1 space-y-1">
                        {award.criteria.map((criterion) => (
                          <div key={criterion.id} className="flex justify-between text-sm text-gray-600">
                            <span>{criterion.name}</span>
                            <span>{criterion.percentage}%</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold text-gray-700 mt-2 pt-2 border-t border-gray-200">
                          <span>Total:</span>
                          <span>{award.criteria.reduce((sum, crit) => sum + crit.percentage, 0)}%</span>
                        </div>
                      </div>
                    </div>
                    {award.status === "open" && (
                      <Link
                        to={`/judge-dashboard/vote/${assignedEvent.id}/${award.id}?gender=${award.gender}`}
                        onClick={(e) => handleStartJudging(award, e)}
                      >
                        <Button
                          className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-black"
                          onClick={(e) => handleStartJudging(award, e)}
                        >
                          Start Judging
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Card className="bg-yellow-400 text-black">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Judging Instructions</h3>
              <p className="text-sm">
                Click "Start Judging" on any open award to begin scoring contestants. Each criterion must be scored on a scale of 1-10. Make sure to complete all scoring before the award deadline.
              </p>
              <p className="text-sm mt-2">
                Total Awards: {totalAwards} | Open: {openAwards} | Completed: {completedAwards}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AwardsPage;