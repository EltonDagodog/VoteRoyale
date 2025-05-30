
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JudgeLogin from "./pages/JudgeLogin";
import JudgeDashboard from "./pages/JudgeDashboard/JudgeDashboard";
import VotingPage from "./pages/JudgeDashboard/VotingPage";
import VotingConfirmation from "./pages/JudgeDashboard/VotingConfirmation";
import CoordinatorDashboard from "./pages/CoordinatorDashboard/CoordinatorDashboard";
import EventManagement from "./pages/CoordinatorDashboard/EventManagement";
import EventDetail from "./pages/CoordinatorDashboard/EventDetail";
import EventJudges from "./pages/CoordinatorDashboard/EventJudges";
import EventParticipants from "./pages/CoordinatorDashboard/EventParticipants";
import EventCategories from "./pages/CoordinatorDashboard/EventCategories";
import EventVotes from "./pages/CoordinatorDashboard/EventVotes";
import EventResults from "./pages/CoordinatorDashboard/EventResults";
import EventSettings from "./pages/CoordinatorDashboard/EventSettings";
import NotFound from "./pages/NotFound";
import AwardsPage from "./pages/JudgeDashboard/Awards";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/judge-login" element={<JudgeLogin />} />
          <Route path="/judge-dashboard" element={<JudgeDashboard />} />
          <Route path="/judge-dashboard/awards" element={<AwardsPage />} />
          <Route path="/judge-dashboard/vote/:eventId/:categoryId" element={<VotingPage />} />
          <Route path="/judge-dashboard/vote-confirmation" element={<VotingConfirmation />} />
          <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
          <Route path="/coordinator-dashboard/events" element={<EventManagement />} />
          <Route path="/coordinator-dashboard/events/:eventId" element={<EventDetail />} />
          <Route path="/coordinator-dashboard/events/:eventId/judges" element={<EventJudges />} />
          <Route path="/coordinator-dashboard/events/:eventId/participants" element={<EventParticipants />} />
          <Route path="/coordinator-dashboard/events/:eventId/categories" element={<EventCategories />} />
          <Route path="/coordinator-dashboard/events/:eventId/votes" element={<EventVotes />} />
          <Route path="/coordinator-dashboard/events/:eventId/results" element={<EventResults />} />
          <Route path="/coordinator-dashboard/events/:eventId/settings" element={<EventSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
