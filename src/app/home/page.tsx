"use client";

import { MadeWithDyad } from '@/components/made-with-dyad';
import { StatsWidgets } from '@/components/dashboard/stats-widgets';
import { CurrentTripsCard } from '@/components/dashboard/current-trips-card';
import { NotificationPanel } from '@/components/dashboard/notification-panel';
import { MileageSpeedCharts } from '@/components/dashboard/mileage-speed-charts';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Dashboard Overview</h1>

      {/* Stats Cards */}
      <StatsWidgets />

      {/* Main Dashboard Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <CurrentTripsCard />
        <NotificationPanel />
        {/* ChatBox is now accessed via a global fixed button */}
        <MileageSpeedCharts />
      </div>
      <MadeWithDyad />
    </div>
  );
}