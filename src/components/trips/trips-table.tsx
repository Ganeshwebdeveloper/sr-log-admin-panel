"use client";

import React from 'react';
import { Edit, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Database } from '@/types/supabase';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  drivers: { name: string } | null;
  vehicles: { reg_no: string; company: string; model: string } | null;
};

type SortColumn = keyof Trip | 'driver_name' | 'vehicle_info';
type SortDirection = 'asc' | 'desc';

interface TripsTableProps {
  trips: Trip[];
  loading: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  handleSort: (column: SortColumn) => void;
  getSortIcon: (column: SortColumn) => '▲' | '▼' | null;
  handleEditTrip: (trip: Trip) => void;
  handleDeleteTrip: (trip_id: string) => void;
}

export function TripsTable({
  trips,
  loading,
  sortColumn,
  sortDirection,
  handleSort,
  getSortIcon,
  handleEditTrip,
  handleDeleteTrip,
}: TripsTableProps) {

  // Placeholder for refresh functions
  const handleRefreshDistance = (tripId: string) => {
    toast.info(`Refreshing distance for trip ${tripId}... (Backend integration needed)`);
    // In a real application, this would trigger a backend call
    // to update the distance for the specific trip.
  };

  const handleRefreshAvgSpeed = (tripId: string) => {
    toast.info(`Refreshing average speed for trip ${tripId}... (Backend integration needed)`);
    // In a real application, this would trigger a backend call
    // to update the average speed for the specific trip.
  };

  const handleRefreshCurrentLocation = (tripId: string) => {
    toast.info(`Refreshing current location for trip ${tripId}... (Backend integration needed)`);
    // In a real application, this would trigger a backend call
    // to update the current location for the specific trip.
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading trips...</div>;
  }

  if (trips.length === 0) {
    return <div className="text-center text-gray-400">No trips found.</div>;
  }

  return (
    <ScrollArea className="h-[500px] w-full rounded-md border border-primary-accent/20">
      <Table className="min-w-full table-fixed border-collapse">
        <TableHeader>
          <TableRow className="bg-gray-800/50 text-secondary-accent">
            <TableHead className="w-[8%] text-left">From</TableHead>
            <TableHead className="w-[8%] text-left">To</TableHead>
            <TableHead onClick={() => handleSort('driver_name')} className="w-[10%] cursor-pointer hover:text-primary-accent text-left">
              Driver {getSortIcon('driver_name')}
            </TableHead>
            <TableHead onClick={() => handleSort('vehicle_info')} className="w-[10%] cursor-pointer hover:text-primary-accent text-left">
              Vehicle {getSortIcon('vehicle_info')}
            </TableHead>
            <TableHead onClick={() => handleSort('status')} className="w-[8%] cursor-pointer hover:text-primary-accent text-left">
              Status {getSortIcon('status')}
            </TableHead>
            <TableHead onClick={() => handleSort('start_time')} className="w-[10%] cursor-pointer hover:text-primary-accent text-center">
              Start Time {getSortIcon('start_time')}
            </TableHead>
            <TableHead onClick={() => handleSort('end_time')} className="w-[10%] cursor-pointer hover:text-primary-accent text-center">
              End Time {getSortIcon('end_time')}
            </TableHead>
            <TableHead onClick={() => handleSort('distance')} className="w-[8%] cursor-pointer hover:text-primary-accent text-right">
              Distance (km) {getSortIcon('distance')}
            </TableHead>
            <TableHead onClick={() => handleSort('avg_speed')} className="w-[8%] cursor-pointer hover:text-primary-accent text-right">
              Avg Speed (km/h) {getSortIcon('avg_speed')}
            </TableHead>
            <TableHead className="w-[10%] text-left">Current Location</TableHead>
            <TableHead onClick={() => handleSort('driver_salary')} className="w-[8%] cursor-pointer hover:text-primary-accent text-right">
              Salary (₹) {getSortIcon('driver_salary')}
            </TableHead>
            <TableHead onClick={() => handleSort('fuel_cost')} className="w-[8%] cursor-pointer hover:text-primary-accent text-right">
              Fuel Cost (₹) {getSortIcon('fuel_cost')}
            </TableHead>
            <TableHead onClick={() => handleSort('profit')} className="w-[8%] cursor-pointer hover:text-primary-accent text-right">
              Profit (₹) {getSortIcon('profit')}
            </TableHead>
            <TableHead onClick={() => handleSort('total_cost')} className="w-[8%] cursor-pointer hover:text-primary-accent text-right">
              Total Cost (₹) {getSortIcon('total_cost')}
            </TableHead>
            <TableHead className="w-[8%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow
              key={trip.trip_id}
              className="hover:bg-gray-700/30 transition-colors"
            >
              <TableCell className="text-left text-gray-300">{trip.origin || '—'}</TableCell>
              <TableCell className="text-left text-gray-300">{trip.destination || '—'}</TableCell>
              <TableCell className="text-left font-medium text-white">{trip.drivers?.name || '—'}</TableCell>
              <TableCell className="text-left text-gray-300">{trip.vehicles?.reg_no || '—'}</TableCell>
              <TableCell className="text-left">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    trip.status === 'started'
                      ? 'bg-primary-accent/20 text-primary-accent'
                      : trip.status === 'finished'
                      ? 'bg-secondary-accent/20 text-secondary-accent'
                      : 'bg-warning-accent/20 text-warning-accent'
                  }`}
                >
                  {trip.status || '—'}
                </span>
              </TableCell>
              <TableCell className="text-center text-gray-300">{trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : '—'}</TableCell>
              <TableCell className="text-center text-gray-300">{trip.end_time ? format(new Date(trip.end_time), 'MMM dd, yyyy HH:mm') : '—'}</TableCell>
              <TableCell className="text-right text-gray-300 flex items-center justify-end whitespace-nowrap">
                {trip.distance?.toFixed(2) || '—'}
                {trip.distance !== null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRefreshDistance(trip.trip_id)}
                    className="ml-1 h-6 w-6 text-gray-400 hover:bg-gray-700/50"
                    title="Refresh Distance"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </TableCell>
              <TableCell className="text-right text-gray-300 flex items-center justify-end whitespace-nowrap">
                {trip.avg_speed?.toFixed(2) || '—'}
                {trip.avg_speed !== null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRefreshAvgSpeed(trip.trip_id)}
                    className="ml-1 h-6 w-6 text-gray-400 hover:bg-gray-700/50"
                    title="Refresh Average Speed"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </TableCell>
              <TableCell className="text-left text-warning-accent flex items-center whitespace-nowrap">
                {trip.current_location || '—'}
                {trip.current_location !== null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRefreshCurrentLocation(trip.trip_id)}
                    className="ml-1 h-6 w-6 text-gray-400 hover:bg-gray-700/50"
                    title="Refresh Current Location"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </TableCell>
              <TableCell className="text-right text-secondary-accent whitespace-nowrap">₹{trip.driver_salary?.toFixed(2) || '0.00'}</TableCell>
              <TableCell className="text-right text-secondary-accent whitespace-nowrap">₹{trip.fuel_cost?.toFixed(2) || '0.00'}</TableCell>
              <TableCell className="text-right text-secondary-accent whitespace-nowrap">₹{trip.profit?.toFixed(2) || '0.00'}</TableCell>
              <TableCell className="text-right text-secondary-accent whitespace-nowrap">₹{trip.total_cost?.toFixed(2) || '0.00'}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTrip(trip);
                  }}
                  className="text-primary-accent hover:bg-primary-accent/10 mr-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTrip(trip.trip_id);
                  }}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}