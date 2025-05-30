import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut, Plus, Calendar, Users, Vote, Award, Eye, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Define interfaces for the data structures
interface Coordinator {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  location: string;
  max_participants: number;
  coordinator: Coordinator;
}

interface Stats {
  participants: number;
  judges: number;
  categories: number; // Added to match the totalPossibleVotes calculation
  votes: number;
  totalPossibleVotes: number;
}

interface User {
  id: string;
  name: string;
  role: string;
}

const CoordinatorDashboard = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<{ [key: string]: Stats }>({}); // Store stats for each event
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const user = localStorage.getItem("currentUser");
      if (!user) {
        navigate("/login");
        return;
      }

      const userData: User = JSON.parse(user);
      if (userData.role !== "coordinator") {
        navigate("/login");
        return;
      }

      setCurrentUser(userData);

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch events for this coordinator
        const eventsResponse = await axios.get(`${API_URL}/events/`, config);
        console.log("Raw events response:", eventsResponse.data);

        // Filter events based on coordinator.id
        const coordEvents = eventsResponse.data.filter((e: Event) => e.coordinator.id === userData.id);
        console.log("Filtered events for coordinator:", coordEvents);
        console.log("User ID from localStorage:", userData.id);

        setUserEvents(coordEvents);

        // Fetch stats for each event
        const statsMap: { [key: string]: Stats } = {};
        for (const event of coordEvents) {
          const stats = await getEventStats(event.id);
          statsMap[event.id] = stats;
        }
        setEventStats(statsMap);
        console.log("Event stats:", statsMap);
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || "Failed to load data. Please try again.";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const getEventStats = async (eventId: string): Promise<Stats> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token found.");

      const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [participantsResponse, judgesResponse, votesResponse, categoriesResponse] = await Promise.all([
        axios.get(`${API_URL}/events/${eventId}/participants/`, config),
        axios.get(`${API_URL}/events/${eventId}/judges/`, config),
        axios.get(`${API_URL}/events/coordinator/${eventId}/votes/`, config), // Corrected endpoint
        axios.get(`${API_URL}/events/${eventId}/categories/`, config),
      ]);

      const eventParticipants: any[] = participantsResponse.data;
      const eventJudges: any[] = judgesResponse.data;
      const eventVotes: any[] = votesResponse.data;
      const eventCategories: any[] = categoriesResponse.data;

      console.log(`Votes for event ${eventId}:`, eventVotes); // Debug log for votes

      return {
        participants: eventParticipants.length,
        judges: eventJudges.length,
        categories: eventCategories.length,
        votes: eventVotes.length,
        totalPossibleVotes: eventParticipants.length * eventJudges.length * eventCategories.length,
      };
    } catch (err: any) {
      console.error(`Error fetching stats for event ${eventId}:`, err); // Log error details
      setError(err.response?.data?.error || "Failed to load event stats.");
      return {
        participants: 0,
        judges: 0,
        categories: 0,
        votes: 0,
        totalPossibleVotes: 0,
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-300";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <Button onClick={() => navigate("/login")} className="mt-4 bg-yellow-600 text-black">
            Back to Login
          </Button>
        </div>
      </div>
    );
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
                <p className="text-sm text-gray-300">Coordinator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">Welcome,</p>
                <p className="font-semibold">{currentUser?.name}</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">Welcome back, {currentUser?.name}!</h2>
          <p className="text-gray-600 text-lg">Manage your events and oversee the judging process.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-black">Quick Actions</CardTitle>
              <CardDescription>Common tasks and navigation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Link to="/coordinator-dashboard/events">
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
                <Link to="/coordinator-dashboard/events">
                  <Button variant="outline" className="w-full py-3 border-gray-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Events
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-black">Your Events</h3>
            <Link to="/coordinator-dashboard/events">
              <Button variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50">
                View All Events
              </Button>
            </Link>
          </div>

          {userEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-700 mb-2">No Events Yet</h4>
                <p className="text-gray-500 mb-6">Create your first event to get started with VoteRoyale.</p>
                <Link to="/coordinator-dashboard/events">
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {userEvents.map((event) => {
                const stats = eventStats[event.id] || { participants: 0, judges: 0, categories: 0, votes: 0, totalPossibleVotes: 0 };
                return (
                  <Card key={event.id} className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl text-black">{event.title}</CardTitle>
                          <CardDescription className="mt-1">{event.description}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{stats.participants} Participants</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{stats.judges} Judges</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Vote className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {stats.votes}/{stats.totalPossibleVotes} Votes
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Link to={`/coordinator-dashboard/events/${event.id}`}>
                          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        <Link to={`/coordinator-dashboard/events/${event.id}/votes`}>
                          <Button size="sm" variant="outline">
                            <Vote className="h-3 w-3 mr-1" />
                            View Votes
                          </Button>
                        </Link>
                        <Link to={`/coordinator-dashboard/events/${event.id}/results`}>
                          <Button size="sm" variant="outline">
                            <Award className="h-3 w-3 mr-1" />
                            Results
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-black">{userEvents.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-black">
                    {userEvents.filter((e) => e.status === "open").length}
                  </p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;