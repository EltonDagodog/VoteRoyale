import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, ArrowLeft, Plus, Edit, Trash2, User, Users, FileText, Mail, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const EventJudges = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [eventJudges, setEventJudges] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialization: "",
    image: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const [eventResponse, judgesResponse] = await Promise.all([
          axios.get(`${API_URL}/events/${eventId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/events/${eventId}/judges/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setEvent(eventResponse.data);
        setEventJudges(judgesResponse.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch event or judge data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic form validation
    if (!formData.name || !formData.email || !formData.specialization) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Email, Specialization).",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingJudge) {
        const updatedJudge = await axios.put(
          `${API_URL}/events/${eventId}/judges/${editingJudge.id}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEventJudges(eventJudges.map(j => j.id === editingJudge.id ? updatedJudge.data : j));
        toast({
          title: "Judge Updated",
          description: `Judge ${formData.name} has been updated successfully.`,
        });
      } else {
        if (eventJudges.length >= (event?.max_judges || 10)) {
          toast({
            title: "Judge Limit Reached",
            description: "This event has reached its maximum judge capacity.",
            variant: "destructive",
          });
          return;
        }

        const newJudge = await axios.post(
          `${API_URL}/events/${eventId}/judges/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEventJudges([...eventJudges, newJudge.data]);
        toast({
          title: "Judge Added",
          description: `Judge ${formData.name} has been registered successfully.`,
        });
      }

      setIsDialogOpen(false);
      setEditingJudge(null);
      setFormData({
        name: "",
        email: "",
        specialization: "",
        image: "",
      });
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        const errorData = error.response.data;
        if (errorData.email) {
          toast({
            title: "Error",
            description: "A judge with this email address already exists.",
            variant: "destructive",
          });
          
        } else if (errorData.detail) {
          toast({
            title: "Error",
            description: errorData.detail,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add/update judge. Please check the form data.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: editingJudge
            ? "Failed to update judge. Please try again."
            : "Failed to add judge. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (judge: any) => {
    setEditingJudge(judge);
    setFormData({
      name: judge.name,
      email: judge.email,
      specialization: judge.specialization,
      image: judge.image || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (judgeId: string, judgeName: string, accessCode: string) => {
    try {
      await axios.delete(`${API_URL}/events/${eventId}/judges/${judgeId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventJudges(eventJudges.filter(j => j.id !== judgeId));
      toast({
        title: "Judge Removed",
        description: `Judge ${judgeName} (${accessCode}) has been removed from the event.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove judge. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setEditingJudge(null);
    setFormData({
      name: "",
      email: "",
      specialization: "",
      image: "",
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white border-b-2 border-yellow-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold">VoteRoyale</h1>
                <p className="text-sm text-gray-300">Manage Judges</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-black">Event Judges</h2>
            <p className="text-gray-600 text-lg">{event.title}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Add Judge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingJudge ? "Edit Judge" : "Add New Judge"}</DialogTitle>
                <DialogDescription>
                  {editingJudge
                    ? "Update judge information."
                    : "Register a new judge for this event. An access code will be generated automatically."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="judge@email.com"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="e.g., Technology, Fashion"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="image">Profile Image URL</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://example.com/image.jpg (optional)"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    {editingJudge ? "Update" : "Add"} Judge
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{eventJudges.length}</p>
                  <p className="text-sm text-gray-600">Total Judges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {[...new Set(eventJudges.map((j) => j.specialization))].length}
                  </p>
                  <p className="text-sm text-gray-600">Unique Specializations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">{(event?.max_judges || 10) - eventJudges.length}</p>
                  <p className="text-sm text-gray-600">Available Judge Slots</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle>All Judges</CardTitle>
            <CardDescription>Manage judges for {event.title}</CardDescription>
          </CardHeader>
          <CardContent>
            {eventJudges.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="h-20 w-20 text-yellow-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Judges Assigned</h3>
                <p className="text-gray-500 mb-6">Start by adding judges to this event.</p>
                <Button onClick={openAddDialog} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Judge
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Access Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventJudges.map((judge) => (
                    <TableRow key={judge.id} className="hover:bg-yellow-50">
                      <TableCell>
                        <Avatar className="h-12 w-12 border-2 border-yellow-500">
                          <AvatarImage src={judge.image} alt={judge.name} />
                          <AvatarFallback className="bg-yellow-100 text-yellow-800">
                            {judge.name.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Hash className="h-4 w-4 text-yellow-600" />
                          <span className="font-bold text-yellow-700">{judge.access_code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{judge.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span>{judge.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{judge.specialization}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                            onClick={() => handleEdit(judge)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleDelete(judge.id, judge.name, judge.access_code)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
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

export default EventJudges;