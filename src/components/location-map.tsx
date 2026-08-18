"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export function LocationMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title: string;
}) {
  const [active, setActive] = useState(false);
  const [zoom, setZoom] = useState(14);
  const src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;

  return (
    <div className="relative aspect-[16/9] w-full">
      <iframe
        title={title}
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {!active && (
        <button
          type="button"
          aria-label="Click to interact with map"
          onClick={() => setActive(true)}
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        />
      )}
      <div className="absolute right-3 top-3 z-20 flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-md">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(z + 1, 20))}
          className="flex h-9 w-9 items-center justify-center text-gray-700 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="h-px bg-black/10" />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(z - 1, 3))}
          className="flex h-9 w-9 items-center justify-center text-gray-700 hover:bg-gray-100"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
