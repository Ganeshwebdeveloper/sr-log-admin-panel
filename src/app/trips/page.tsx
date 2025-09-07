"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown, Filter, FileText, FileSpreadsheet, RefreshCw, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AssignTripForm } from '@/components/trips/assign-trip-form';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, getYear } from 'date-fns';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  drivers: { name: string } | null;
  vehicles: { reg_no: string; company: string; model: string } | null;
};
type Driver = Database['public']['Tables']['drivers']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

type SortColumn = keyof Trip | 'driver_name' | 'vehicle_info';
type SortDirection = 'asc' | 'desc';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignTripDialogOpen, setIsAssignTripDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>(undefined);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Filter states
  const [filterDriver, setFilterDriver] = useState<string>('all'); // Default to 'all'
  const [filterVehicle, setFilterVehicle] = useState<string>('all'); // Default to 'all'
  const [filterStatus, setFilterStatus] = useState<string>('all'); // Default to 'all'
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date()); // For month/year filter

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

  const handleDeleteTrip = async (trip_id: string) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('trip_id', trip_id);

      if (error) throw error;
      toast.success('Trip deleted successfully!');
      fetchTrips();
    } catch (error: any) {
      toast.error(`Failed to delete trip: ${error.message}`);
      console.error('Error deleting trip:', error);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsEditDialogOpen(true);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
    }
    return null;
  };

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

  const exportToPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4'); // A4 portrait
    const title = "Trips Report";
    const fileName = `trips_report.pdf`;

    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    doc.autoTable({
      startY: 30, // Start table below the title
      head: [['From', 'To', 'Driver', 'Vehicle', 'Status', 'Start Time', 'End Time', 'Distance (km)', 'Avg Speed (km/h)', 'Current Location', 'Salary (₹)', 'Fuel Cost (₹)', 'Profit (₹)', 'Total Cost (₹)']],
      body: trips.map(trip => [
        trip.origin,
        trip.destination,
        trip.drivers?.name || '—',
        trip.vehicles?.reg_no || '—',
        trip.status,
        trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : '—',
        trip.end_time ? format(new Date(trip.end_time), 'MMM dd, yyyy HH:mm') : '—',
        trip.distance?.toFixed(2) || '—',
        trip.avg_speed?.toFixed(2) || '—',
        trip.current_location || '—',
        `₹${trip.driver_salary?.toFixed(2) || '0.00'}`,
        `₹${trip.fuel_cost?.toFixed(2) || '0.00'}`,
        `₹${trip.profit?.toFixed(2) || '0.00'}`,
        `₹${trip.total_cost?.toFixed(2) || '0.00'}`,
      ]),
      theme: 'grid', // For all borders
      headStyles: {
        fontStyle: 'bold',
        fontSize: 10, // Smaller font for more columns
        textColor: [0, 0, 0], // Black
        fillColor: [255, 255, 255], // White background
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 8, // Smaller font for more columns
        textColor: [0, 0, 0], // Black
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        valign: 'middle',
      },
      columnStyles: {
        // Right-align numeric columns
        7: { halign: 'right' }, // Distance
        8: { halign: 'right' }, // Avg Speed
        10: { halign: 'right' }, // Salary
        11: { halign: 'right' }, // Fuel Cost
        12: { halign: 'right' }, // Profit
        13: { halign: 'right' }, // Total Cost
      },
      margin: { top: 30, right: 5, bottom: 20, left: 5 }, // Adjusted margins for more space
      didDrawPage: function (data) {
        // Header
        doc.setFontSize(10);
        doc.setTextColor(0); // Black text
        doc.text("SR Logistics Admin Panel", data.settings.margin.left, 10);

        // Footer
        doc.setFontSize(10);
        doc.text(`Page ${data.pageNumber} of {total_pages}`, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
      }
    });

    doc.putTotalPages("{total_pages}"); // Fill in total pages placeholder
    doc.save(fileName);
    toast.success('Trips list exported to PDF!');
  };

  const exportToExcel = () => {
    const data = trips.map(trip => ({
      From: trip.origin,
      To: trip.destination,
      Driver: trip.drivers?.name || '—',
      Vehicle: trip.vehicles?.reg_no || '—',
      Status: trip.status,
      'Start Time': trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : '—',
      'End Time': trip.end_time ? format(new Date(trip.end_time), 'MMM dd, yyyy HH:mm') : '—',
      'Distance (km)': trip.distance?.toFixed(2) || '—',
      'Avg Speed (km/h)': trip.avg_speed?.toFixed(2) || '—',
      'Current Location': trip.current_location || '—',
      'Salary (₹)': trip.driver_salary?.toFixed(2) || '0.00',
      'Fuel Cost (₹)': trip.fuel_cost?.toFixed(2) || '0.00',
      'Profit (₹)': trip.profit?.toFixed(2) || '0.00',
      'Total Cost (₹)': trip.total_cost?.toFixed(2) || '0.00',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trips List");
    XLSX.writeFile(wb, `trips_list.xlsx`);
    toast.success('Trips list exported to Excel!');
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary-accent">Trips Management</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isAssignTripDialogOpen} onOpenChange={setIsAssignTripDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-accent hover:bg-primary-accent/80 text-white font-bold">
                <PlusCircle className="mr-2 h-4 w-4" /> Assign Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-primary-accent">Assign New Trip</DialogTitle>
              </DialogHeader>
              <AssignTripForm onSuccess={() => setIsAssignTripDialogOpen(false)} onClose={() => setIsAssignTripDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPdf}
            disabled={trips.length === 0}
            className="bg-transparent border-secondary-accent/30 text-secondary-accent hover:bg-secondary-accent/10"
          >
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={trips.length === 0}
            className="bg-transparent border-warning-accent/30 text-warning-accent hover:bg-warning-accent/10"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-primary-accent">Edit Trip</DialogTitle>
            </DialogHeader>
            {selectedTrip && (
              <AssignTripForm
                initialData={selectedTrip}
                onSuccess={() => setIsEditDialogOpen(false)}
                onClose={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glassmorphism-card border-primary-accent/30">
        <CardHeader>
          <CardTitle className="text-secondary-accent flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select onValueChange={setFilterDriver} value={filterDriver} defaultValue="all">
            <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
              <SelectValue placeholder="Filter by Driver" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Drivers</SelectItem>
              {drivers.map((driver) => (
                driver.drv_id ? (
                  <SelectItem key={driver.drv_id} value={driver.drv_id}>
                    {driver.name}
                  </SelectItem>
                ) : null
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterVehicle} value={filterVehicle} defaultValue="all">
            <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
              <SelectValue placeholder="Filter by Vehicle" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((vehicle) => (
                vehicle.reg_no ? (
                  <SelectItem key={vehicle.reg_no} value={vehicle.reg_no}>
                    {vehicle.company} {vehicle.model} ({vehicle.reg_no})
                  </SelectItem>
                ) : null
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterStatus} value={filterStatus} defaultValue="all">
            <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="started">Started</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal bg-gray-700/50 border-primary-accent/20 text-white hover:bg-gray-600/50",
                  !selectedMonth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary-accent" />
                {selectedMonth ? format(selectedMonth, "MMM yyyy") : <span>Filter by Month</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border text-foreground" align="end">
              <Calendar
                mode="single"
                captionLayout="dropdown-buttons"
                selected={selectedMonth}
                onSelect={(date) => {
                  if (date) setSelectedMonth(date);
                }}
                fromYear={2000}
                toYear={getYear(new Date()) + 1}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <Card className="glassmorphism-card border-primary-accent/30">
        <CardHeader>
          <CardTitle className="text-secondary-accent">All Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-400">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="text-center text-gray-400">No trips found.</div>
          ) : (
            <ScrollArea className="h-[500px] w-full rounded-md border border-primary-accent/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/50 text-secondary-accent">
                    <TableHead className="text-left">From</TableHead>
                    <TableHead className="text-left">To</TableHead>
                    <TableHead onClick={() => handleSort('driver_name')} className="cursor-pointer hover:text-primary-accent text-left">
                      Driver {getSortIcon('driver_name')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('vehicle_info')} className="cursor-pointer hover:text-primary-accent text-left">
                      Vehicle {getSortIcon('vehicle_info')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:text-primary-accent text-left">
                      Status {getSortIcon('status')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('start_time')} className="cursor-pointer hover:text-primary-accent text-left">
                      Start Time {getSortIcon('start_time')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('end_time')} className="cursor-pointer hover:text-primary-accent text-left">
                      End Time {getSortIcon('end_time')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('distance')} className="cursor-pointer hover:text-primary-accent text-right">
                      Distance (km) {getSortIcon('distance')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('avg_speed')} className="cursor-pointer hover:text-primary-accent text-right">
                      Avg Speed (km/h) {getSortIcon('avg_speed')}
                    </TableHead>
                    <TableHead className="text-left">Current Location</TableHead>
                    <TableHead onClick={() => handleSort('driver_salary')} className="cursor-pointer hover:text-primary-accent text-right">
                      Salary (₹) {getSortIcon('driver_salary')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('fuel_cost')} className="cursor-pointer hover:text-primary-accent text-right">
                      Fuel Cost (₹) {getSortIcon('fuel_cost')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('profit')} className="cursor-pointer hover:text-primary-accent text-right">
                      Profit (₹) {getSortIcon('profit')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('total_cost')} className="cursor-pointer hover:text-primary-accent text-right">
                      Total Cost (₹) {getSortIcon('total_cost')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow
                      key={trip.trip_id}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <TableCell className="text-left text-gray-300">{trip.origin}</TableCell>
                      <TableCell className="text-left text-gray-300">{trip.destination}</TableCell>
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
                          {trip.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-left text-gray-300">{trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : '—'}</TableCell>
                      <TableCell className="text-left text-gray-300">{trip.end_time ? format(new Date(trip.end_time), 'MMM dd, yyyy HH:mm') : '—'}</TableCell>
                      <TableCell className="text-right text-gray-300 flex items-center justify-end">
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
                      <TableCell className="text-right text-gray-300 flex items-center justify-end">
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
                      <TableCell className="text-left text-warning-accent flex items-center">
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
                      <TableCell className="text-right text-secondary-accent">₹{trip.driver_salary?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right text-secondary-accent">₹{trip.fuel_cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right text-secondary-accent">₹{trip.profit?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right text-secondary-accent">₹{trip.total_cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}