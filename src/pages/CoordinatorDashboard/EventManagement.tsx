import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Crown, ArrowLeft, Plus, Calendar, Users, Vote, Award, Eye, Settings, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const EventManagement = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    status: "draft",
    location: "",
    max_participants: "",
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventStats, setEventStats] = useState<{ [key: string]: { participants: number; judges: number; votes: number; totalPossibleVotes: number } }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      navigate("/login");
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== "coordinator") {
      navigate("/login");
      return;
    }

    setCurrentUser(userData);
    fetchEvents();
  }, [navigate]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/events/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const events = response.data;
      setUserEvents(events);

      // Fetch stats for each event
      const statsPromises = events.map(async (event: any) => {
        const stats = await getEventStats(event.id);
        return { eventId: event.id, stats };
      });
      const statsResults = await Promise.all(statsPromises);
      const statsMap = statsResults.reduce((acc: any, { eventId, stats }) => {
        acc[eventId] = stats;
        return acc;
      }, {});
      setEventStats(statsMap);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEventStats = async (eventId: string) => {
    try {
      // Fetch participants
      const participantsResponse = await axios.get(`${API_URL}/events/${eventId}/participants/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const participantsCount = participantsResponse.data.length;

      // Fetch judges
      const judgesResponse = await axios.get(`${API_URL}/events/${eventId}/judges/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const judgesCount = judgesResponse.data.length;

      // Fetch votes
      const votesResponse = await axios.get(`${API_URL}/events/${eventId}/votes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Assuming the votes endpoint returns an object like { votes: number, total_possible_votes: number }
      const votesCount = votesResponse.data.votes || 0;
      const totalPossibleVotes = votesResponse.data.total_possible_votes || 0;

      return {
        participants: participantsCount,
        judges: judgesCount,
        votes: votesCount,
        totalPossibleVotes: totalPossibleVotes,
      };
    } catch (error) {
      console.error(`Error fetching stats for event ${eventId}:`, error);
      return { participants: 0, judges: 0, votes: 0, totalPossibleVotes: 0 };
    }
  };

  const handleCreateEvent = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);

    const eventData = {
      title: formData.title,
      description: formData.description,
      date: formData.date || new Date().toISOString(),
      status: formData.status,
      location: formData.location,
      max_participants: parseInt(formData.max_participants) || 50,
    };

    try {
      const response = await axios.post(
        `${API_URL}/events/`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserEvents([...userEvents, response.data]);
      // Fetch stats for the new event
      const stats = await getEventStats(response.data.id);
      setEventStats((prev) => ({ ...prev, [response.data.id]: stats }));
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      setIsCreateModalOpen(false);
      setFormData({ title: "", description: "", date: "", status: "draft", location: "", max_participants: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    const eventData = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      status: formData.status,
      location: formData.location,
      max_participants: parseInt(formData.max_participants),
    };

    try {
      const response = await axios.put(
        `${API_URL}/events/${eventId}/update/`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserEvents(userEvents.map((event) => (event.id === eventId ? response.data : event)));
      // Refresh stats for the updated event
      const stats = await getEventStats(eventId);
      setEventStats((prev) => ({ ...prev, [eventId]: stats }));
      toast({
        title: "Success",
        description: "Event updated successfully!",
      });
      setIsEditModalOpen(false);
      setFormData({ title: "", description: "", date: "", status: "draft", location: "", max_participants: "" });
      setEditingEventId(null);
    } catch (error) {
      console.log(eventData);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date.split(".")[0],
      status: event.status,
      location: event.location,
      max_participants: event.max_participants.toString(),
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/events/${eventId}/delete/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserEvents(userEvents.filter((event) => event.id !== eventId));
      setEventStats((prev) => {
        const updatedStats = { ...prev };
        delete updatedStats[eventId];
        return updatedStats;
      });
      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-300";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "closed":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (!currentUser) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
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
                <p className="text-sm text-gray-300">Event Management</p>
              </div>
            </div>
            <Link to="/coordinator-dashboard">
              <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-black">Event Management</h2>
            <p className="text-gray-600 text-lg">Create and manage your events</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
        ) : userEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Calendar className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">No Events Created Yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Get started by creating your first event. You can add participants, assign judges, and manage the entire voting process.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8 py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {userEvents.map((event) => {
              const stats = eventStats[event.id] || { participants: 0, judges: 0, votes: 0, totalPossibleVotes: 0 };
              const completionPercentage = stats.totalPossibleVotes > 0
                ? Math.round((stats.votes / stats.totalPossibleVotes) * 100)
                : 0;

              return (
                <Card key={event.id} className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-xl text-black">{event.title}</CardTitle>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">{event.description}</CardDescription>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </span>
                          <span>•</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(event)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Event</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => handleUpdateEvent(event.id, e)} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="title">Event Title</Label>
                                <Input
                                  id="title"
                                  value={formData.title}
                                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                  id="description"
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                  id="date"
                                  type="datetime-local"
                                  value={formData.date}
                                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                  value={formData.status}
                                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                  id="location"
                                  value={formData.location}
                                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="max_participants">Max Participants</Label>
                                <Input
                                  id="max_participants"
                                  type="number"
                                  value={formData.max_participants}
                                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                  required
                                />
                              </div>
                              <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold" disabled={isLoading}>
                                {isLoading ? "Updating..." : "Update Event"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Statistics Grid */}
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Participants</p>
                          <p className="font-semibold text-blue-700">{stats.participants}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Judges</p>
                          <p className="font-semibold text-green-700">{stats.judges}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                        <Vote className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">Votes</p>
                          <p className="font-semibold text-purple-700">{stats.votes}/{stats.totalPossibleVotes}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="font-semibold text-yellow-700">{completionPercentage}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Voting Progress</span>
                        <span>{completionPercentage}% Complete</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-yellow-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/coordinator-dashboard/events/${event.id}`}>
                        <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </Link>
                      <Link to={`/coordinator-dashboard/events/${event.id}/participants`}>
                        <Button size="sm" variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          Participants
                        </Button>
                      </Link>
                      <Link to={`/coordinator-dashboard/events/${event.id}/judges`}>
                        <Button size="sm" variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          Judges
                        </Button>
                      </Link>
                      <Link to={`/coordinator-dashboard/events/${event.id}/votes`}>
                        <Button size="sm" variant="outline">
                          <Vote className="h-3 w-3 mr-1" />
                          Votes
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
    </div>
  );
};

export default EventManagement;