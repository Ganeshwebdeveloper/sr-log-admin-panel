"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Users, Bell } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';

export function StatsWidgets() {
  const [driverStats, setDriverStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [vehicleStats, setVehicleStats] = useState({ total: 0, good: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch Driver Stats
        const { data: drivers, error: driverError } = await supabase
          .from('drivers')
          .select('drv_id, status');

        if (driverError) throw driverError;

        const totalDrivers = drivers.length;
        const activeDrivers = drivers.filter(d => d.status === 'active').length;
        const inactiveDrivers = totalDrivers - activeDrivers;
        setDriverStats({ total: totalDrivers, active: activeDrivers, inactive: inactiveDrivers });

        // Fetch Vehicle Stats
        const { data: vehicles, error: vehicleError } = await supabase
          .from('vehicles')
          .select('reg_no, status');

        if (vehicleError) throw vehicleError;

        const totalVehicles = vehicles.length;
        const goodVehicles = vehicles.filter(v => v.status === 'Good').length;
        const maintenanceVehicles = totalVehicles - goodVehicles;
        setVehicleStats({ total: totalVehicles, good: goodVehicles, maintenance: maintenanceVehicles });

      } catch (error: any) {
        toast.error(`Failed to fetch dashboard stats: ${error.message}`);
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border border-gray-300 dark:border-gray-700 animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Link href="/drivers" className="block">
        <Card className="bg-card border border-gray-300 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-400 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{driverStats.total}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{driverStats.active} active, {driverStats.inactive} inactive</p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/vehicles" className="block">
        <Card className="bg-card border border-gray-300 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-400 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{vehicleStats.total}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{vehicleStats.good} good, {vehicleStats.maintenance} maintenance</p>
          </CardContent>
        </Card>
      </Link>
      {/* Placeholder for Current Trips and Notifications stats, will be updated with actual data */}
      <Card className="bg-card border border-gray-300 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Trips</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">...</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading...</p>
        </CardContent>
      </Card>
      <Card className="bg-card border border-gray-300 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">New Notifications</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">...</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}