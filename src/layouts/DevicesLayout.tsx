import React from 'react';
import { Outlet } from 'react-router-dom';

export default function DevicesLayout() {
  return (
    <div className="max-w-4xl mx-auto w-full">
      <Outlet />
    </div>
  );
}
