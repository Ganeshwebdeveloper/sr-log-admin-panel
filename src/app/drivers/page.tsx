"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddDriverForm } from '@/components/drivers/add-driver-form';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Driver = Database['public']['Tables']['drivers']['Row'];

type SortColumn = keyof Driver;
type SortDirection = 'asc' | 'desc';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDriverDialogOpen, setIsAddDriverDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>(undefined);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // Sorting states
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const supabase = supabaseBrowser;

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order(sortColumn, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setDrivers(data);
    } catch (error: any) {
      toast.error(`Failed to fetch drivers: ${error.message}`);
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, sortColumn, sortDirection]);

  useEffect(() => {
    fetchDrivers();

    const channel = supabase
      .channel('public:drivers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, (payload) => {
        console.log('Driver change received!', payload);
        fetchDrivers(); // Re-fetch all drivers on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDrivers, supabase]);

  const handleDeleteDriver = async (drv_id: string) => {
    if (!confirm('Are you sure you want to delete this driver? This action cannot be undone.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('drv_id', drv_id);

      if (error) throw error;
      toast.success('Driver deleted successfully!');
      fetchDrivers();
    } catch (error: any) {
      toast.error(`Failed to delete driver: ${error.message}`);
      console.error('Error deleting driver:', error);
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
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
    const doc = new jsPDF('p', 'mm', 'a4'); // A4 portrait
    const title = "Drivers Report";
    const fileName = `drivers_report.pdf`;

    doc.setFontSize(16);
    doc.text(title, (doc as any).internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    (doc as any).autoTable({
      startY: 30, // Start table below the title
      head: [['DRV ID', 'Name', 'Email', 'Phone', 'Status']],
      body: drivers.map(driver => [
        driver.drv_id,
        driver.name,
        driver.email || 'N/A',
        driver.phone || 'N/A',
        driver.status,
      ]),
      theme: 'grid', // For all borders
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
    toast.success('Drivers list exported to PDF!');
  };

  const exportToExcel = () => {
    const data = drivers.map(driver => ({
      'DRV ID': driver.drv_id,
      Name: driver.name,
      Email: driver.email || 'N/A',
      Phone: driver.phone || 'N/A',
      Status: driver.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Drivers List");
    XLSX.writeFile(wb, `drivers_list.xlsx`);
    toast.success('Drivers list exported to Excel!');
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary-accent">Drivers Management</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDriverDialogOpen} onOpenChange={setIsAddDriverDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-accent hover:bg-primary-accent/80 text-white font-bold">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-primary-accent">Add New Driver</DialogTitle>
              </DialogHeader>
              <AddDriverForm onSuccess={() => setIsAddDriverDialogOpen(false)} onClose={() => setIsAddDriverDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPdf}
            disabled={drivers.length === 0}
            className="bg-transparent border-secondary-accent/30 text-secondary-accent hover:bg-secondary-accent/10"
          >
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={drivers.length === 0}
            className="bg-transparent border-warning-accent/30 text-warning-accent hover:bg-warning-accent/10"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-primary-accent">Edit Driver</DialogTitle>
            </DialogHeader>
            {selectedDriver && (
              <AddDriverForm
                initialData={selectedDriver}
                onSuccess={() => setIsEditDialogOpen(false)}
                onClose={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glassmorphism-card border-primary-accent/30">
        <CardHeader>
          <CardTitle className="text-secondary-accent">All Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-400">Loading drivers...</div>
          ) : drivers.length === 0 ? (
            <div className="text-center text-gray-400">No drivers found.</div>
          ) : (
            <ScrollArea className="h-[500px] w-full rounded-md border border-primary-accent/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/50 text-secondary-accent">
                    <TableHead>Photo</TableHead>
                    <TableHead onClick={() => handleSort('drv_id')} className="cursor-pointer hover:text-primary-accent">
                      DRV ID {getSortIcon('drv_id')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-primary-accent">
                      Name {getSortIcon('name')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('email')} className="cursor-pointer hover:text-primary-accent">
                      Email {getSortIcon('email')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('phone')} className="cursor-pointer hover:text-primary-accent">
                      Phone {getSortIcon('phone')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:text-primary-accent">
                      Status {getSortIcon('status')}
                    </TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow
                      key={driver.drv_id}
                      className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
                      <TableCell>
                        <img
                          src={driver.photo_url || '/placeholder-avatar.png'} // Placeholder image
                          alt={driver.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={`/drivers/${driver.drv_id}`} className="text-primary-accent hover:underline">
                          {driver.drv_id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-white">{driver.name}</TableCell>
                      <TableCell className="text-gray-300">{driver.email || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">{driver.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            driver.status === 'active'
                              ? 'bg-secondary-accent/20 text-secondary-accent'
                              : 'bg-warning-accent/20 text-warning-accent'
                          }`}
                        >
                          {driver.status}
                        </span>
                      </TableCell>
                      <TableCell className="relative">
                        <span className="text-gray-300">
                          {showPassword[driver.drv_id] ? driver.password : '********'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click from triggering
                            setShowPassword((prev) => ({
                              ...prev,
                              [driver.drv_id]: !prev[driver.drv_id],
                            }));
                          }}
                          className="ml-2 h-6 w-6 text-gray-400 hover:bg-gray-700/50"
                        >
                          {showPassword[driver.drv_id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDriver(driver);
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
                            handleDeleteDriver(driver.drv_id);
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