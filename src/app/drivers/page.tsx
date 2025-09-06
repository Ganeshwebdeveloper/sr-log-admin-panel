"use client";

import React from 'react';

export default function DriversPage() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-3xl font-bold text-primary-accent">Drivers Management</h1>
      <p className="text-gray-300">This page will display a table of drivers and allow for adding, editing, and deleting drivers.</p>
    </div>
  );
}