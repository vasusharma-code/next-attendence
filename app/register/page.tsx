'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { UserPlus, Users, PlusCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        Choose Registration Type
      </h1>
      <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-4xl">
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

        {/* Visitor Card */}
      

        {/* Team Leader / Team Member Card */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow hover:shadow-lg transition p-8 flex flex-col items-center text-center">
          <PlusCircle className="h-10 w-10 text-emerald-600 mb-3" />
          <div className="font-bold text-xl mb-2 text-emerald-900">
            Team Leader / Team Member
          </div>
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
    </div>
  );
}
