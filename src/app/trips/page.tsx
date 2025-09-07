"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTripsData } from '@/hooks/use-trips-data';
import { TripsActions } from '@/components/trips/trips-actions';
import { TripsFilters } from '@/components/trips/trips-filters';
import { TripsTable } from '@/components/trips/trips-table';
import { Database } from '@/types/supabase';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  drivers: { name: string } | null;
  vehicles: { reg_no: string; company: string; model: string } | null;
};

export default function TripsPage() {
  const {
    trips,
    loading,
    drivers,
    vehicles,
    filterDriver,
    setFilterDriver,
    filterVehicle,
    setFilterVehicle,
    filterStatus,
    setFilterStatus,
    selectedMonth,
    setSelectedMonth,
    sortColumn,
    sortDirection,
    handleSort,
    getSortIcon,
    fetchTrips, // Expose fetchTrips for manual refresh or after form submission
  } = useTripsData();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>(undefined);

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTrip = async (trip_id: string) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }
    // Assuming supabaseBrowser is available globally or passed down
    const supabase = supabaseBrowser;
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('trip_id', trip_id);

      if (error) throw error;
      // toast.success('Trip deleted successfully!'); // Toast handled by useTripsData's fetchTrips
      fetchTrips(); // Re-fetch to update the list
    } catch (error: any) {
      // toast.error(`Failed to delete trip: ${error.message}`); // Toast handled by useTripsData's fetchTrips
      console.error('Error deleting trip:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <TripsActions
        trips={trips}
        onTripAdded={fetchTrips}
        onTripUpdated={fetchTrips}
        handleDeleteTrip={handleDeleteTrip}
        selectedTrip={selectedTrip}
        setSelectedTrip={setSelectedTrip}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
      />

      <TripsFilters
        drivers={drivers}
        vehicles={vehicles}
        filterDriver={filterDriver}
        setFilterDriver={setFilterDriver}
        filterVehicle={filterVehicle}
        setFilterVehicle={setFilterVehicle}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />

      <Card className="glassmorphism-card border-primary-accent/30">
        <TripsTable
          trips={trips}
          loading={loading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          handleSort={handleSort}
          getSortIcon={getSortIcon}
          handleEditTrip={handleEditTrip}
          handleDeleteTrip={handleDeleteTrip}
        />
      </Card>
    </div>
  );
}