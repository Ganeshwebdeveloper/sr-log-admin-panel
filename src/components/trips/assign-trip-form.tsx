"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'];

const formSchema = z.object({
  drv_id: z.string().min(1, { message: 'Driver is required.' }),
  vehicle_reg_no: z.string().min(1, { message: 'Vehicle is required.' }),
  origin: z.string().min(1, { message: 'Origin is required.' }),
  destination: z.string().min(1, { message: 'Destination is required.' }),
  start_time: z.date({ required_error: 'Start time is required.' }),
  end_time: z.date().optional(),
  distance: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, { message: 'Distance must be a positive number.' }).optional()
  ),
  avg_speed: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, { message: 'Average speed must be a positive number.' }).optional()
  ),
  current_location: z.string().optional().or(z.literal('')),
  driver_salary: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, { message: 'Driver salary must be a positive number.' }).optional()
  ),
  fuel_cost: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, { message: 'Fuel cost must be a positive number.' }).optional()
  ),
  maintenance_cost: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, { message: 'Maintenance cost must be a positive number.' }).optional()
  ),
  status: z.enum(['pending', 'started', 'finished'], { message: 'Status is required.' }),
});

type AssignTripFormValues = z.infer<typeof formSchema>;

interface AssignTripFormProps {
  onSuccess: () => void;
  onClose: () => void;
  initialData?: Trip;
}

export function AssignTripForm({ onSuccess, onClose, initialData }: AssignTripFormProps) {
  const supabase = supabaseBrowser;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<AssignTripFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drv_id: initialData?.drv_id || '',
      vehicle_reg_no: initialData?.vehicle_reg_no || '',
      origin: initialData?.origin || '',
      destination: initialData?.destination || '',
      start_time: initialData?.start_time ? new Date(initialData.start_time) : new Date(),
      end_time: initialData?.end_time ? new Date(initialData.end_time) : undefined,
      distance: initialData?.distance || undefined,
      avg_speed: initialData?.avg_speed || undefined,
      current_location: initialData?.current_location || '',
      driver_salary: initialData?.driver_salary || undefined,
      fuel_cost: initialData?.fuel_cost || undefined,
      maintenance_cost: initialData?.maintenance_cost || undefined,
      status: initialData?.status || 'pending',
    },
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      setLoadingData(true);
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
        toast.error(`Failed to load form data: ${error.message}`);
        console.error('Error fetching form dependencies:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchDependencies();
  }, [supabase]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        drv_id: initialData.drv_id || '',
        vehicle_reg_no: initialData.vehicle_reg_no || '',
        origin: initialData.origin || '',
        destination: initialData.destination || '',
        start_time: initialData.start_time ? new Date(initialData.start_time) : new Date(),
        end_time: initialData.end_time ? new Date(initialData.end_time) : undefined,
        distance: initialData.distance || undefined,
        avg_speed: initialData.avg_speed || undefined,
        current_location: initialData.current_location || '',
        driver_salary: initialData.driver_salary || undefined,
        fuel_cost: initialData.fuel_cost || undefined,
        maintenance_cost: initialData.maintenance_cost || undefined,
        status: initialData.status,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: AssignTripFormValues) => {
    try {
      const driverSalary = values.driver_salary || 0;
      const fuelCost = values.fuel_cost || 0;
      const maintenanceCost = values.maintenance_cost || 0;

      const totalCost = driverSalary + fuelCost + maintenanceCost;
      const profit = (values.distance || 0) * 10 - totalCost; // Example profit calculation

      const tripData = {
        drv_id: values.drv_id,
        vehicle_reg_no: values.vehicle_reg_no,
        origin: values.origin,
        destination: values.destination,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time ? values.end_time.toISOString() : null,
        distance: values.distance || null,
        avg_speed: values.avg_speed || null,
        current_location: values.current_location || null,
        driver_salary: driverSalary,
        fuel_cost: fuelCost,
        maintenance_cost: maintenanceCost,
        total_cost: totalCost,
        profit: profit,
        status: values.status,
      };

      if (initialData) {
        // Update existing trip
        const { error } = await supabase
          .from('trips')
          .update(tripData)
          .eq('trip_id', initialData.trip_id);

        if (error) throw error;
        toast.success('Trip updated successfully!');
      } else {
        // Assign new trip
        const { error } = await supabase.from('trips').insert(tripData);

        if (error) throw error;
        toast.success('Trip assigned successfully!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Operation failed: ${error.message}`);
      console.error('Trip form error:', error);
    }
  };

  if (loadingData) {
    return <div className="text-center text-gray-400">Loading form data...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="drv_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Driver</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  {drivers.map((driver) => (
                    <SelectItem key={driver.drv_id} value={driver.drv_id}>
                      {driver.name} ({driver.drv_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehicle_reg_no"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Vehicle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.reg_no} value={vehicle.reg_no}>
                      {vehicle.company} {vehicle.model} ({vehicle.reg_no})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Origin</FormLabel>
              <FormControl>
                <Input
                  placeholder="City A"
                  {...field}
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Destination</FormLabel>
              <FormControl>
                <Input
                  placeholder="City B"
                  {...field}
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="start_time"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-text-light">Start Time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-700/50 border-primary-accent/20 text-white hover:bg-gray-600/50",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary-accent" />
                      {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date and time</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border text-foreground" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                    <Input
                      type="time"
                      value={field.value ? format(field.value, "HH:mm") : ''}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = field.value ? new Date(field.value) : new Date();
                        newDate.setHours(hours, minutes);
                        field.onChange(newDate);
                      }}
                      className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_time"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-text-light">End Time (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-700/50 border-primary-accent/20 text-white hover:bg-gray-600/50",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary-accent" />
                      {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date and time</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border text-foreground" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                    <Input
                      type="time"
                      value={field.value ? format(field.value, "HH:mm") : ''}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = field.value ? new Date(field.value) : new Date();
                        newDate.setHours(hours, minutes);
                        field.onChange(newDate);
                      }}
                      className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="distance"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Distance (km)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.5"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avg_speed"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Average Speed (km/h)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="60.0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="current_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Current Location (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="En route to City B"
                  {...field}
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="driver_salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Driver Salary (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1500.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fuel_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Fuel Cost (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2000.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maintenance_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Maintenance Cost (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-primary-accent hover:bg-primary-accent/80 text-white font-bold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Trip' : 'Assign Trip'}
        </Button>
      </form>
    </Form>
  );
}