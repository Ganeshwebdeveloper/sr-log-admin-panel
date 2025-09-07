"use client";

import React from 'react';
import { Edit, Trash2, ArrowUp, ArrowDown, Lock } from 'lucide-react'; // Added Lock icon
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  lockedDriverIds: Set<string>; // New prop
  lockedVehicleRegNos: Set<string>; // New prop
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
  lockedDriverIds,
  lockedVehicleRegNos,
}: TripsTableProps) {

  if (loading) {
    return <div className="text-center text-gray-400">Loading trips...</div>;
  }

  if (trips.length === 0) {
    return <div className="text-center text-gray-400">No trips found.</div>;
  }

  return (
    <ScrollArea className="h-[500px] w-full rounded-md border border-primary-accent/20">
      <Table className="min-w-full table-fixed border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <TableHeader className="bg-gray-800/50 text-secondary-accent">
          <TableRow>
            <TableHead className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm">From</TableHead>
            <TableHead className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm">To</TableHead>
            <TableHead onClick={() => handleSort('driver_name')} className="w-[8%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Driver {getSortIcon('driver_name')}
            </TableHead>
            <TableHead onClick={() => handleSort('vehicle_info')} className="w-[8%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Vehicle {getSortIcon('vehicle_info')}
            </TableHead>
            <TableHead onClick={() => handleSort('status')} className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Status {getSortIcon('status')}
            </TableHead>
            <TableHead onClick={() => handleSort('start_time')} className="w-[10%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Start Time {getSortIcon('start_time')}
            </TableHead>
            <TableHead onClick={() => handleSort('end_time')} className="w-[10%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              End Time {getSortIcon('end_time')}
            </TableHead>
            <TableHead onClick={() => handleSort('distance')} className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Distance (km) {getSortIcon('distance')}
            </TableHead>
            <TableHead onClick={() => handleSort('avg_speed')} className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Avg Speed (km/h) {getSortIcon('avg_speed')}
            </TableHead>
            <TableHead className="w-[8%] border border-gray-300 px-3 py-2 text-left font-bold text-sm">Current Location</TableHead>
            <TableHead onClick={() => handleSort('driver_salary')} className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Salary (₹) {getSortIcon('driver_salary')}
            </TableHead>
            <TableHead onClick={() => handleSort('fuel_cost')} className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Fuel Cost (₹) {getSortIcon('fuel_cost')}
            </TableHead>
            <TableHead onClick={() => handleSort('profit')} className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Profit (₹) {getSortIcon('profit')}
            </TableHead>
            <TableHead onClick={() => handleSort('total_cost')} className="w-[6%] border border-gray-300 px-3 py-2 text-left font-bold text-sm cursor-pointer hover:text-primary-accent">
              Total Cost (₹) {getSortIcon('total_cost')}
            </TableHead>
            <TableHead className="w-[8%] border border-gray-300 px-3 py-2 text-left font-bold text-sm">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow
              key={trip.trip_id}
              className="hover:bg-gray-700/30 transition-colors"
            >
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-gray-300 whitespace-nowrap">{trip.origin || '—'}</TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-gray-300 whitespace-nowrap">{trip.destination || '—'}</TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] font-medium text-white whitespace-nowrap">
                <div className="flex flex-col items-start">
                  <span>{trip.drivers?.name || '—'}</span>
                  {(trip.drv_id && (trip.status === 'pending' || trip.status === 'started')) && (
                    <Lock className="h-3.5 w-3.5 text-gray-500 mt-1" />
                  )}
                </div>
              </TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-gray-300 whitespace-nowrap">
                <div className="flex flex-col items-start">
                  <span>{trip.vehicles?.reg_no || '—'}</span>
                  {(trip.vehicle_reg_no && (trip.status === 'pending' || trip.status === 'started')) && (
                    <Lock className="h-3.5 w-3.5 text-gray-500 mt-1" />
                  )}
                </div>
              </TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] whitespace-nowrap">
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
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-gray-300 whitespace-nowrap">{trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : '—'}</TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-gray-300 whitespace-nowrap">{trip.end_time ? format(new Date(trip.end_time), 'MMM dd, yyyy HH:mm') : '—'}</TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-gray-300 whitespace-nowrap">
                {trip.distance?.toFixed(2) || '—'}
              </TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-gray-300 whitespace-nowrap">
                {trip.avg_speed?.toFixed(2) || '—'}
              </TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-warning-accent whitespace-nowrap">
                {trip.current_location || '—'}
              </TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-secondary-accent whitespace-nowrap">₹{trip.driver_salary?.toFixed(2) || '0.00'}</TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-secondary-accent whitespace-nowrap">₹{trip.fuel_cost?.toFixed(2) || '0.00'}</TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-secondary-accent whitespace-nowrap">₹{trip.profit?.toFixed(2) || '0.00'}</TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] text-secondary-accent whitespace-nowrap">₹{trip.total_cost?.toFixed(2) || '0.00'}</TableCell>
              <TableCell className="border border-gray-300 px-3 py-2 text-left text-[13px] whitespace-nowrap">
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