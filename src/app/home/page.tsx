"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Users, MessageSquare, Bell } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad'; // Assuming this is still desired

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-neon-blue">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glassmorphism-card border-neon-blue/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neon-green">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">25</div> {/* Placeholder */}
            <p className="text-xs text-gray-400">+5 active, 20 inactive</p> {/* Placeholder */}
          </CardContent>
        </Card>
        <Card className="glassmorphism-card border-neon-blue/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neon-green">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">15</div> {/* Placeholder */}
            <p className="text-xs text-gray-400">12 good, 3 maintenance</p> {/* Placeholder */}
          </CardContent>
        </Card>
        <Card className="glassmorphism-card border-neon-blue/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neon-green">Current Trips</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">7</div> {/* Placeholder */}
            <p className="text-xs text-gray-400">2 started, 5 pending</p> {/* Placeholder */}
          </CardContent>
        </Card>
        <Card className="glassmorphism-card border-neon-blue/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neon-green">New Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">3</div> {/* Placeholder */}
            <p className="text-xs text-gray-400">Last 24 hours</p> {/* Placeholder */}
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glassmorphism-card border-neon-blue/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-neon-blue">Current Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">List of current trips will go here.</p>
            {/* Placeholder for Current Trips component */}
          </CardContent>
        </Card>

        <Card className="glassmorphism-card border-neon-blue/30">
          <CardHeader>
            <CardTitle className="text-neon-blue">Notification Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">Notifications will appear here.</p>
            {/* Placeholder for Notification Panel component */}
          </CardContent>
        </Card>

        <Card className="glassmorphism-card border-neon-blue/30 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-neon-blue">Voice/Chat Box</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">Group chat with drivers will go here.</p>
            {/* Placeholder for Voice/Chat Box component */}
          </CardContent>
        </Card>

        <Card className="glassmorphism-card border-neon-blue/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-neon-blue">Mileage & Speeding Graphs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">Charts for mileage and speeding will be displayed here.</p>
            {/* Placeholder for Graphs component */}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
}