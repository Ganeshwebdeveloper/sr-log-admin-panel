"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddDriverForm } from '@/components/drivers/add-driver-form';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';

type Driver = Database['public']['Tables']['drivers']['Row'];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDriverDialogOpen, setIsAddDriverDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>(undefined);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const supabase = supabaseBrowser;

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setDrivers(data);
    } catch (error: any) {
      toast.error(`Failed to fetch drivers: ${error.message}`);
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

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

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary-accent">Drivers Management</h1>
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
                    <TableHead>DRV ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
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