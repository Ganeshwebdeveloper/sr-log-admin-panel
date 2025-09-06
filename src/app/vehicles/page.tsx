"use client";

import React from 'react';

export default function VehiclesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-3xl font-bold text-primary-accent">Vehicles Management</h1>
      <p className="text-gray-300">This page will display a table of vehicles and allow for adding, editing, and deleting vehicles.</p>
    </div>
  );
}