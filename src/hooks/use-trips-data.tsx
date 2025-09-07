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
type SortDirection = 'asc' | 'desc' | null; // Added null for unsorted state

export function useTripsData() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]); // All drivers for display
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]); // Filtered for assignment
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]); // All vehicles for display
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]); // Filtered for assignment
  const [lockedDriverIds, setLockedDriverIds] = useState<Set<string>>(new Set());
  const [lockedVehicleRegNos, setLockedVehicleRegNos] = useState<Set<string>>(new Set());

  // Filter states
  const [filterDriver, setFilterDriver] = useState<string>('all');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // Sorting states
  const [sortColumn, setSortColumn] = useState<SortColumn>('start_time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default sort: start_time descending

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
        query = query.eq('status', filterStatus as Database['public']['Enums']['trip_status']); // Cast filterStatus
      }

      // Apply date range filter
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd HH:mm:ss');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd HH:mm:ss');
      query = query.gte('start_time', start).lte('start_time', end);

      // Map sortColumn to actual database column for Supabase order clause
      let dbSortColumn: string;
      switch (sortColumn) {
        case 'driver_name':
          dbSortColumn = 'drivers.name';
          break;
        case 'vehicle_info':
          dbSortColumn = 'vehicles.reg_no'; // Sorting by reg_no for vehicle info
          break;
        default:
          dbSortColumn = sortColumn as string; // Direct mapping for other columns
      }

      // Apply sorting based on current state, or default if unsorted
      if (sortDirection) {
        query = query.order(dbSortColumn, { ascending: sortDirection === 'asc' });
      } else {
        // Default sort when unsorted
        query = query.order('start_time', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrips(data as Trip[]);

      // Determine locked drivers and vehicles
      const currentLockedDrivers = new Set<string>();
      const currentLockedVehicles = new Set<string>();

      data.forEach(trip => {
        if (trip.status === 'pending' || trip.status === 'started') {
          if (trip.drv_id) currentLockedDrivers.add(trip.drv_id);
          if (trip.vehicle_reg_no) currentLockedVehicles.add(trip.vehicle_reg_no);
        }
      });
      setLockedDriverIds(currentLockedDrivers);
      setLockedVehicleRegNos(currentLockedVehicles);

    } catch (error: any) {
      toast.error(`Failed to fetch trips: ${error.message}`);
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, filterDriver, filterVehicle, filterStatus, selectedMonth, sortColumn, sortDirection]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      // Fetch all columns for drivers to match the Driver type
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*');
      if (driversError) throw driversError;
      setAllDrivers(driversData);

      // Fetch all columns for vehicles to match the Vehicle type
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');
      if (vehiclesError) throw vehiclesError;
      setAllVehicles(vehiclesData);

    } catch (error: any) {
      console.error('Error fetching filter options:', error);
    }
  }, [supabase]);

  // Effect to filter available drivers/vehicles whenever allDrivers/allVehicles or locked sets change
  useEffect(() => {
    const filteredDrivers = allDrivers.filter(driver => driver.drv_id && !lockedDriverIds.has(driver.drv_id));
    setAvailableDrivers(filteredDrivers);

    const filteredVehicles = allVehicles.filter(vehicle => vehicle.reg_no && !lockedVehicleRegNos.has(vehicle.reg_no));
    setAvailableVehicles(filteredVehicles);
  }, [allDrivers, allVehicles, lockedDriverIds, lockedVehicleRegNos]);


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
        // Cycle through 'asc', 'desc', null (unsorted)
        setSortDirection((prevDirection) => {
          if (prevDirection === 'asc') return 'desc';
          if (prevDirection === 'desc') return null;
          return 'asc'; // If currently null, go to asc
        });
      } else {
        // New column, start with 'asc'
        setSortDirection('asc');
      }
      return column;
    });
  }, []);

  const getSortIcon = useCallback((column: SortColumn) => {
    if (sortColumn === column && sortDirection) {
      return sortDirection === 'asc' ? '▲' : '▼';
    }
    return null; // No icon if not sorted or unsorted
  }, [sortColumn, sortDirection]);

  return {
    trips,
    loading,
    allDrivers, // For display in table
    availableDrivers, // For form dropdowns
    allVehicles, // For display in table
    availableVehicles, // For form dropdowns
    lockedDriverIds,
    lockedVehicleRegNos,
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