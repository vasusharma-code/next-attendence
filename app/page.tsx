'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserCheck, Users, Building2, ArrowRight, UserPlus, PlusCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">DD Robocon 2025</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            DD Robocon 2025
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Join us for the 2025 All India Robotic Contest! Register now to participate, volunteer, or support.
          </p>
          <Button size="lg" className="px-8 py-5 text-lg" onClick={() => router.push('/register')}>
            Register Now
          </Button>
        </div>
        <div className="flex justify-center">
          {/* Use public image path */}
          <img
            src="/logo.jpg"
            alt="Robocon Robots"
            className="rounded-lg shadow-lg object-cover"
            style={{ width: 320, height: 180 }}
          />
        </div>
      </section>

      {/* Registration Options Section */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* Volunteer Card */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow hover:shadow-lg transition p-8 flex flex-col items-center text-center">
            <UserPlus className="h-10 w-10 text-blue-600 mb-3" />
            <div className="font-bold text-xl mb-2 text-blue-900">Volunteer</div>
            <div className="text-gray-600 mb-6">
              Join our team as a volunteer and help make DD Robocon 2025 a success.
            </div>
            <Button
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold"
              onClick={() => router.push('/signup?role=volunteer')}
            >
              Register as Volunteer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
        

          {/* Team Leader / Team Member Card */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow hover:shadow-lg transition p-8 flex flex-col items-center text-center">
            <PlusCircle className="h-10 w-10 text-emerald-600 mb-3" />
            <div className="font-bold text-xl mb-2 text-emerald-900">Team Leader / Team Member</div>
            <div className="text-gray-600 mb-6">
              Register as a team leader or team member to participate in the contest.
            </div>
            <Button
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              onClick={() => router.push('/signup?role=team-leader')}
            >
              Register as Team Leader/Member <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

            {/* Visitor Card */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow hover:shadow-lg transition p-8 flex flex-col items-center text-center">
            <Users className="h-10 w-10 text-blue-400 mb-3" />
            <div className="font-bold text-xl mb-2 text-blue-700">Visitor</div>
            <div className="text-gray-600 mb-6">
              Register as a visitor to attend DD Robocon 2025 and witness the excitement.
            </div>
            <Button
              className="w-full bg-blue-100 text-blue-700 font-semibold cursor-not-allowed"
              disabled
            >
              Register as Visitor
            </Button>
          </div>
        </div>
      </section>

      {/* Mascot/Promo Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow flex flex-col md:flex-row items-center gap-6 p-6">
          <img
            src="/mascot.jpeg"
            alt="Robot Mascot"
            className="rounded-md object-cover"
            style={{ width: 200, height: 120 }}
          />
          <div>
            <h2 className="text-2xl font-bold mb-2">Meet Our Mascot</h2>
            <p className="text-gray-600">
              The official mascot for DD Robocon 2025 symbolizes innovation and friendly competition.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}