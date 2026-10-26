"use client";

import React from "react";

interface PlayerCharacterProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  facingRight: boolean;
  isHurt: boolean;
  enteringPortal?: boolean;
}

export default function PlayerCharacter({
  x,
  y,
  width = 85,
  height = 115,
  facingRight,
  isHurt,
  enteringPortal = false,
}: PlayerCharacterProps) {
  return (
    <div
      className="pointer-events-none absolute z-30 transition-opacity duration-300"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        willChange: "transform",
        opacity: enteringPortal ? 0 : 1,
      }}
    >
      {/* Bayangan di bawah kaki astronot */}
      <div className="absolute -bottom-1 left-1/2 h-3.5 w-16 -translate-x-1/2 rounded-full bg-black/60 blur-xs" />

      {/* Sprite astronot dengan efek kedip merah saat terkena rintangan */}
      <img
        src="/astronaut-front.png"
        alt="Astronaut"
        className={`h-full w-full object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] transition-transform duration-100 ${
          isHurt ? "animate-pulse brightness-150 contrast-125 sepia hue-rotate-[300deg]" : ""
        }`}
        style={{
          transform: facingRight ? "scaleX(1)" : "scaleX(-1)",
        }}
      />
    </div>
  );
}

