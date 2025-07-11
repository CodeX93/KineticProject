"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, TrendingUp, MessageSquare, CheckCircle, AlertCircle, Users, Home, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function DashboardPage() {
  return (
    <div className="bg-[#f4f8ff] min-h-screen p-0">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-1 text-gray-900">Welcome Back, Rahmi</h1>
        <p className="text-gray-600 mb-6">Your recovery journey at a glance</p>
        <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-6">
          <span>• Overview</span>
          <span>• Exercises</span>
          <span>• Appointments</span>
          <span>• Messages</span>
          <span>• Progress</span>
          <span>• My Submissions</span>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <Badge className="bg-green-100 text-green-700 mr-2">UPCOMING</Badge>
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div className="font-semibold text-lg mb-1">Next Appointment</div>
              <div className="text-gray-500 text-sm mb-3">Today at 2:00 PM with Dr. Johnson</div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-600 text-white">Join Video Call</Button>
                <Button size="sm" variant="outline">Reschedule</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <Badge className="bg-orange-100 text-orange-700 mr-2">EXERCISES</Badge>
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <div className="font-semibold text-lg mb-1">Daily Plan</div>
              <div className="text-gray-500 text-sm mb-3">3 completed – 2 to go! Keep it up</div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-600 text-white">Continue</Button>
                <Button size="sm" variant="outline">View All</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <Badge className="bg-purple-100 text-purple-700 mr-2">PROGRESS</Badge>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div className="font-semibold text-lg mb-1">Recovery Status</div>
              <div className="text-gray-500 text-sm mb-3">"Up from 60% last week – great progress"</div>
              <Button size="sm" className="bg-blue-600 text-white">View Details</Button>
            </CardContent>
          </Card>
        </div>

        {/* Submit New Video */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit New Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Exercise Type</label>
              <Input placeholder="Select exercise from your plan" className="w-full" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes for your physiotherapist</label>
              <Textarea placeholder="Tell us how this exercise felt (pain level, difficulty, or other concerns)" className="w-full" />
            </div>
            <Button className="bg-blue-600 text-white">Upload Video</Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">AI Analysis Complete</div>
                <div className="text-gray-500 text-sm">Your squat form video has been analyzed</div>
              </div>
              <Button size="icon" variant="ghost"><EyeIcon /></Button>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <div className="font-medium">New Message</div>
                <div className="text-gray-500 text-sm">Dr. Johnson: 'Great progress on your knee exercises!'</div>
              </div>
              <Button size="icon" variant="ghost"><ReplyIcon /></Button>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <div className="font-medium">Exercise Plan Updated</div>
                <div className="text-gray-500 text-sm">Your physiotherapist has adjusted your routine</div>
              </div>
              <Button size="icon" variant="ghost"><EyeIcon /></Button>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Movement Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 mb-4">Your range of motion has improved by 15% this week. The AI model has detected better form in your knee exercises.</div>
            <Button className="bg-blue-600 text-white">View Detailed Report</Button>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Recent Messages</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <Image src="/caring-doctor.png" alt="Dr. Miller" width={36} height={36} className="rounded-full" />
              <div className="flex-1">
                <div className="font-medium">Dr. Miller</div>
                <div className="text-gray-500 text-sm">Great progress on your lateral raises! Let's discuss...</div>
              </div>
              <Button size="icon" variant="ghost"><ArrowRight className="h-5 w-5" /></Button>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <Image src="/friendly-receptionist.png" alt="Front Desk" width={36} height={36} className="rounded-full" />
              <div className="flex-1">
                <div className="font-medium">Front Desk</div>
                <div className="text-gray-500 text-sm">Your insurance claim has been processed successfully</div>
              </div>
              <Button size="icon" variant="ghost"><ArrowRight className="h-5 w-5" /></Button>
            </div>
          </div>
          <Button className="mt-4 bg-blue-600 text-white">View All Messages</Button>
        </div>
      </div>
    </div>
  )
}

// Icon placeholders
function EyeIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function ReplyIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><line x1="4" y1="12" x2="20" y2="12"/></svg>;
}
