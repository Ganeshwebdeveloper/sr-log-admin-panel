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
  start_time: z.coerce.date({ // Using z.coerce.date for robust parsing and validation
    required_error: 'Start time is required.',
    invalid_type_error: 'Start time must be a valid date.',
  }),
  driver_salary: z
    .union([z.coerce.number(), z.null()])
    .optional()
    .nullable()
    .refine((val) => val === null || val === undefined || val >= 0, {
      message: 'Driver salary must be a positive number.',
    }),
  profit: z
    .union([z.coerce.number(), z.null()])
    .optional()
    .nullable()
    .refine((val) => val === null || val === undefined || !isNaN(val), {
      message: 'Profit must be a number.',
    }),
  status: z.enum(['pending', 'started', 'finished'], { message: 'Status is required.' }),
});

type AssignTripFormValues = z.infer<typeof formSchema>;

interface AssignTripFormProps {
  onSuccess: () => void;
  onClose: () => void;
  initialData?: Trip;
  availableDrivers: Driver[]; // New prop
  availableVehicles: Vehicle[]; // New prop
  allDrivers: Driver[]; // New prop for ensuring current driver is available on edit
  allVehicles: Vehicle[]; // New prop for ensuring current vehicle is available on edit
}

export function AssignTripForm({
  onSuccess,
  onClose,
  initialData,
  availableDrivers,
  availableVehicles,
  allDrivers,
  allVehicles,
}: AssignTripFormProps) {
  const supabase = supabaseBrowser;

  const form = useForm<AssignTripFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drv_id: initialData?.drv_id || '',
      vehicle_reg_no: initialData?.vehicle_reg_no || '',
      origin: initialData?.origin || '',
      destination: initialData?.destination || '',
      start_time: initialData?.start_time ? new Date(initialData.start_time) : new Date(),
      driver_salary: initialData?.driver_salary ?? null, // Use null for optional nullable numbers
      profit: initialData?.profit ?? null, // Use null for optional nullable numbers
      status: initialData?.status || 'pending',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        drv_id: initialData.drv_id || '',
        vehicle_reg_no: initialData.vehicle_reg_no || '',
        origin: initialData.origin || '',
        destination: initialData.destination || '',
        start_time: initialData.start_time ? new Date(initialData.start_time) : new Date(),
        driver_salary: initialData.driver_salary,
        profit: initialData.profit,
        status: initialData.status,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: AssignTripFormValues) => {
    try {
      const driverSalary = values.driver_salary ?? 0;
      const profit = values.profit ?? 0;

      const totalCost = driverSalary + profit; // Initial calculation

      const tripData = {
        drv_id: values.drv_id,
        vehicle_reg_no: values.vehicle_reg_no,
        origin: values.origin,
        destination: values.destination,
        start_time: values.start_time.toISOString(),
        end_time: null, // Set to null at creation
        distance: null, // Set to null at creation
        avg_speed: null, // Set to null at creation
        current_location: null, // Set to null at creation
        driver_salary: driverSalary,
        fuel_cost: null, // Set to null at creation
        maintenance_cost: null, // Set to null at creation
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

  // Combine available drivers/vehicles with the currently selected one (if editing)
  const driversForSelect = initialData?.drv_id
    ? [...availableDrivers, ...allDrivers.filter(d => d.drv_id === initialData.drv_id && !availableDrivers.some(ad => ad.drv_id === d.drv_id))]
    : availableDrivers;

  const vehiclesForSelect = initialData?.vehicle_reg_no
    ? [...availableVehicles, ...allVehicles.filter(v => v.reg_no === initialData.vehicle_reg_no && !availableVehicles.some(av => av.reg_no === v.reg_no))]
    : availableVehicles;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="drv_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Driver</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  {driversForSelect.map((driver) => (
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  {vehiclesForSelect.map((vehicle) => (
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
              <FormLabel className="text-text-light">From</FormLabel>
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
              <FormLabel className="text-text-light">To</FormLabel>
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
          name="driver_salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Salary (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1500.00"
                  {...field}
                  value={field.value ?? ''} // Use nullish coalescing to display empty string for null/undefined
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} // Pass null for empty string
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profit"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Profit (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  {...field}
                  value={field.value ?? ''} // Use nullish coalescing to display empty string for null/undefined
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} // Pass null for empty string
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
              <Select onValueChange={field.onChange} value={field.value}>
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