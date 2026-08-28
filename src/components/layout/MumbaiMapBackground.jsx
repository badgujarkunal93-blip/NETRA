import React from 'react';

export default function MumbaiMapBackground() {
  return (
    <div
      className="dashboard-background"
      aria-hidden="true"
    >
      <img
        src="/mumbai_map_bg.jpg"
        alt=""
        className="w-full h-full object-cover opacity-60"
      />
    </div>
  );
}
