"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database } from '@/types/supabase';
import { format } from 'date-fns';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  drivers: { name: string } | null;
  vehicles: { reg_no: string } | null;
};

export function CurrentTripsCard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser;

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          drivers(name),
          vehicles(reg_no)
        `)
        .in('status', ['pending', 'started'])
        .order('start_time', { ascending: false });

      if (error) throw error;
      setTrips(data as Trip[]);
    } catch (error: any) {
      toast.error(`Failed to fetch current trips: ${error.message}`);
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTrips();

    const channel = supabase
      .channel('public:trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
        console.log('Trip change received!', payload);
        fetchTrips(); // Re-fetch all trips on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrips, supabase]);

  return (
    <Card className="bg-card border border-gray-300 dark:border-gray-700 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-800 dark:text-gray-200">Current Trips</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTrips}
          disabled={loading}
          className="bg-transparent border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RefreshCw className={loading ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Loading trips...</div>
        ) : trips.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">No current trips.</div>
        ) : (
          <ScrollArea className="h-[300px] w-full rounded-md border border-gray-300 dark:border-gray-700">
            <Table className="min-w-full table-fixed border-collapse border border-gray-300 dark:border-gray-700">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Driver</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Vehicle</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">From</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">To</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Location</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Distance</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Avg Speed</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Salary</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Fuel Cost</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Profit</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Total Cost</TableHead>
                  <TableHead className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.trip_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{trip.drivers?.name || '—'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">{trip.vehicles?.reg_no || '—'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">{trip.origin || '—'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">{trip.destination || '—'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">{trip.current_location || '—'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">{trip.distance?.toFixed(2) || '—'} km</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">{trip.avg_speed?.toFixed(2) || '—'} km/h</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">₹{trip.driver_salary?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">₹{trip.fuel_cost?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">₹{trip.profit?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">₹{trip.total_cost?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          trip.status === 'started'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {trip.status || '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}