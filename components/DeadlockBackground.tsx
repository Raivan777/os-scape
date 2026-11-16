"use client";

import React from "react";

export default function DeadlockBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <img
        src="/stage4bg.jpg"
        alt="Stage 4 Background"
        className="h-full w-full object-fill"
        draggable={false}
      />
    </div>
  );
}
