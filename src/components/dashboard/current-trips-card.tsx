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
    <Card className="glassmorphism-card border-primary-accent/30 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-primary-accent">Current Trips</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTrips}
          disabled={loading}
          className="bg-transparent border-primary-accent/30 text-primary-accent hover:bg-primary-accent/10"
        >
          <RefreshCw className={loading ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-400">Loading trips...</div>
        ) : trips.length === 0 ? (
          <div className="text-center text-gray-400">No current trips.</div>
        ) : (
          <ScrollArea className="h-[300px] w-full rounded-md border border-primary-accent/20">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800/50 text-secondary-accent">
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Avg Speed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.trip_id} className="hover:bg-gray-700/30 transition-colors">
                    <TableCell className="font-medium text-white">{trip.drivers?.name || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300">{trip.vehicles?.reg_no || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300">{trip.origin}</TableCell>
                    <TableCell className="text-gray-300">{trip.destination}</TableCell>
                    <TableCell className="text-warning-accent">{trip.current_location || 'N/A'}</TableCell>
                    <TableCell className="text-secondary-accent">₹{trip.total_cost?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="text-gray-300">{trip.distance?.toFixed(2) || '0.00'} km</TableCell>
                    <TableCell className="text-gray-300">{trip.avg_speed?.toFixed(2) || '0.00'} km/h</TableCell>
                    <TableCell className={`font-semibold ${trip.status === 'started' ? 'text-primary-accent' : 'text-warning-accent'}`}>
                      {trip.status}
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