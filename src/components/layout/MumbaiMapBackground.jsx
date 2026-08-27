import React from 'react';

export default function MumbaiMapBackground() {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    >
      <img
        src="/mumbai_map_bg.jpg"
        alt="Mumbai Geographic Background"
        className="w-full h-full object-cover opacity-60"
      />
    </div>
  );
}
