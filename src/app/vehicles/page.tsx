"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddVehicleForm } from '@/components/vehicles/add-vehicle-form';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

type SortColumn = keyof Vehicle;
type SortDirection = 'asc' | 'desc';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<SortColumn>('reg_no');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const supabase = supabaseBrowser;

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order(sortColumn, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setVehicles(data);
    } catch (error: any) {
      toast.error(`Failed to fetch vehicles: ${error.message}`);
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, sortColumn, sortDirection]);

  useEffect(() => {
    fetchVehicles();

    const channel = supabase
      .channel('public:vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
        console.log('Vehicle change received!', payload);
        fetchVehicles(); // Re-fetch all vehicles on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVehicles, supabase]);

  const handleDeleteVehicle = async (reg_no: string) => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('reg_no', reg_no);

      if (error) throw error;
      toast.success('Vehicle deleted successfully!');
      fetchVehicles();
    } catch (error: any) {
      toast.error(`Failed to delete vehicle: ${error.message}`);
      console.error('Error deleting vehicle:', error);
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
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

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("All Vehicles List", 14, 20);

    doc.autoTable({
      startY: 30,
      head: [['Registration No.', 'Company', 'Model', 'Year', 'Status']],
      body: vehicles.map(vehicle => [
        vehicle.reg_no,
        vehicle.company || 'N/A',
        vehicle.model || 'N/A',
        vehicle.year || 'N/A',
        vehicle.status,
      ]),
      theme: 'striped',
      styles: { fillColor: [30, 41, 59] },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [45, 55, 72] },
    });

    doc.save(`vehicles_list.pdf`);
    toast.success('Vehicles list exported to PDF!');
  };

  const exportToExcel = () => {
    const data = vehicles.map(vehicle => ({
      'Registration No.': vehicle.reg_no,
      Company: vehicle.company || 'N/A',
      Model: vehicle.model || 'N/A',
      Year: vehicle.year || 'N/A',
      Status: vehicle.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicles List");
    XLSX.writeFile(wb, `vehicles_list.xlsx`);
    toast.success('Vehicles list exported to Excel!');
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary-accent">Vehicles Management</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-accent hover:bg-primary-accent/80 text-white font-bold">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-primary-accent">Add New Vehicle</DialogTitle>
              </DialogHeader>
              <AddVehicleForm onSuccess={() => setIsAddVehicleDialogOpen(false)} onClose={() => setIsAddVehicleDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPdf}
            disabled={vehicles.length === 0}
            className="bg-transparent border-secondary-accent/30 text-secondary-accent hover:bg-secondary-accent/10"
          >
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={vehicles.length === 0}
            className="bg-transparent border-warning-accent/30 text-warning-accent hover:bg-warning-accent/10"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-primary-accent">Edit Vehicle</DialogTitle>
            </DialogHeader>
            {selectedVehicle && (
              <AddVehicleForm
                initialData={selectedVehicle}
                onSuccess={() => setIsEditDialogOpen(false)}
                onClose={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glassmorphism-card border-primary-accent/30">
        <CardHeader>
          <CardTitle className="text-secondary-accent">All Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-400">Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="text-center text-gray-400">No vehicles found.</div>
          ) : (
            <ScrollArea className="h-[500px] w-full rounded-md border border-primary-accent/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/50 text-secondary-accent">
                    <TableHead onClick={() => handleSort('reg_no')} className="cursor-pointer hover:text-primary-accent">
                      Registration No. {getSortIcon('reg_no')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('company')} className="cursor-pointer hover:text-primary-accent">
                      Company {getSortIcon('company')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('model')} className="cursor-pointer hover:text-primary-accent">
                      Model {getSortIcon('model')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('year')} className="cursor-pointer hover:text-primary-accent">
                      Year {getSortIcon('year')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:text-primary-accent">
                      Status {getSortIcon('status')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow
                      key={vehicle.reg_no}
                      className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
                      <TableCell>
                        <Link href={`/vehicles/${vehicle.reg_no}`} className="text-primary-accent hover:underline">
                          {vehicle.reg_no}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-white">{vehicle.company} / {vehicle.model}</TableCell>
                      <TableCell className="text-gray-300">{vehicle.year}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            vehicle.status === 'Good'
                              ? 'bg-secondary-accent/20 text-secondary-accent'
                              : 'bg-warning-accent/20 text-warning-accent'
                          }`}
                        >
                          {vehicle.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditVehicle(vehicle);
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
                            handleDeleteVehicle(vehicle.reg_no);
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