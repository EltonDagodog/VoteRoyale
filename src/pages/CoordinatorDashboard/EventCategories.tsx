import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, ArrowLeft, Plus, Edit, Trash2, Award, Target, Star, Lock, Unlock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const EventCategories = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [eventCategories, setEventCategories] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCriteriaDialogOpen, setIsCriteriaDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    max_score: 100.0,
    weight: 1.0,
    status: "open",
    gender: "everyone",
    award_type: "major",  // Added award_type with default
  });
  const [criteria, setCriteria] = useState<any[]>([]);
  const [newCriterion, setNewCriterion] = useState({
    name: "",
    description: "",
    percentage: 0.0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const [eventResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/events/${eventId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/events/${eventId}/categories/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setEvent(eventResponse.data);
        setEventCategories(categoriesResponse.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch event or category data. Please try again.",
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

  if (!formData.name || !formData.description || !formData.max_score || !formData.weight || !formData.gender || !formData.award_type) {
    toast({
      title: "Error",
      description: "Please fill in all required fields.",
      variant: "destructive",
    });
    return;
  }

  try {
    if (editingCategory) {
      const updatedCategory = await axios.put(
        `${API_URL}/events/${eventId}/categories/${editingCategory.id}/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventCategories(
        eventCategories.map((c) =>
          c.id === editingCategory.id ? updatedCategory.data : c
        )
      );
      toast({
        title: "Award Category Updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      const newCategory = await axios.post(
        `${API_URL}/events/${eventId}/categories/`,
        {
          ...formData,
          criteria: [
            { name: "Beauty", description: "Overall physical beauty and appeal", percentage: 40.0 },
            { name: "Elegance", description: "Grace and sophistication in presentation", percentage: 35.0 },
            { name: "Stage Presence", description: "Confidence and charisma on stage", percentage: 25.0 },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventCategories([...eventCategories, newCategory.data]);
      toast({
        title: "Award Category Added",
        description: `${formData.name} has been created successfully.`,
      });
    }

    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      max_score: 100.0,
      weight: 1.0,
      status: "open",
      gender: "everyone",
      award_type: "major",
    });
  } catch (error: any) {
    console.error("Error adding/updating category:", error.response?.data || error.message);
    if (error.response && error.response.status === 403) {
      toast({
        title: "Forbidden",
        description: error.response.data.detail || "You do not have permission to perform this action.",
        variant: "destructive",
      });
    } else if (error.response && error.response.status === 400) {
      const errorData = error.response.data;
      if (errorData.detail) {
        toast({
          title: "Error",
          description: errorData.detail,
          variant: "destructive",
        });
      } else {
        const errorMessage = Object.values(errorData).flat().join(" ");
        toast({
          title: "Error",
          description: errorMessage || "Failed to add/update category. Please check the form data.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: editingCategory
          ? "Failed to update category. Please try again."
          : "Failed to add category. Please try again.",
        variant: "destructive",
      });
    }
  }
};

  const toggleStatus = async (categoryId: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    try {
      const category = eventCategories.find((c) => c.id === categoryId);
      const updatedCategory = await axios.put(
        `${API_URL}/events/${eventId}/categories/${categoryId}/`,
        { ...category, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventCategories(
        eventCategories.map((c) =>
          c.id === categoryId ? updatedCategory.data : c
        )
      );
      toast({
        title: `Award ${newStatus === "open" ? "Opened" : "Closed"}`,
        description: `${category?.name} is now ${newStatus} for voting.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    try {
      await axios.delete(`${API_URL}/events/${eventId}/categories/${categoryId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventCategories(eventCategories.filter((c) => c.id !== categoryId));
      toast({
        title: "Award Category Removed",
        description: `${categoryName} has been removed from the pageant.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      max_score: 100.0,
      weight: 1.0,
      status: "open",
      gender: "everyone",
      award_type: "major",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      max_score: category.max_score,
      weight: category.weight,
      status: category.status || "open",
      gender: category.gender || "everyone",
      award_type: category.award_type || "major",  // Include award_type
    });
    setIsDialogOpen(true);
  };

  const openCriteriaDialog = (category: any) => {
    setSelectedCategory(category);
    setCriteria(category.criteria || []);
    setIsCriteriaDialogOpen(true);
  };

  const addCriterion = () => {
    if (!newCriterion.name || newCriterion.percentage <= 0) {
      toast({
        title: "Error",
        description: "Criterion name and percentage are required.",
        variant: "destructive",
      });
      return;
    }

    const totalPercentage = criteria.reduce((sum, c) => sum + c.percentage, 0);
    if (totalPercentage + newCriterion.percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Total percentage cannot exceed 100%.",
        variant: "destructive",
      });
      return;
    }

    const criterion = {
      id: Date.now(),
      ...newCriterion,
    };
    setCriteria([...criteria, criterion]);
    setNewCriterion({ name: "", description: "", percentage: 0.0 });
  };

  const removeCriterion = (criterionId: number) => {
    setCriteria(criteria.filter((c) => c.id !== criterionId));
  };

  const saveCriteria = async () => {
    const totalPercentage = criteria.reduce((sum, c) => sum + c.percentage, 0);
    if (totalPercentage !== 100) {
      toast({
        title: "Invalid Criteria",
        description: "Total percentage must equal exactly 100%.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedCategory = await axios.put(
        `${API_URL}/events/${eventId}/categories/${selectedCategory.id}/`,
        { ...selectedCategory, criteria },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventCategories(
        eventCategories.map((c) =>
          c.id === selectedCategory.id ? updatedCategory.data : c
        )
      );
      setIsCriteriaDialogOpen(false);
      toast({
        title: "Criteria Updated",
        description: `Criteria for ${selectedCategory.name} have been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update criteria. Please try again.",
        variant: "destructive",
      });
    }
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
                <p className="text-sm text-gray-300">Manage Award Categories</p>
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
            <h2 className="text-3xl font-bold text-black">Award Categories</h2>
            <p className="text-gray-600 text-lg">{event.title}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Add Award Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Award Category" : "Add New Award Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Update award category information."
                    : "Create a new judging category for this pageant."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Award Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Evening Gown, Swimwear, Talent"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this category judges"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_score">Max Score</Label>
                    <Input
                      id="max_score"
                      type="number"
                      step="0.1"
                      value={formData.max_score}
                      onChange={(e) => setFormData({ ...formData, max_score: parseFloat(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Award Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="open">Open for Voting</option>
                    <option value="closed">Closed for Voting</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="everyone">Everyone</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="award_type">Award Type</Label>
                  <select
                    id="award_type"
                    value={formData.award_type}
                    onChange={(e) => setFormData({ ...formData, award_type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    {editingCategory ? "Update" : "Add"} Category
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          {eventCategories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Award className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">No Award Categories Yet</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Create your first award category to start organizing the pageant competition.
                </p>
                <Button onClick={openAddDialog} className="bg-yellow-600 hover:bg-yellow-700 text-black px-8 py-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Award Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            eventCategories.map((category) => {
              const totalPercentage = category.criteria?.reduce((sum: number, c: any) => sum + c.percentage, 0) || 0;
              const isValidCriteria = totalPercentage === 100;

              return (
                <Card key={category.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-black flex items-center space-x-2">
                          <Award className="h-5 w-5 text-yellow-600" />
                          <span>{category.name}</span>
                          <div className="flex items-center space-x-2">
                            {category.status === "open" ? (
                              <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded text-xs">
                                <Unlock className="h-3 w-3 text-green-600" />
                                <span className="text-green-700 font-medium">OPEN</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 bg-red-100 px-2 py-1 rounded text-xs">
                                <Lock className="h-3 w-3 text-red-600" />
                                <span className="text-red-700 font-medium">CLOSED</span>
                              </div>
                            )}
                            <span className="text-sm text-gray-600 capitalize">
                              ({category.award_type} Award)
                            </span>
                          </div>
                        </CardTitle>
                        <CardDescription className="text-base mt-2">{category.description}</CardDescription>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                          <span>Max Score: {category.max_score}</span>
                          <span>•</span>
                          <span>Weight: {category.weight}x</span>
                          <span>•</span>
                          <span>Gender: {category.gender.charAt(0).toUpperCase() + category.gender.slice(1)}</span>
                          <span>•</span>
                          <span>{category.criteria?.length || 0} Criteria</span>
                          {!isValidCriteria && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1 text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Invalid ({totalPercentage}%)</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatus(category.id, category.status)}
                          className={category.status === "open" ? "text-red-600 border-red-300 hover:bg-red-50" : "text-green-600 border-green-300 hover:bg-green-50"}
                        >
                          {category.status === "open" ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Close
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3 mr-1" />
                              Open
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCriteriaDialog(category)}
                        >
                          <Target className="h-3 w-3 mr-1" />
                          Criteria
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleDelete(category.id, category.name)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      {category.criteria?.map((criterion: any) => (
                        <div key={criterion.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-sm">{criterion.name}</span>
                            </div>
                            <span className="text-sm font-bold text-yellow-700">{criterion.percentage}%</span>
                          </div>
                          <p className="text-xs text-gray-600">{criterion.description}</p>
                        </div>
                      ))}
                    </div>
                    {!isValidCriteria && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Warning:</strong> Criteria percentages must total exactly 100%. Currently: {totalPercentage}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Criteria Management Dialog */}
        <Dialog open={isCriteriaDialogOpen} onOpenChange={setIsCriteriaDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Criteria - {selectedCategory?.name}</DialogTitle>
              <DialogDescription>
                Define the specific criteria judges will use. Total percentages must equal 100%.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Add New Criterion */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3">Add New Criterion</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Criterion name"
                    value={newCriterion.name}
                    onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={newCriterion.description}
                    onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Percentage"
                    value={newCriterion.percentage}
                    onChange={(e) => setNewCriterion({ ...newCriterion, percentage: parseFloat(e.target.value) || 0.0 })}
                    min="0"
                    max="100"
                  />
                  <Button onClick={addCriterion} size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Current Total */}
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-semibold">
                  Total: {criteria.reduce((sum, c) => sum + c.percentage, 0)}% / 100%
                </p>
              </div>

              {/* Existing Criteria */}
              <div className="space-y-3">
                <h4 className="font-semibold">Current Criteria</h4>
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{criterion.name}</span>
                        <span className="text-sm font-bold text-yellow-700">({criterion.percentage}%)</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => removeCriterion(criterion.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCriteriaDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveCriteria} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                  Save Criteria
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EventCategories;