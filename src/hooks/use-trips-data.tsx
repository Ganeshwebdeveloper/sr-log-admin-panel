"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  drivers: { name: string } | null;
  vehicles: { reg_no: string; company: string; model: string } | null;
};
type Driver = Database['public']['Tables']['drivers']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

type SortColumn = keyof Trip | 'driver_name' | 'vehicle_info';
type SortDirection = 'asc' | 'desc';

export function useTripsData() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Filter states
  const [filterDriver, setFilterDriver] = useState<string>('all');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // Sorting states
  const [sortColumn, setSortColumn] = useState<SortColumn>('start_time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const supabase = supabaseBrowser;

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          drivers(name),
          vehicles(reg_no, company, model)
        `);

      // Apply filters
      if (filterDriver !== 'all') {
        query = query.eq('drv_id', filterDriver);
      }
      if (filterVehicle !== 'all') {
        query = query.eq('vehicle_reg_no', filterVehicle);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply date range filter
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd HH:mm:ss');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd HH:mm:ss');
      query = query.gte('start_time', start).lte('start_time', end);

      // Apply sorting
      query = query.order(sortColumn === 'driver_name' ? 'drivers.name' : sortColumn === 'vehicle_info' ? 'vehicles.reg_no' : sortColumn, { ascending: sortDirection === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      setTrips(data as Trip[]);
    } catch (error: any) {
      toast.error(`Failed to fetch trips: ${error.message}`);
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, filterDriver, filterVehicle, filterStatus, selectedMonth, sortColumn, sortDirection]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('drv_id, name');
      if (driversError) throw driversError;
      setDrivers(driversData);

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('reg_no, company, model');
      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData);
    } catch (error: any) {
      console.error('Error fetching filter options:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFilterOptions();
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
  }, [fetchTrips, fetchFilterOptions, supabase]);

  const handleSort = useCallback((column: SortColumn) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortDirection('asc');
      }
      return column;
    });
  }, []);

  const getSortIcon = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? '▲' : '▼'; // Using simple characters for now
    }
    return null;
  }, [sortColumn, sortDirection]);

  return {
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
  };
}