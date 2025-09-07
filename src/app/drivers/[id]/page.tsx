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

import jsPDF from 'jspdf';
import 'jspdf-autotable'; // This import extends jsPDF with autoTable
import * as XLSX from 'xlsx';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'] & {
  vehicles: { reg_no: string } | null;
};

export default function SingleDriverPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = supabaseBrowser;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [totalMonthlySalary, setTotalMonthlySalary] = useState<number>(0);

  const fetchDriverDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('drv_id', id)
        .single();

      if (driverError) throw driverError;
      setDriver(driverData);
    } catch (error: any) {
      toast.error(`Failed to fetch driver details: ${error.message}`);
      console.error('Error fetching driver details:', error);
      setDriver(null);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  const fetchDriverTrips = useCallback(async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd HH:mm:ss');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd HH:mm:ss');

      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          vehicles(reg_no)
        `)
        .eq('drv_id', id)
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time', { ascending: false })
        .limit(30); // Last 30 trips

      if (tripsError) throw tripsError;
      setTrips(tripsData as Trip[]);

      const totalSalary = tripsData.reduce((sum, trip) => sum + (trip.driver_salary || 0), 0);
      setTotalMonthlySalary(totalSalary);

    } catch (error: any) {
      toast.error(`Failed to fetch driver trips: ${error.message}`);
      console.error('Error fetching driver trips:', error);
      setTrips([]);
      setTotalMonthlySalary(0);
    } finally {
      setLoading(false);
    }
  }, [id, selectedMonth, supabase]);

  useEffect(() => {
    fetchDriverDetails();
  }, [fetchDriverDetails]);

  useEffect(() => {
    if (driver) {
      fetchDriverTrips();
    }
  }, [driver, fetchDriverTrips]);

  const exportToPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const title = `Trip History for ${driver?.name} (${format(selectedMonth, "MMM yyyy")})`;
    const fileName = `driver_${driver?.drv_id}_trips_${format(selectedMonth, "MMM_yyyy")}.pdf`;

    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    doc.autoTable({
      startY: 30,
      head: [['From', 'To', 'Vehicle', 'Distance (km)', 'Avg Speed (km/h)', 'Driver Salary (₹)', 'Status', 'Start Time']],
      body: trips.map(trip => [
        trip.origin,
        trip.destination,
        trip.vehicles?.reg_no || 'N/A',
        trip.distance?.toFixed(2) || '0.00',
        trip.avg_speed?.toFixed(2) || '0.00',
        `₹${trip.driver_salary?.toFixed(2) || '0.00'}`,
        trip.status,
        trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : 'N/A',
      ]),
      theme: 'grid',
      headStyles: {
        fontStyle: 'bold',
        fontSize: 12,
        textColor: [0, 0, 0], // Black
        fillColor: [255, 255, 255], // White background
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [0, 0, 0], // Black
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        valign: 'middle',
      },
      margin: { top: 30, right: 10, bottom: 20, left: 10 },
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

    doc.setFontSize(12);
    doc.setTextColor(0); // Black text for total salary
    doc.text(`Total Salary for ${format(selectedMonth, "MMM yyyy")}: ₹${totalMonthlySalary.toFixed(2)}`, 14, (doc as any).autoTable.previous.finalY + 10);

    doc.putTotalPages("{total_pages}");
    doc.save(fileName);
    toast.success('Trip history exported to PDF!');
  };

  const exportToExcel = () => {
    const data = trips.map(trip => ({
      From: trip.origin,
      To: trip.destination,
      Vehicle: trip.vehicles?.reg_no || 'N/A',
      'Distance (km)': trip.distance?.toFixed(2) || '0.00',
      'Avg Speed (km/h)': trip.avg_speed?.toFixed(2) || '0.00',
      'Driver Salary (₹)': trip.driver_salary?.toFixed(2) || '0.00',
      Status: trip.status,
      'Start Time': trip.start_time ? format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm') : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.sheet_add_json(ws, [{ 'Total Monthly Salary (₹)': totalMonthlySalary.toFixed(2) }], { origin: -1 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trip History");
    XLSX.writeFile(wb, `driver_${driver?.drv_id}_trips_${format(selectedMonth, "MMM_yyyy")}.xlsx`);
    toast.success('Trip history exported to Excel!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-primary-accent text-2xl">
        Loading driver details...
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center text-gray-400">
        <h2 className="text-2xl font-bold text-destructive">Driver Not Found</h2>
        <p className="mt-2">The driver with ID "{id}" could not be found.</p>
        <Button onClick={() => router.push('/drivers')} className="mt-4 bg-primary-accent hover:bg-primary-accent/80 text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Drivers
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => router.push('/drivers')} variant="outline" className="bg-transparent border-primary-accent/30 text-primary-accent hover:bg-primary-accent/10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Drivers
        </Button>
        <h1 className="text-3xl font-bold text-primary-accent">Driver: {driver.name} ({driver.drv_id})</h1>
        <div></div> {/* Spacer for alignment */}
      </div>

      <Card className="glassmorphism-card border-primary-accent/30">
        <CardHeader>
          <CardTitle className="text-secondary-accent">Driver Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-text-light">
          <div className="flex items-center gap-4">
            <img
              src={driver.photo_url || '/placeholder-avatar.png'}
              alt={driver.name}
              className="h-24 w-24 rounded-full object-cover border border-primary-accent/50"
            />
            <div>
              <p className="text-lg font-semibold text-white">{driver.name}</p>
              <p className="text-sm text-gray-300">ID: {driver.drv_id}</p>
              <p className="text-sm text-gray-300">Email: {driver.email || 'N/A'}</p>
              <p className="text-sm text-gray-300">Phone: {driver.phone || 'N/A'}</p>
              <p className="text-sm text-gray-300">Status: <span className={`font-semibold ${driver.status === 'active' ? 'text-secondary-accent' : 'text-warning-accent'}`}>{driver.status}</span></p>
            </div>
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
              onClick={fetchDriverTrips}
              disabled={loading}
            >
              Refresh Trips
            </Button>
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
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Avg Speed</TableHead>
                    <TableHead>Driver Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.trip_id} className="hover:bg-gray-700/30 transition-colors">
                      <TableCell className="text-gray-300">{trip.origin}</TableCell>
                      <TableCell className="text-gray-300">{trip.destination}</TableCell>
                      <TableCell className="text-gray-300">{trip.vehicles?.reg_no || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">{trip.distance?.toFixed(2) || '0.00'} km</TableCell>
                      <TableCell className="text-gray-300">{trip.avg_speed?.toFixed(2) || '0.00'} km/h</TableCell>
                      <TableCell className="text-secondary-accent">₹{trip.driver_salary?.toFixed(2) || '0.00'}</TableCell>
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
            Total Salary for {format(selectedMonth, "MMM yyyy")}: <span className="text-secondary-accent">₹{totalMonthlySalary.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}