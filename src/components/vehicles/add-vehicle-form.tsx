"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase';
import { Database } from '@/types/supabase';

const formSchema = z.object({
  reg_no: z.string().min(1, { message: 'Registration Number is required.' }),
  company: z.string().min(1, { message: 'Company is required.' }),
  model: z.string().min(1, { message: 'Model is required.' }),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1, { message: 'Invalid year.' }),
  status: z.enum(['Good', 'Maintenance'], { message: 'Status is required.' }),
});

type VehicleFormValues = z.infer<typeof formSchema>;
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface AddVehicleFormProps {
  onSuccess: () => void;
  onClose: () => void;
  initialData?: Vehicle;
}

export function AddVehicleForm({ onSuccess, onClose, initialData }: AddVehicleFormProps) {
  const supabase = supabaseBrowser;
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reg_no: initialData?.reg_no || '',
      company: initialData?.company || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      status: initialData?.status || 'Good',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        reg_no: initialData.reg_no,
        company: initialData.company || '',
        model: initialData.model || '',
        year: initialData.year || new Date().getFullYear(),
        status: initialData.status,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: VehicleFormValues) => {
    try {
      if (initialData) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update({
            company: values.company,
            model: values.model,
            year: values.year,
            status: values.status,
          })
          .eq('reg_no', initialData.reg_no);

        if (error) throw error;
        toast.success('Vehicle updated successfully!');
      } else {
        // Add new vehicle
        const { error } = await supabase.from('vehicles').insert({
          reg_no: values.reg_no,
          company: values.company,
          model: values.model,
          year: values.year,
          status: values.status,
        });

        if (error) throw error;
        toast.success('Vehicle added successfully!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Operation failed: ${error.message}`);
      console.error('Vehicle form error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reg_no"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Registration No.</FormLabel>
              <FormControl>
                <Input
                  placeholder="KA01AB1234"
                  {...field}
                  disabled={!!initialData} // Disable editing Reg No for existing vehicles
                  className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Company</FormLabel>
              <FormControl>
                <Input
                  placeholder="Tata Motors"
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
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Model</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ace Gold"
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
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-light">Year</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2020"
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
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
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
          {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </form>
    </Form>
  );
}