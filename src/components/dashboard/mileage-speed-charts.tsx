"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';

type TripData = {
  name: string; // Trip ID or a unique identifier
  distance: number;
  avg_speed: number;
};

export function MileageSpeedCharts() {
  const [tripData, setTripData] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser;

  const fetchTripData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('trip_id, distance, avg_speed, status')
        .eq('status', 'started') // Filter for current/started trips
        .not('distance', 'is', null)
        .not('avg_speed', 'is', null)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedData: TripData[] = data.map((trip) => ({
        name: `Trip ${trip.trip_id?.substring(0, 4)}`, // Shorten ID for display
        distance: trip.distance || 0,
        avg_speed: trip.avg_speed || 0,
      }));
      setTripData(formattedData);
    } catch (error: any) {
      toast.error(`Failed to fetch chart data: ${error.message}`);
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTripData();

    const channel = supabase
      .channel('public:trips_charts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
        console.log('Trip change for charts received!', payload);
        fetchTripData(); // Re-fetch data on any trip change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTripData, supabase]);

  return (
    <Card className="glassmorphism-card border-primary-accent/30 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-primary-accent">Mileage & Speeding Graphs (Current Trips)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-400 h-[300px] flex items-center justify-center">Loading charts...</div>
        ) : tripData.length === 0 ? (
          <div className="text-center text-gray-400 h-[300px] flex items-center justify-center">No active trip data for charts.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={tripData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(79, 70, 229, 0.2)" /> {/* Using primary-accent with transparency */}
              <XAxis dataKey="name" stroke="#4F46E5" /> {/* primary-accent */}
              <YAxis yAxisId="left" stroke="#10B981" label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', fill: '#10B981' }} /> {/* secondary-accent */}
              <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" label={{ value: 'Avg Speed (km/h)', angle: 90, position: 'insideRight', fill: '#F59E0B' }} /> {/* warning-accent */}
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #4F46E5', borderRadius: '4px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#10B981" activeDot={{ r: 8 }} name="Distance (km)" /> {/* secondary-accent */}
              <Line yAxisId="right" type="monotone" dataKey="avg_speed" stroke="#F59E0B" name="Avg Speed (km/h)" /> {/* warning-accent */}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}