import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowLeft, Users, Award, Vote, Settings, Plus, Trophy, BarChart3, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { Label } from "@radix-ui/react-label";

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
  maxJudges?: number; // Optional, based on your UI logic
  coordinator: Coordinator;
}

interface Participant {
  id: string;
  name: string;
  entry: string;
  contestant_number: number;
  event: Event;
  registration_date: string;
}

interface Judge {
  id: string;
  email: string;
  name: string;
  role: string;
  access_code: string;
  specialization?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  max_score: number;
  weight: number;
}

interface Vote {
  id: string;
  event: Event;
  judge: Judge;
  participant: Participant;
  category: Category;
  score: number;
  comments?: string;
  submitted_at: string;
}

interface Performer {
  participant: Participant;
  category: Category;
  totalScore: number;
  avgScore: number;
  voteCount: number;
}

const EventDetail = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventStats, setEventStats] = useState<any>({
    participants: 0,
    judges: 0,
    categories: 0,
    votes: 0,
    totalPossibleVotes: 0,
  });
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        // Fetch event details
        const eventResponse = await axios.get(`${API_URL}/events/${eventId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvent(eventResponse.data);
        setStatus(eventResponse.data.status);

        // Fetch participants
        const participantsResponse = await axios.get(`${API_URL}/events/${eventId}/participants/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventParticipants = participantsResponse.data;

        // Fetch judges
        const judgesResponse = await axios.get(`${API_URL}/events/${eventId}/judges/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventJudges = judgesResponse.data;

        // Fetch votes
        const votesResponse = await axios.get(`${API_URL}/events/coordinator/${eventId}/votes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventVotes = votesResponse.data;
        console.log("Fetched Votes:", eventVotes);

        // Fetch categories
        const categoriesResponse = await axios.get(`${API_URL}/events/${eventId}/categories/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventCategories = categoriesResponse.data;

        // Calculate stats
        setEventStats({
          participants: eventParticipants.length,
          judges: eventJudges.length,
          categories: eventCategories.length,
          votes: eventVotes.length,
          totalPossibleVotes: eventParticipants.length * eventJudges.length * eventCategories.length,
        });

        // Calculate top performers by category
        const performersByCategory = eventCategories.map((category) => {
          const categoryVotes = eventVotes.filter((v: Vote) => v.category.id === category.id);
          const participantScores = eventParticipants.map((participant) => {
            const participantVotes = categoryVotes.filter((v: Vote) => v.participant.id === participant.id);
            const totalScore = participantVotes.reduce((sum: number, vote: Vote) => sum + vote.score, 0);
            const avgScore = participantVotes.length > 0 ? totalScore / participantVotes.length : 0;

            return {
              participant,
              category,
              totalScore,
              avgScore,
              voteCount: participantVotes.length,
            };
          }).filter((p: Performer) => p.voteCount > 0);

          return participantScores.sort((a: Performer, b: Performer) => b.avgScore - a.avgScore)[0];
        }).filter(Boolean);

        console.log("Top Performers:", performersByCategory);
        setTopPerformers(performersByCategory);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch event details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, toast]);

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

  const handleUpdateStatus = async () => {
    try {
      await axios.put(
        `${API_URL}/events/${eventId}/update/`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvent((prev: Event) => ({ ...prev, status }));
      toast({
        title: "Success",
        description: "Event status updated successfully!",
      });
      setIsEditModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Event not found</h2>
          <p className="text-gray-600 mt-2">The event you're looking for doesn't exist.</p>
          <Link to="/coordinator-dashboard/events">
            <Button className="mt-4">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const completionPercentage = eventStats.totalPossibleVotes > 0
    ? Math.round((eventStats.votes / eventStats.totalPossibleVotes) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white border-b-2 border-yellow-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold">VoteRoyale</h1>
                <p className="text-sm text-gray-300">Event Details</p>
              </div>
            </div>
            <Link to="/coordinator-dashboard/events">
              <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-black">{event.title}</h2>
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
              </div>
              <p className="text-gray-600 text-lg mb-4">{event.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{new Date(event.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{event.location}</span>
                <span>•</span>
                <span>Max {event.max_participants} participants</span>
              </div>
            </div>
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                {/* <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Status
                </Button> */}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Event Status</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select onValueChange={setStatus} defaultValue={status}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateStatus}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{eventStats.participants}</p>
                  <p className="text-sm text-gray-600">Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{eventStats.judges}</p>
                  <p className="text-sm text-gray-600">Judges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{eventStats.categories}</p>
                  <p className="text-sm text-gray-600">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Vote className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{eventStats.votes}</p>
                  <p className="text-sm text-gray-600">Total Votes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Voting Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{completionPercentage}% Complete</span>
            </div>
            <div className="bg-gray-200 rounded-full h-4">
              <div
                className="bg-yellow-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {eventStats.votes} of {eventStats.totalPossibleVotes} possible votes submitted
            </p>
          </CardContent>
        </Card>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span>Leading Performers by Category</span>
              </CardTitle>
              <CardDescription>Current frontrunners based on average scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPerformers.map((performer: Performer, index: number) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">{performer.category.name}</span>
                    </div>
                    <p className="font-bold text-lg text-gray-900">{performer.participant.name}</p>
                    <p className="text-sm text-gray-600">{performer.participant.entry}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Average Score:</span>
                      <span className="font-bold text-yellow-700">{performer.avgScore.toFixed(1)}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Votes:</span>
                      <span className="text-sm text-gray-700">{performer.voteCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Management Sections */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Participants Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Participants</span>
                  </CardTitle>
                  <CardDescription>Manage event participants and their entries</CardDescription>
                </div>
                <Link to={`/coordinator-dashboard/events/${eventId}/participants`}>
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    <Plus className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Registered:</span>
                  <span className="font-semibold">{eventStats.participants}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available Spots:</span>
                  <span className="font-semibold">{event.max_participants - eventStats.participants}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Judges Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Judges</span>
                  </CardTitle>
                  <CardDescription>Manage event judges and their details</CardDescription>
                </div>
                <Link to={`/coordinator-dashboard/events/${eventId}/judges`}>
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    <Plus className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Judges:</span>
                  <span className="font-semibold">{eventStats.judges}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available Slots:</span>
                  <span className="font-semibold">{(event.maxJudges || 10) - eventStats.judges}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Award Categories</span>
                  </CardTitle>
                  <CardDescription>Manage judging categories and criteria</CardDescription>
                </div>
                <Link to={`/coordinator-dashboard/events/${eventId}/categories`}>
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    <Plus className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Categories:</span>
                  <span className="font-semibold">{eventStats.categories}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Criteria:</span>
                  <span className="font-semibold">{eventStats.categories * 3}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <Link to={`/coordinator-dashboard/events/${eventId}/judges`}>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Judges
            </Button>
          </Link>
          <Link to={`/coordinator-dashboard/events/${eventId}/votes`}>
            <Button variant="outline">
              <Vote className="h-4 w-4 mr-2" />
              View All Votes
            </Button>
          </Link>
          <Link to={`/coordinator-dashboard/events/${eventId}/results`}>
            <Button variant="outline">
              <Trophy className="h-4 w-4 mr-2" />
              Final Results
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;