import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crown, CheckCircle, ArrowLeft, Star, MessageSquare } from "lucide-react";

// Define interfaces
interface CriterionScore {
  [key: string]: number;
}

interface Vote {
  id: number;
  judge: any; // Adjust based on JudgeSerializer
  participant: {
    id: string;
    name: string;
    // Add other participant fields as needed
  };
  category: any; // Adjust based on CategorySerializer
  event: any; // Adjust based on EventSerializer
  score: number;
  comments: string;
  submitted_at: string;
  criteria_scores?: CriterionScore;
}

interface VoteData {
  category: string;
  votes: Vote[];
}

const VotingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [voteData, setVoteData] = useState<VoteData | null>(null);

  useEffect(() => {
    // Check if we have vote data from the previous page
    if (location.state) {
      setVoteData(location.state as VoteData);
    } else {
      // If no state, redirect back to dashboard
      navigate("/judge-dashboard");
    }
  }, [location.state, navigate]);

  if (!voteData || !voteData.votes.length) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  const submittedAt = voteData.votes[0].submitted_at
    ? new Date(voteData.votes[0].submitted_at).toLocaleString()
    : "N/A";
  const voteId = voteData.votes[0].id || "N/A";

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
                <p className="text-sm text-gray-300">Vote Confirmation</p>
              </div>
            </div>
            <Link to="/judge-dashboard">
              <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-8 print-visible">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-black mb-2">Vote Submitted Successfully!</h2>
          <p className="text-lg text-gray-600">
            Thank you for your evaluation. Your votes have been securely recorded.
          </p>
        </div>

        {/* Vote Summary */}
        <Card className="mb-8 border-l-4 border-l-green-500 print-border">
          <CardHeader>
            <CardTitle className="text-2xl text-black flex items-center space-x-2">
              <Star className="h-6 w-6 text-yellow-600" />
              <span>Vote Summary</span>
            </CardTitle>
            <CardDescription>
              Review of your submitted evaluations for {voteData.category}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {voteData.votes.map((vote, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 print-border">
                  <h4 className="font-semibold text-gray-700 mb-2">Participant: {vote.participant.name}</h4>
                  <div className="grid gap-2">
                    {/* Criteria Scores */}
                    {vote.criteria_scores && Object.entries(vote.criteria_scores).map(([criterion, score]) => (
                      <div key={criterion} className="flex justify-between text-gray-600 print-flex">
                        <span>{criterion}</span>
                        <span className="text-yellow-600">{String(score)}/10</span>
                      </div>
                    ))}
                    {/* Total Score */}
                    <div className="flex justify-between mt-2 font-semibold print-flex">
                      <span>Total Score:</span>
                      <span className="text-yellow-600">{vote.score.toFixed(1)}</span>
                    </div>
                    {/* Comments */}
                    {vote.comments && (
                      <div className="mt-2">
                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2 print-flex">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span>Comments</span>
                        </h4>
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg print-border">
                          <p className="text-gray-700 leading-relaxed">{vote.comments}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-sm text-gray-500 mt-4 print-visible">
                <p><strong>Submission Time:</strong> {submittedAt}</p>
                <p><strong>Vote ID:</strong> {voteId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center print-hidden">
          <Link to="/judge-dashboard">
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8 py-3 text-lg">
              Continue Judging
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg"
          >
            Print Summary
          </Button>
        </div>

        {/* Important Notes */}
        <Card className="mt-8 bg-blue-50 border-blue-200 print-hidden">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-3">Important Information:</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Your votes have been securely recorded and cannot be viewed by other judges</li>
              <li>• You can update your votes anytime before the judging deadline</li>
              <li>• Results will be compiled only after all judges have submitted their evaluations</li>
              <li>• For any issues or questions, please contact the event coordinator</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body {
              background-color: #fff;
              color: #000;
            }
            header, .print-hidden {
              display: none;
            }
            .container {
              max-width: 100%;
              padding: 10px;
            }
            .card {
              border: none;
              box-shadow: none;
            }
            .print-border {
              border: 1px solid #000 !important;
            }
            .print-flex {
              display: flex !important;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .print-visible {
              display: block !important;
            }
            .text-center {
              text-align: left;
            }
            .text-yellow-600 {
              color: #000 !important;
              font-weight: bold;
            }
            .bg-gray-50 {
              background-color: #fff !important;
              border: 1px solid #000 !important;
            }
            .border-gray-200 {
              border-color: #000 !important;
            }
            h4, p, span {
              color: #000 !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default VotingConfirmation;