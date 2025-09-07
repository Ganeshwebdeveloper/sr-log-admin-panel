"use client";

import React from 'react';
import { Filter, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, getYear } from 'date-fns';
import { Database } from '@/types/supabase';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface TripsFiltersProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  filterDriver: string;
  setFilterDriver: (value: string) => void;
  filterVehicle: string;
  setFilterVehicle: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
}

export function TripsFilters({
  drivers,
  vehicles,
  filterDriver,
  setFilterDriver,
  filterVehicle,
  setFilterVehicle,
  filterStatus,
  setFilterStatus,
  selectedMonth,
  setSelectedMonth,
}: TripsFiltersProps) {
  return (
    <Card className="glassmorphism-card border-primary-accent/30">
      <CardHeader>
        <CardTitle className="text-secondary-accent flex items-center gap-2">
          <Filter className="h-5 w-5" /> Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select onValueChange={setFilterDriver} value={filterDriver}>
          <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
            <SelectValue placeholder="Filter by Driver" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((driver) => (
              driver.drv_id ? (
                <SelectItem key={driver.drv_id} value={driver.drv_id}>
                  {driver.name}
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterVehicle} value={filterVehicle}>
          <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
            <SelectValue placeholder="Filter by Vehicle" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicles.map((vehicle) => (
              vehicle.reg_no ? (
                <SelectItem key={vehicle.reg_no} value={vehicle.reg_no}>
                  {vehicle.company} {vehicle.model} ({vehicle.reg_no})
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterStatus} value={filterStatus}>
          <SelectTrigger className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal bg-gray-700/50 border-primary-accent/20 text-white hover:bg-gray-600/50",
                !selectedMonth && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary-accent" />
              {selectedMonth ? format(selectedMonth, "MMM yyyy") : <span>Filter by Month</span>}
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
      </CardContent>
    </Card>
  );
}