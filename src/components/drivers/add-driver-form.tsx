"use client";

import React, { useState, useEffect } from 'react';
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
  drv_id: z.string().min(1, { message: 'Driver ID is required.' }),
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  status: z.enum(['active', 'inactive'], { message: 'Status is required.' }),
  photo_url: z.string().url({ message: 'Invalid URL.' }).optional().or(z.literal('')),
});

type DriverFormValues = z.infer<typeof formSchema>;
type Driver = Database['public']['Tables']['drivers']['Row'];

interface AddDriverFormProps {
  onSuccess: () => void;
  onClose: () => void;
  initialData?: Driver;
}

export function AddDriverForm({ onSuccess, onClose, initialData }: AddDriverFormProps) {
  const supabase = supabaseBrowser;
  const form = useForm<DriverFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drv_id: initialData?.drv_id || '',
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      password: initialData?.password || '', // Note: In a real app, never pre-fill passwords
      status: initialData?.status || 'inactive',
      photo_url: initialData?.photo_url || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        drv_id: initialData.drv_id,
        name: initialData.name,
        email: initialData.email || '',
        phone: initialData.phone || '',
        password: '', // Always clear password for security
        status: initialData.status,
        photo_url: initialData.photo_url || '',
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: DriverFormValues) => {
    try {
      if (initialData) {
        // Update existing driver
        const { error } = await supabase
          .from('drivers')
          .update({
            name: values.name,
            email: values.email || null,
            phone: values.phone || null,
            password: values.password, // Update password if provided
            status: values.status,
            photo_url: values.photo_url || null,
          })
          .eq('drv_id', initialData.drv_id);

        if (error) throw error;
        toast.success('Driver updated successfully!');
      } else {
        // Add new driver
        const { error } = await supabase.from('drivers').insert({
          drv_id: values.drv_id,
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
          password: values.password,
          status: values.status,
          photo_url: values.photo_url || null,
        });

        if (error) throw error;
        toast.success('Driver added successfully!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Operation failed: ${error.message}`);
      console.error('Driver form error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="drv_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-300">Driver ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="DRV001"
                  {...field}
                  disabled={!!initialData} // Disable editing DRV_ID for existing drivers
                  className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-300">Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  {...field}
                  className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-300">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  {...field}
                  className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-300">Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="+91 9876543210"
                  {...field}
                  className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-300">Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="********"
                  {...field}
                  className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400"
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
              <FormLabel className="text-gray-700 dark:text-gray-300">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="photo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-300">Photo URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  {...field}
                  className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900 font-bold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Driver' : 'Add Driver'}
        </Button>
      </form>
    </Form>
  );
}