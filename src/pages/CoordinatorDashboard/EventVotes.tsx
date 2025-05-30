import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowLeft, Vote, User, Award, MessageSquare, Calendar, Filter } from "lucide-react";
import { useEffect, useState } from "react";
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
  submittedAt?: string;
}

interface Filters {
  judge: string;
  participant: string;
  category: string;
}

const EventVotes = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventVotes, setEventVotes] = useState<Vote[]>([]);
  const [eventParticipants, setEventParticipants] = useState<Participant[]>([]);
  const [eventJudges, setEventJudges] = useState<Judge[]>([]);
  const [eventCategories, setEventCategories] = useState<Category[]>([]);
  const [filteredVotes, setFilteredVotes] = useState<Vote[]>([]);
  const [filters, setFilters] = useState<Filters>({
    judge: "",
    participant: "",
    category: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) {
        setError("No event ID provided.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch event details
        const eventResponse = await axios.get(`${API_URL}/events/${eventId}/`, config);
        setEvent(eventResponse.data);

        // Fetch related data in parallel
        const [votesResponse, participantsResponse, judgesResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/events/coordinator/${eventId}/votes/`, config), // Fixed endpoint
          axios.get(`${API_URL}/events/${eventId}/participants/`, config),
          axios.get(`${API_URL}/events/${eventId}/judges/`, config),
          axios.get(`${API_URL}/events/${eventId}/categories/`, config),
        ]);

        const evtVotes: Vote[] = votesResponse.data;
        const evtParticipants: Participant[] = participantsResponse.data;
        const evtJudges: Judge[] = judgesResponse.data;
        const evtCategories: Category[] = categoriesResponse.data;
        console.log("Votes:", evtVotes);
        console.log("Judges:", evtJudges);
        console.log("Participants:", evtParticipants);
        console.log("Categories:", evtCategories);

        // Map submitted_at to submittedAt
        const mappedVotes = evtVotes.map((vote) => ({
          ...vote,
          submittedAt: vote.submitted_at,
        }));

        setEventVotes(mappedVotes);
        setFilteredVotes(mappedVotes);
        setEventParticipants(evtParticipants);
        setEventJudges(evtJudges);
        setEventCategories(evtCategories);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load event data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  useEffect(() => {
    let filtered = eventVotes;

    console.log("Current Filters:", filters);

    if (filters.judge) {
      filtered = filtered.filter((vote) => String(vote.judge.id) === filters.judge);
    }
    if (filters.participant) {
      filtered = filtered.filter((vote) => String(vote.participant.id) === filters.participant);
    }
    if (filters.category) {
      filtered = filtered.filter((vote) => String(vote.category.id) === filters.category);
    }

    console.log("Filtered Votes:", filtered);
    setFilteredVotes(filtered);
  }, [filters, eventVotes]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 75) return "bg-blue-100 text-blue-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const clearFilters = () => {
    setFilters({ judge: "", participant: "", category: "" });
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <Link to={`/coordinator-dashboard`}>
            <Button className="mt-4 bg-yellow-600 text-black">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-semibold">Event not found.</p>
          <Link to={`/coordinator-dashboard`}>
            <Button className="mt-4 bg-yellow-600 text-black">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPossibleVotes = eventParticipants.length * eventJudges.length * eventCategories.length;
  const completionPercentage = totalPossibleVotes > 0 ? Math.round((eventVotes.length / totalPossibleVotes) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white border-b-2 border-yellow-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold">VoteRoyale</h1>
                <p className="text-sm text-gray-300">View Votes</p>
              </div>
            </div>
            <Link to={`/coordinator-dashboard/events/${eventId}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black">Voting Overview</h2>
          <p className="text-gray-600 text-lg">{event.title}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Vote className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">{eventVotes.length}</p>
                  <p className="text-sm text-gray-600">Total Votes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{eventJudges.length}</p>
                  <p className="text-sm text-gray-600">Active Judges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-700">{eventCategories.length}</p>
                  <p className="text-sm text-gray-600">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{completionPercentage}%</p>
                  <p className="text-sm text-gray-600">Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Voting Progress</CardTitle>
            <CardDescription>Overall voting completion across all judges and categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-yellow-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {eventVotes.length} of {totalPossibleVotes} possible votes submitted
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Votes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judge</label>
                <select
                  value={filters.judge}
                  onChange={(e) => setFilters({ ...filters, judge: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Judges</option>
                  {eventJudges.map((judge) => (
                    <option key={judge.id} value={judge.id}>
                      {judge.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Participant</label>
                <select
                  value={filters.participant}
                  onChange={(e) => setFilters({ ...filters, participant: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Participants</option>
                  {eventParticipants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Categories</option>
                  {eventCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Votes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Votes</CardTitle>
            <CardDescription>
              {filteredVotes.length === eventVotes.length
                ? `Showing all ${eventVotes.length} votes`
                : `Showing ${filteredVotes.length} of ${eventVotes.length} votes`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredVotes.length === 0 ? (
              <div className="text-center py-12">
                <Vote className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Votes Found</h3>
                <p className="text-gray-500">
                  {eventVotes.length === 0
                    ? "No votes have been submitted yet for this event."
                    : "No votes match your current filters. Try adjusting your search criteria."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judge</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVotes.map((vote) => (
                    <TableRow key={vote.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vote.judge?.name || "Unknown Judge"}</p>
                          <p className="text-sm text-gray-500">{vote.judge?.specialization || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vote.participant?.name || "Unknown Participant"}</p>
                          <p className="text-sm text-gray-500">#{vote.participant?.contestant_number || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{vote.category?.name || "Unknown Category"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(vote.score)}>
                          {vote.score}/100
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {vote.comments ? (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 truncate">{vote.comments}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No comments</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {vote.submittedAt
                          ? `${new Date(vote.submittedAt).toLocaleDateString()} ${new Date(vote.submittedAt).toLocaleTimeString()}`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventVotes;