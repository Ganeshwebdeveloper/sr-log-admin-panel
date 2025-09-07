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
    <Card className="bg-card border border-gray-300 dark:border-gray-700 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-gray-200">Mileage & Speeding Graphs (Current Trips)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-[300px] flex items-center justify-center">Loading charts...</div>
        ) : tripData.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-[300px] flex items-center justify-center">No active trip data for charts.</div>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" /> {/* Gray-400 with transparency */}
              <XAxis dataKey="name" stroke="#6B7280" /> {/* Gray-500 */}
              <YAxis yAxisId="left" stroke="#4B5563" label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', fill: '#4B5563' }} /> {/* Gray-600 */}
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" label={{ value: 'Avg Speed (km/h)', angle: 90, position: 'insideRight', fill: '#9CA3AF' }} /> {/* Gray-400 */}
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #4B5563', borderRadius: '4px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#4B5563" activeDot={{ r: 8 }} name="Distance (km)" /> {/* Gray-600 */}
              <Line yAxisId="right" type="monotone" dataKey="avg_speed" stroke="#9CA3AF" name="Avg Speed (km/h)" /> {/* Gray-400 */}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}