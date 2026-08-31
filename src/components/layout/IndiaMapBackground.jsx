import React from 'react';

export default function IndiaMapBackground() {
  return (
    <div
      className="dashboard-background flex items-center justify-end pr-4 md:pr-16 pointer-events-none"
      aria-hidden="true"
    >
      {/* High-Precision Tactical Geospatial India Map Watermark */}
      <svg
        viewBox="0 0 800 900"
        className="w-[600px] lg:w-[850px] xl:w-[1000px] h-auto object-contain select-none"
        style={{
          opacity: 0.08, // 8% crisp Navy intelligence watermark
          color: '#0B2341',
        }}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
      >
        <g transform="translate(10, 10)">
          {/* Detailed India Map Geometric Boundaries & Coastline Vector */}
          <path
            d="M340,45 L365,30 L395,20 L425,25 L450,45 L470,80 L490,110 L520,130 L550,140 L580,145 L610,140 L635,150 L650,175 L670,195 L690,200 L710,190 L730,195 L745,215 L740,240 L720,255 L695,260 L680,280 L675,305 L690,320 L710,315 L725,330 L720,350 L695,365 L665,365 L645,380 L630,370 L610,380 L590,375 L570,390 L550,385 L530,400 L510,410 L490,410 L470,425 L450,420 L430,435 L420,455 L405,470 L390,490 L380,515 L370,545 L360,575 L350,605 L340,635 L330,665 L320,695 L310,725 L300,750 L290,780 L280,810 L270,830 L260,810 L250,780 L240,750 L230,720 L220,685 L210,650 L200,615 L190,580 L180,550 L175,520 L165,490 L160,460 L150,430 L140,405 L130,380 L115,360 L95,350 L80,360 L65,350 L55,330 L60,310 L75,295 L95,290 L110,270 L125,250 L140,230 L155,210 L170,195 L190,185 L210,180 L230,165 L250,150 L270,135 L290,115 L310,90 L325,65 Z"
            fillRule="evenodd"
            opacity="0.9"
          />

          {/* Internal Tactical Geospatial Coordinate Grid & Radar Rings */}
          <g stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.6">
            {/* Latitude parallels */}
            <line x1="40" y1="150" x2="760" y2="150" strokeDasharray="4 8" />
            <line x1="40" y1="300" x2="760" y2="300" strokeDasharray="4 8" />
            <line x1="40" y1="450" x2="760" y2="450" strokeDasharray="4 8" />
            <line x1="40" y1="600" x2="760" y2="600" strokeDasharray="4 8" />
            <line x1="40" y1="750" x2="760" y2="750" strokeDasharray="4 8" />

            {/* Longitude meridians */}
            <line x1="150" y1="40" x2="150" y2="860" strokeDasharray="4 8" />
            <line x1="300" y1="40" x2="300" y2="860" strokeDasharray="4 8" />
            <line x1="450" y1="40" x2="450" y2="860" strokeDasharray="4 8" />
            <line x1="600" y1="40" x2="600" y2="860" strokeDasharray="4 8" />

            {/* Intelligence Coordinate Crosshairs & Hubs */}
            {/* New Delhi Hub */}
            <circle cx="340" cy="220" r="14" />
            <circle cx="340" cy="220" r="4" fill="currentColor" />
            {/* Mumbai CIU Command Center Hub */}
            <circle cx="210" cy="460" r="18" strokeWidth="1.2" />
            <circle cx="210" cy="460" r="5" fill="currentColor" />
            <line x1="180" y1="460" x2="240" y2="460" />
            <line x1="210" y1="430" x2="210" y2="490" />
            {/* Bengaluru / Hyderabad Hub */}
            <circle cx="280" cy="620" r="10" />
            <circle cx="280" cy="620" r="3" fill="currentColor" />
            {/* Kolkata Hub */}
            <circle cx="530" cy="380" r="10" />
            <circle cx="530" cy="380" r="3" fill="currentColor" />
            {/* Tactical Vector Interconnects */}
            <line x1="210" y1="460" x2="340" y2="220" strokeDasharray="2 4" strokeWidth="1" />
            <line x1="210" y1="460" x2="280" y2="620" strokeDasharray="2 4" strokeWidth="1" />
            <line x1="340" y1="220" x2="530" y2="380" strokeDasharray="2 4" strokeWidth="1" />
          </g>

          {/* Micro Tactical Annotation Labels */}
          <g fontSize="10" fontFamily="monospace" fill="currentColor" opacity="0.75">
            <text x="220" y="475">MUMBAI CIU [18.9220° N, 72.8347° E]</text>
            <text x="350" y="215">HQ NORTH [28.6139° N, 77.2090° E]</text>
            <text x="540" y="380">EAST CMD [22.5726° N, 88.3639° E]</text>
            <text x="290" y="635">SOUTH CMD [12.9716° N, 77.5946° E]</text>
            <text x="60" y="870">NAT-INTEL GRID // SECTOR 1-7 // SECURE GEOSPATIAL WATERMARK</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
