
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, ArrowLeft } from "lucide-react";

const EventSettings = () => {
  const { eventId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white border-b-2 border-yellow-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold">VoteRoyale</h1>
                <p className="text-sm text-gray-300">Event Settings</p>
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
        <h2 className="text-2xl font-bold text-black">Event Settings - {eventId}</h2>
        <p className="text-gray-600 mt-2">This page is under construction.</p>
      </div>
    </div>
  );
};

export default EventSettings;
