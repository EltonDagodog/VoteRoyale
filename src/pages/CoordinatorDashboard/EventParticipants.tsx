import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, ArrowLeft, Plus, Edit, Trash2, User, Calendar, FileText, Mail, MapPin, Hash, Users, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const EventParticipants = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);
  const [eventCategories, setEventCategories] = useState<any[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contestant_number: "",
    origin: "",
    
    entry: "",
    image: "",
    gender: "Female",
    registration_date: new Date().toISOString().split('T')[0],
  });
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

        // Fetch participants
        const participantsResponse = await axios.get(`${API_URL}/events/${eventId}/participants/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventParticipants(participantsResponse.data);

        // Fetch categories
        const categoriesResponse = await axios.get(`${API_URL}/events/${eventId}/categories/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventCategories(categoriesResponse.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch event data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, toast]);

  const filteredParticipants = selectedGender === "all"
    ? eventParticipants
    : eventParticipants.filter(p => p.gender === selectedGender);

  const maleCount = eventParticipants.filter(p => p.gender === "Male").length;
  const femaleCount = eventParticipants.filter(p => p.gender === "Female").length;

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (editingParticipant) {
      // Update existing participant
      const updatedParticipant = await axios.put(
        `${API_URL}/events/${eventId}/participants/${editingParticipant.id}/`,
        { ...formData, contestant_number: parseInt(formData.contestant_number) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventParticipants(eventParticipants.map(p =>
        p.id === editingParticipant.id ? updatedParticipant.data : p
      ));
      toast({
        title: "Contestant Updated",
        description: `Contestant #${formData.contestant_number} ${formData.name} has been updated successfully.`,
      });
    } else {
      // Add new participant
      if (eventParticipants.length >= (event?.max_participants || 50)) {
        toast({
          title: "Registration Full",
          description: "This pageant has reached its maximum contestant capacity.",
          variant: "destructive",
        });
        return;
      }

      // Check if contestant number is already taken
      const numberTaken = eventParticipants.some(p => p.contestant_number === parseInt(formData.contestant_number));
      if (numberTaken) {
        toast({
          title: "Number Taken",
          description: `Contestant number ${formData.contestant_number} is already assigned.`,
          variant: "destructive",
        });
        return;
      }

      // Format registration_date to ISO 8601 datetime
      const formattedData = {
        ...formData,
        contestant_number: parseInt(formData.contestant_number),
        registration_date: new Date(formData.registration_date).toISOString(), // e.g., "2025-05-30T00:00:00.000Z"
      };

      const newParticipant = await axios.post(
        `${API_URL}/events/${eventId}/participants/`,
        formattedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("New Participant Response:", newParticipant.data);
      setEventParticipants([...eventParticipants, newParticipant.data]);
      toast({
        title: "Contestant Added",
        description: `Contestant #${formData.contestant_number} ${formData.name} has been registered successfully.`,
      });
    }

    setIsDialogOpen(false);
    setEditingParticipant(null);
    setFormData({
      name: "",
      email: "",
      contestant_number: "",
      origin: "",
      entry: "",
      image: "",
      gender: "Female",
      registration_date: new Date().toISOString().split('T')[0],
    });
  } catch (error: any) {
    // Log the error for debugging
    console.error("Error adding/updating participant:", error.response?.data || error.message);
    toast({
      title: "Error",
      description: editingParticipant
        ? "Failed to update contestant. Please try again: " + (error.response?.data?.detail || error.message)
        : "Failed to add contestant. Please try again: " + (error.response?.data?.detail || error.message),
      variant: "destructive",
    });
  }
};

  const handleEdit = (participant: any) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name,
      email: participant.email || "",
      contestant_number: participant.contestant_number?.toString() || "",
      origin: participant.origin || "",
      
      entry: participant.entry,
      image: participant.image || "",
      gender: participant.gender || "Female",
      registration_date: participant.registration_date,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (participantId: string, participantName: string, contestantNumber: number) => {
    try {
      await axios.delete(`${API_URL}/events/${eventId}/participants/${participantId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventParticipants(eventParticipants.filter(p => p.id !== participantId));
      toast({
        title: "Contestant Removed",
        description: `Contestant #${contestantNumber} ${participantName} has been removed from the pageant.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove contestant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setEditingParticipant(null);
    const nextNumber = Math.max(...eventParticipants.map(p => p.contestant_number || 0), 0) + 1;
    setFormData({
      name: "",
      email: "",
      contestant_number: nextNumber.toString(),
      origin: "",
      
      entry: "",
      image: "",
      gender: "Female",
      registration_date: new Date().toISOString().split('T')[0],
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
      {/* Header */}
      <header className="bg-black text-white border-b-2 border-yellow-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold">VoteRoyale</h1>
                <p className="text-sm text-gray-300">Manage Contestants</p>
              </div>
            </div>
            <Link to={`/coordinator-dashboard/events/${eventId}`}>
              <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
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
            <h2 className="text-3xl font-bold text-black">Pageant Contestants</h2>
            <p className="text-gray-600 text-lg">{event.title}</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Add Contestant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingParticipant ? "Edit Contestant" : "Add New Contestant"}
                </DialogTitle>
                <DialogDescription>
                  {editingParticipant 
                    ? "Update contestant information." 
                    : "Register a new contestant for this pageant."
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contestant_number">Contestant #</Label>
                    <Input
                      id="contestant_number"
                      type="number"
                      value={formData.contestant_number}
                      onChange={(e) => setFormData({...formData, contestant_number: e.target.value})}
                      placeholder="Number"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender Category</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="contestant@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="registration_date">Registration Date</Label>
                    <Input
                      id="registration_date"
                      type="date"
                      value={formData.registration_date}
                      onChange={(e) => setFormData({...formData, registration_date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="origin">Origin/Representing</Label>
                    <Input
                      id="origin"
                      value={formData.origin}
                      onChange={(e) => setFormData({...formData, origin: e.target.value})}
                      placeholder="City, State or School/Organization"
                      required
                    />
                  </div>

                  

                  <div className="col-span-2">
                    <Label htmlFor="entry">Entry/Talent Description</Label>
                    <Input
                      id="entry"
                      value={formData.entry}
                      onChange={(e) => setFormData({...formData, entry: e.target.value})}
                      placeholder="Describe their talent or entry"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="image">Profile Image URL</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      placeholder="https://example.com/image.jpg (optional)"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    {editingParticipant ? "Update" : "Add"} Contestant
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{eventParticipants.length}</p>
                  <p className="text-sm text-gray-600">Total Contestants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-pink-600" />
                <div>
                  <p className="text-2xl font-bold text-pink-700">{femaleCount}</p>
                  <p className="text-sm text-gray-600">Female Contestants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">{maleCount}</p>
                  <p className="text-sm text-gray-600">Male Contestants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{event.max_participants - eventParticipants.length}</p>
                  <p className="text-sm text-gray-600">Available Spots</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gender Filter */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Button
              variant={selectedGender === "all" ? "default" : "outline"}
              onClick={() => setSelectedGender("all")}
              className={selectedGender === "all" ? "bg-yellow-600 hover:bg-yellow-700 text-black" : ""}
            >
              All Contestants ({eventParticipants.length})
            </Button>
            <Button
              variant={selectedGender === "Female" ? "default" : "outline"}
              onClick={() => setSelectedGender("Female")}
              className={selectedGender === "Female" ? "bg-pink-600 hover:bg-pink-700 text-white" : ""}
            >
              Female ({femaleCount})
            </Button>
            <Button
              variant={selectedGender === "Male" ? "default" : "outline"}
              onClick={() => setSelectedGender("Male")}
              className={selectedGender === "Male" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
              Male ({maleCount})
            </Button>
          </div>
        </div>

        {/* Contestants Table */}
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle>
              {selectedGender === "all" ? "All Contestants" : `${selectedGender} Contestants`}
            </CardTitle>
            <CardDescription>
              Manage contestants for {event.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="h-20 w-20 text-yellow-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {selectedGender === "all" ? "No Contestants Yet" : `No ${selectedGender} Contestants`}
                </h3>
                <p className="text-gray-500 mb-6">Start by adding contestants to this pageant.</p>
                <Button onClick={openAddDialog} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contestant
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Contestant #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Email</TableHead>
                    
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant) => (
                    <TableRow key={participant.id} className="hover:bg-yellow-50">
                      <TableCell>
                        <Avatar className="h-12 w-12 border-2 border-yellow-500">
                          <AvatarImage src={participant.image || "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=500&fit=crop&crop=face"} alt={participant.name} />
                          <AvatarFallback className="bg-yellow-100 text-yellow-800">
                            {participant.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Hash className="h-4 w-4 text-yellow-600" />
                          <span className="font-bold text-yellow-700">{participant.contestant_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{participant.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          participant.gender === "Female" 
                            ? "bg-pink-100 text-pink-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {participant.gender}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span>{participant.origin}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span>{participant.email}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                            onClick={() => handleEdit(participant)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleDelete(participant.id, participant.name, participant.contestant_number)}
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

export default EventParticipants;