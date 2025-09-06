"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarIcon, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import { format, startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import for PDF export
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Import for Excel export
import * as XLSX from 'xlsx';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'] & {
  drivers: { name: string } | null;
};

export default function SingleVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = supabaseBrowser;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [totalMonthlyMaintenance, setTotalMonthlyMaintenance] = useState<number>(0);

  const fetchVehicleDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('reg_no', id)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicle(vehicleData);
    } catch (error: any) {
      toast.error(`Failed to fetch vehicle details: ${error.message}`);
      console.error('Error fetching vehicle details:', error);
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  const fetchVehicleTrips = useCallback(async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd HH:mm:ss');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd HH:mm:ss');

      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          drivers(name)
        `)
        .eq('vehicle_reg_no', id)
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time', { ascending: false })
        .limit(30); // Last 30 trips

      if (tripsError) throw tripsError;
      setTrips(tripsData as Trip[]);

      const totalMaintenance = tripsData.reduce((sum, trip) => sum + (trip.maintenance_cost || 0), 0);
      setTotalMonthlyMaintenance(totalMaintenance);

    } catch (error: any) {
      toast.error(`Failed to fetch vehicle trips: ${error.message}`);
      console.error('Error fetching vehicle trips:', error);
      setTrips([]);
      setTotalMonthlyMaintenance(0);
    } finally {
      setLoading(false);
    }
  }, [id, selectedMonth, supabase]);

  useEffect(() => {
    fetchVehicleDetails();
  }, [fetchVehicleDetails]);

  useEffect(() => {
    if (vehicle) {
      fetchVehicleTrips();
    }
  }, [vehicle, fetchVehicleTrips]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const tableColumn = ["From", "To", "Driver", "Distance (km)", "Avg Speed (km/h)", "Maintenance Cost (₹)", "Status", "Start Time"];
    const tableRows = trips.map(trip => [
      trip.origin,
      trip.destination,
      trip.drivers?.name || 'N/A',
      trip.distance?.toFixed(2) || '0.00',
      trip.avg_speed?.toFixed(2) || '0.00',
      `₹${trip.maintenance_cost?.toFixed(2) || '0.00'}`,
      trip.status,
      trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : 'N/A',
    ]);

    doc.setFontSize(18);
    doc.text(`Trip History for Vehicle: ${vehicle?.reg_no} (${vehicle?.model})`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Month: ${format(selectedMonth, "MMM yyyy")}`, 14, 28);
    doc.text(`Total Monthly Maintenance: ₹${totalMonthlyMaintenance.toFixed(2)}`, 14, 36);

    (doc as any).autoTable({
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }, // primary-accent
      alternateRowStyles: { fillColor: [30, 41, 59] }, // dark gray
      bodyStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }, // even darker gray, white text
    });

    doc.save(`Vehicle_${vehicle?.reg_no}_Trips_${format(selectedMonth, "MMM_yyyy")}.pdf`);
    toast.success('Trip history exported as PDF!');
  };

  const handleExportExcel = () => {
    const data = trips.map(trip => ({
      From: trip.origin,
      To: trip.destination,
      Driver: trip.drivers?.name || 'N/A',
      'Distance (km)': trip.distance?.toFixed(2) || '0.00',
      'Avg Speed (km/h)': trip.avg_speed?.toFixed(2) || '0.00',
      'Maintenance Cost (₹)': trip.maintenance_cost?.toFixed(2) || '0.00',
      Status: trip.status,
      'Start Time': trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Trips");
    XLSX.writeFile(wb, `Vehicle_${vehicle?.reg_no}_Trips_${format(selectedMonth, "MMM_yyyy")}.xlsx`);
    toast.success('Trip history exported as Excel!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-primary-accent text-2xl">
        Loading vehicle details...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center text-gray-400">
        <h2 className="text-2xl font-bold text-destructive">Vehicle Not Found</h2>
        <p className="mt-2">The vehicle with Registration No. "{id}" could not be found.</p>
        <Button onClick={() => router.push('/vehicles')} className="mt-4 bg-primary-accent hover:bg-primary-accent/80 text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vehicles
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => router.push('/vehicles')} variant="outline" className="bg-transparent border-primary-accent/30 text-primary-accent hover:bg-primary-accent/10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vehicles
        </Button>
        <h1 className="text-3xl font-bold text-primary-accent">Vehicle: {vehicle.reg_no} ({vehicle.model})</h1>
        <div></div> {/* Spacer for alignment */}
      </div>

      <Card className="glassmorphism-card border-primary-accent/30">
        <CardHeader>
          <CardTitle className="text-secondary-accent">Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-text-light">
          <div>
            <p className="text-lg font-semibold text-white">Registration No: {vehicle.reg_no}</p>
            <p className="text-sm text-gray-300">Company: {vehicle.company || 'N/A'}</p>
            <p className="text-sm text-gray-300">Model: {vehicle.model || 'N/A'}</p>
            <p className="text-sm text-gray-300">Year: {vehicle.year || 'N/A'}</p>
            <p className="text-sm text-gray-300">Status: <span className={`font-semibold ${vehicle.status === 'Good' ? 'text-secondary-accent' : 'text-warning-accent'}`}>{vehicle.status}</span></p>
          </div>
        </CardContent>
      </Card>

      <Card className="glassmorphism-card border-primary-accent/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-secondary-accent">Trip History</CardTitle>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal bg-gray-700/50 border-primary-accent/20 text-white hover:bg-gray-600/50",
                    !selectedMonth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary-accent" />
                  {selectedMonth ? format(selectedMonth, "MMM yyyy") : <span>Pick a month</span>}
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
            <Button
              variant="outline"
              className="bg-transparent border-primary-accent/30 text-primary-accent hover:bg-primary-accent/10"
              onClick={fetchVehicleTrips}
              disabled={loading}
            >
              Refresh Trips
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={loading || trips.length === 0}
              className="bg-transparent border-secondary-accent/30 text-secondary-accent hover:bg-secondary-accent/10"
            >
              <FileText className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={loading || trips.length === 0}
              className="bg-transparent border-secondary-accent/30 text-secondary-accent hover:bg-secondary-accent/10"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-400">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="text-center text-gray-400">No trips found for {format(selectedMonth, "MMM yyyy")}.</div>
          ) : (
            <ScrollArea className="h-[400px] w-full rounded-md border border-primary-accent/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/50 text-secondary-accent">
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Avg Speed</TableHead>
                    <TableHead>Maintenance Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.trip_id} className="hover:bg-gray-700/30 transition-colors">
                      <TableCell className="text-gray-300">{trip.origin}</TableCell>
                      <TableCell className="text-gray-300">{trip.destination}</TableCell>
                      <TableCell className="text-gray-300">{trip.drivers?.name || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">{trip.distance?.toFixed(2) || '0.00'} km</TableCell>
                      <TableCell className="text-gray-300">{trip.avg_speed?.toFixed(2) || '0.00'} km/h</TableCell>
                      <TableCell className="text-secondary-accent">₹{trip.maintenance_cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
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
                      <TableCell className="text-gray-300">{trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-md border border-primary-accent/20 text-right text-lg font-bold text-white">
            Total Maintenance Cost for {format(selectedMonth, "MMM yyyy")}: <span className="text-secondary-accent">₹{totalMonthlyMaintenance.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}