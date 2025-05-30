import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowLeft, Trophy, Award, Medal, Star, Download, BarChart3, Printer } from "lucide-react";
import { useEffect, useState } from "react";
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
  id: number; // Changed to number based on API response
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

interface CategoryResult {
  category: Category;
  results: Array<{
    participant: Participant;
    totalScore: number;
    averageScore: number;
    voteCount: number;
    rank: number;
  }>;
  totalVotes: number;
}

interface OverallResult {
  participant: Participant;
  overallAverage: number;
  totalVotes: number;
  categoryScores: Array<{
    category: string;
    averageScore: number;
    weightedScore: number;
    voteCount: number;
  }>;
  rank: number;
}

const EventResults = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [categoryResults, setCategoryResults] = useState<CategoryResult[]>([]);
  const [overallResults, setOverallResults] = useState<OverallResult[]>([]);
  const [eventStats, setEventStats] = useState<{
    participants: number;
    judges: number;
    categories: number;
    votes: number;
    participantsWithVotes: number;
  }>({ participants: 0, judges: 0, categories: 0, votes: 0, participantsWithVotes: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // For filtering
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const API_URL = import.meta.env.VITE_API_URL || "http://192.168.6.195:8000/api";
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [eventResponse, participantsResponse, judgesResponse, votesResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/events/${eventId}/`, config),
          axios.get(`${API_URL}/events/${eventId}/participants/`, config),
          axios.get(`${API_URL}/events/${eventId}/judges/`, config),
          axios.get(`${API_URL}/events/coordinator/${eventId}/votes/`, config),
          axios.get(`${API_URL}/events/${eventId}/categories/`, config),
        ]);

        const currentEvent: Event = eventResponse.data;
        const eventParticipants: Participant[] = participantsResponse.data;
        const eventJudges: Judge[] = judgesResponse.data;
        const eventVotes: Vote[] = votesResponse.data;
        const eventCategories: Category[] = categoriesResponse.data;

        console.log("Event:", currentEvent);
        console.log("Participants:", eventParticipants);
        console.log("Judges:", eventJudges);
        console.log("Votes:", eventVotes);
        console.log("Categories:", eventCategories);

        setEvent(currentEvent);

        // Calculate results by category
        const catResults = eventCategories.map((category) => {
          const categoryVotes = eventVotes.filter((v) => v.category.id === category.id);

          const participantResults = eventParticipants
            .map((participant) => {
              const participantVotes = categoryVotes.filter((v) => v.participant.id === participant.id);

              if (participantVotes.length === 0) {
                return {
                  participant,
                  totalScore: 0,
                  averageScore: 0,
                  voteCount: 0,
                  rank: 0,
                };
              }

              const totalScore = participantVotes.reduce((sum, vote) => sum + vote.score, 0);
              const averageScore = totalScore / participantVotes.length;

              return {
                participant,
                totalScore,
                averageScore,
                voteCount: participantVotes.length,
                votes: participantVotes,
                rank: 0,
              };
            })
            .filter((result) => result.voteCount > 0)
            .sort((a, b) => b.averageScore - a.averageScore)
            .map((result, index) => ({ ...result, rank: index + 1 }));

          return {
            category,
            results: participantResults,
            totalVotes: categoryVotes.length,
          };
        });

        setCategoryResults(catResults);

        // Calculate overall results (weighted average across all categories)
        const overallParticipantResults = eventParticipants
          .map((participant) => {
            let totalWeightedScore = 0;
            let totalWeight = 0;
            let totalVotes = 0;

            const categoryScores = eventCategories
              .map((category) => {
                const categoryVotes = eventVotes.filter(
                  (v) => v.category.id === category.id && v.participant.id === participant.id
                );

                if (categoryVotes.length === 0) return null;

                const avgScore = categoryVotes.reduce((sum, vote) => sum + vote.score, 0) / categoryVotes.length;
                const weightedScore = avgScore * category.weight;

                totalWeightedScore += weightedScore;
                totalWeight += category.weight;
                totalVotes += categoryVotes.length;

                return {
                  category: category.name,
                  averageScore: avgScore,
                  weightedScore,
                  voteCount: categoryVotes.length,
                };
              })
              .filter(Boolean);

            if (totalVotes === 0) return null;

            const overallAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

            return {
              participant,
              overallAverage,
              totalVotes,
              categoryScores,
              rank: 0,
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.overallAverage - a.overallAverage)
          .map((result, index) => ({ ...result, rank: index + 1 }));

        setOverallResults(overallParticipantResults);

        setEventStats({
          participants: eventParticipants.length,
          judges: eventJudges.length,
          categories: eventCategories.length,
          votes: eventVotes.length,
          participantsWithVotes: overallParticipantResults.length,
        });
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || "Failed to load event results. Please try again.";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, toast]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-black"><Trophy className="h-3 w-3 mr-1" />1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white"><Medal className="h-3 w-3 mr-1" />2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white"><Award className="h-3 w-3 mr-1" />3rd</Badge>;
    return <Badge variant="outline">{rank}th</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 font-bold";
    if (score >= 75) return "text-blue-600 font-semibold";
    if (score >= 60) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const exportResults = () => {
    toast({
      title: "Results Exported",
      description: "Results have been exported to CSV format.",
    });
  };

  const handlePrintCategory = (categoryId: number) => {
    const printContent = document.getElementById(`printable-${categoryId}`);
    if (printContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
    }
  };

  // Debug logs
  console.log("Selected Category:", selectedCategory);
  console.log("Category Results:", categoryResults);
  const filteredCategoryResults = selectedCategory
    ? categoryResults.filter((cr) => cr.category.id === Number(selectedCategory))
    : categoryResults;
  console.log("Filtered Category Results:", filteredCategoryResults);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error || "Event not found."}</p>
          <Link to={`/coordinator-dashboard/events`}>
            <Button className="mt-4 bg-yellow-600 text-black">Back to Events</Button>
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
                <p className="text-sm text-gray-300">Event Results</p>
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
            <h2 className="text-3xl font-bold text-black">Final Results</h2>
            <p className="text-gray-600 text-lg">{event.title}</p>
          </div>
          <Button onClick={exportResults} className="bg-yellow-600 hover:bg-yellow-700 text-black">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>

        {/* Filtering Section */}
        <div className="mb-8">
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 mr-2">
            Filter by Category:
          </label>
          <select
            id="category-filter"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="border border-gray-300 rounded-md p-2"
          >
            <option value="">All Categories</option>
            {categoryResults.map((cr) => (
              <option key={cr.category.id} value={cr.category.id.toString()}>
                {cr.category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{eventStats.participantsWithVotes}</p>
              <p className="text-sm text-gray-600">Ranked Participants</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{eventStats.votes}</p>
              <p className="text-sm text-gray-600">Total Votes Cast</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{eventStats.categories}</p>
              <p className="text-sm text-gray-600">Award Categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{eventStats.judges}</p>
              <p className="text-sm text-gray-600">Active Judges</p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Rankings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <span>Overall Rankings</span>
            </CardTitle>
            <CardDescription>Combined results across all categories (weighted)</CardDescription>
          </CardHeader>
          <CardContent>
            {overallResults.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Available</h3>
                <p className="text-gray-500">Results will appear once judges submit their votes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {overallResults.slice(0, 10).map((result, index) => (
                  <div
                    key={result.participant.id}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0 ? "border-yellow-400 bg-yellow-50" :
                      index === 1 ? "border-gray-400 bg-gray-50" :
                      index === 2 ? "border-amber-400 bg-amber-50" :
                      "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getRankBadge(result.rank)}
                          <div>
                            <h3 className="font-bold text-lg">{result.participant.name}</h3>
                            <p className="text-gray-600">{result.participant.entry}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl ${getScoreColor(result.overallAverage)}`}>
                          {result.overallAverage.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-500">{result.totalVotes} votes</p>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {result.categoryScores.map((catScore, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-gray-600">{catScore.category}:</span>
                          <span className={`ml-2 ${getScoreColor(catScore.averageScore)}`}>
                            {catScore.averageScore.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Results */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-black">Results by Category</h3>

          {filteredCategoryResults.map((categoryResult) => (
            <Card key={categoryResult.category.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <span>{categoryResult.category.name}</span>
                </CardTitle>
                <CardDescription>
                  {categoryResult.category.description} • {categoryResult.totalVotes} votes submitted
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryResult.results.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No votes submitted for this category yet.</p>
                ) : (
                  <div className="space-y-3">
                    {categoryResult.results.slice(0, 5).map((result) => (
                      <div key={result.participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getRankBadge(result.rank)}
                          <div>
                            <p className="font-semibold">{result.participant.name}</p>
                            <p className="text-sm text-gray-600">{result.participant.entry}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl ${getScoreColor(result.averageScore)}`}>
                            {result.averageScore.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-500">{result.voteCount} votes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Print Button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => handlePrintCategory(categoryResult.category.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Results
                  </Button>
                </div>
                {/* Hidden Printable Section */}
                <div id={`printable-${categoryResult.category.id}`} className="hidden print:block">
                  <h2 className="text-2xl font-bold mb-4">{categoryResult.category.name} Results</h2>
                  <p className="mb-4">{categoryResult.category.description}</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="border p-2 text-left">Rank</th>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Entry</th>
                        <th className="border p-2 text-right">Average Score</th>
                        <th className="border p-2 text-right">Votes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryResult.results.map((result) => (
                        <tr key={result.participant.id} className="border-b">
                          <td className="border p-2">{getRankBadge(result.rank)}</td>
                          <td className="border p-2">{result.participant.name}</td>
                          <td className="border p-2">{result.participant.entry}</td>
                          <td className={`border p-2 text-right ${getScoreColor(result.averageScore)}`}>
                            {result.averageScore.toFixed(1)}
                          </td>
                          <td className="border p-2 text-right">{result.voteCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4">Total Votes: {categoryResult.totalVotes}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventResults;