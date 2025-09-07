"use client";

import React, { useState } from 'react';
import { PlusCircle, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AssignTripForm } from '@/components/trips/assign-trip-form';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Database } from '@/types/supabase';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  drivers: { name: string } | null;
  vehicles: { reg_no: string; company: string; model: string } | null;
};
type Driver = Database['public']['Tables']['drivers']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface TripsActionsProps {
  trips: Trip[];
  onTripAdded: () => void;
  onTripUpdated: () => void;
  handleDeleteTrip: (trip_id: string) => void;
  selectedTrip: Trip | undefined;
  setSelectedTrip: (trip: Trip | undefined) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  availableDrivers: Driver[]; // New prop
  availableVehicles: Vehicle[]; // New prop
  allDrivers: Driver[]; // New prop
  allVehicles: Vehicle[]; // New prop
}

export function TripsActions({
  trips,
  onTripAdded,
  onTripUpdated,
  handleDeleteTrip,
  selectedTrip,
  setSelectedTrip,
  isEditDialogOpen,
  setIsEditDialogOpen,
  availableDrivers,
  availableVehicles,
  allDrivers,
  allVehicles,
}: TripsActionsProps) {
  const [isAssignTripDialogOpen, setIsAssignTripDialogOpen] = useState(false);

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsEditDialogOpen(true);
  };

  const exportToPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4'); // A4 portrait
    const title = "Trips Report";
    const fileName = `trips_report.pdf`;

    doc.setFontSize(16);
    doc.text(title, (doc as any).internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    (doc as any).autoTable({
      startY: 30, // Start table below the title
      head: [['From', 'To', 'Driver', 'Vehicle', 'Status', 'Start Time', 'End Time', 'Distance (km)', 'Avg Speed (km/h)', 'Current Location', 'Salary (₹)', 'Fuel Cost (₹)', 'Profit (₹)', 'Total Cost (₹)']],
      body: trips.map(trip => [
        trip.origin || '—',
        trip.destination || '—',
        trip.drivers?.name || '—',
        trip.vehicles?.reg_no || '—',
        trip.status || '—',
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
      didDrawPage: function (data: any) { // Explicitly type data as any
        // Header
        doc.setFontSize(10);
        doc.setTextColor(0); // Black text
        doc.text("SR Logistics Admin Panel", data.settings.margin.left, 10);

        // Footer
        doc.setFontSize(10);
        doc.text(`Page ${data.pageNumber} of {total_pages}`, (doc as any).internal.pageSize.width - data.settings.margin.right, (doc as any).internal.pageSize.height - 10, { align: 'right' });
      }
    });

    (doc as any).putTotalPages("{total_pages}"); // Fill in total pages placeholder
    doc.save(fileName);
    toast.success('Trips list exported to PDF!');
  };

  const exportToExcel = () => {
    const data = trips.map(trip => ({
      From: trip.origin || '—',
      To: trip.destination || '—',
      Driver: trip.drivers?.name || '—',
      Vehicle: trip.vehicles?.reg_no || '—',
      Status: trip.status || '—',
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
            <AssignTripForm
              onSuccess={onTripAdded}
              onClose={() => setIsAssignTripDialogOpen(false)}
              availableDrivers={availableDrivers}
              availableVehicles={availableVehicles}
              allDrivers={allDrivers}
              allVehicles={allVehicles}
            />
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
              onSuccess={onTripUpdated}
              onClose={() => setIsEditDialogOpen(false)}
              availableDrivers={availableDrivers}
              availableVehicles={availableVehicles}
              allDrivers={allDrivers}
              allVehicles={allVehicles}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}