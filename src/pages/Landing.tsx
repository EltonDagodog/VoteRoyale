import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Crown, Users, Vote, Award, Shield, Clock, Mail, Info } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans">
      {/* Header */}
      <header className="bg-black text-white border-b-2 border-yellow-500 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <h1 className="text-2xl font-bold tracking-wide">VoteRoyale</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#features" className="hover:text-yellow-400 transition-colors duration-300 font-medium">Features</a>
              <a href="#about" className="hover:text-yellow-400 transition-colors duration-300 font-medium">About</a>
              <a href="#contact" className="hover:text-yellow-400 transition-colors duration-300 font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Royal Event Management & 
              <span className="text-yellow-600"> Voting Excellence</span>
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
              Elevate your events with our premier platform. Seamlessly manage judges, participants, and secure voting with unmatched elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8 py-4 text-lg border-2 border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300">
                  Coordinator Login
                </Button>
              </Link>
              <Link to="/judge-login">
                <Button size="lg" variant="outline" className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-4 text-lg shadow-md hover:shadow-lg transition-all duration-300">
                  Judge Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-wide">Why Choose VoteRoyale?</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover the pinnacle of event management with a platform crafted for royal precision and elegance.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <Card className="border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-yellow-600 mx-auto mb-4 animate-pulse-slow" />
                <CardTitle className="text-xl text-gray-900 font-semibold">Role-Based Access</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Tailored dashboards for judges and coordinators, ensuring seamless role-specific functionality.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl">
              <CardHeader className="text-center">
                <Vote className="h-12 w-12 text-yellow-600 mx-auto mb-4 animate-pulse-slow" />
                <CardTitle className="text-xl text-gray-900 font-semibold">Secure Voting</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  A robust, anonymous voting system with real-time tracking and rigorous validation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl">
              <CardHeader className="text-center">
                <Award className="h-12 w-12 text-yellow-600 mx-auto mb-4 animate-pulse-slow" />
                <CardTitle className="text-xl text-gray-900 font-semibold">Event Mastery</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Full lifecycle management from event creation to detailed results analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-yellow-600 mx-auto mb-4 animate-pulse-slow" />
                <CardTitle className="text-xl text-gray-900 font-semibold">Access Control</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Unique access codes and secure credential management for all users.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl">
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4 animate-pulse-slow" />
                <CardTitle className="text-xl text-gray-900 font-semibold">Real-Time Insights</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Live updates and instant result compilation as voting progresses.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl">
              <CardHeader className="text-center">
                <Crown className="h-12 w-12 text-yellow-600 mx-auto mb-4 animate-pulse-slow" />
                <CardTitle className="text-xl text-gray-900 font-semibold">Regal Design</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  A luxurious interface that embodies the grandeur of your events.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-wide">About VoteRoyale</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              VoteRoyale is a premier event management and voting platform designed to bring elegance and efficiency to your most prestigious competitions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                Founded with a vision to redefine event organization, VoteRoyale combines cutting-edge technology with a user-friendly interface. Our platform empowers coordinators to manage every aspect of their events, from participant registration to result announcements, while ensuring a fair and secure voting process for judges.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                With a focus on security, scalability, and elegance, we cater to a wide range of events—pageants, talent shows, and more—delivering a royal experience for all involved.
              </p>
            </div>
            <div className="relative">
              <div className="bg-yellow-100 p-8 rounded-lg shadow-lg border-2 border-yellow-200">
                <Info className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Our Mission</h4>
                <p className="text-gray-600 leading-relaxed">
                  To provide an unparalleled event management solution that upholds integrity and celebrates excellence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-extrabold mb-4 tracking-wide">Get in Touch</h3>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              We’d love to hear from you. Reach out to discuss your next event or get support.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Mail className="h-6 w-6 text-yellow-400" />
                <span className="text-lg text-gray-200">support@voteroyale.com</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Our team is available to assist you with any inquiries or custom requirements. Let’s make your event a royal success!
              </p>
              {/* <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8 py-4 border-2 border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300">
                Contact Us
              </Button> */}
            </div>
            <div className="bg-yellow-50 p-8 rounded-lg shadow-lg border-2 border-yellow-200 text-gray-900">
              <h4 className="text-xl font-semibold mb-4">Office Hours</h4>
              <p className="text-lg">Monday - Friday: 9 AM - 6 PM PST</p>
              <p className="text-lg">Saturday - Sunday: Closed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-4xl font-extrabold mb-6">Ready to Elevate Your Events?</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the ranks of prestigious event organizers who trust VoteRoyale for their most important competitions.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8 py-4 text-lg">
              Start Your Event Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Crown className="h-6 w-6 text-yellow-500" />
              <span className="text-lg font-semibold">VoteRoyale</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 VoteRoyale. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;