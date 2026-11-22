"use client";

import React, { useEffect, useRef, useState } from "react";

export default function GlobalBGMPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.35); // Default volume 35% agar tidak terlalu keras
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Inisialisasi audio & restore preferensi mute dari localStorage
  useEffect(() => {
    const savedMute = localStorage.getItem("os_scape_bgm_muted");
    if (savedMute !== null) {
      const muted = savedMute === "true";
      setIsMuted(muted);
    }

    const audio = new Audio("/bgm.mp3");
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    // Browser Autoplay Policy: Mulai audio setelah interaksi klik/tombol pertama
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      if (audioRef.current && !audioRef.current.muted) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Browser mungkin masih menahan jika belum cukup gesture
          });
      }
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("pointerdown", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Sinkronisasi status mute & volume ke elemen audio
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
    audioRef.current.volume = volume;
    if (isMuted) {
      setIsPlaying(false);
    } else if (hasInteracted) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [isMuted, volume, hasInteracted]);

  // Handler Toggle Mute / Play
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    localStorage.setItem("os_scape_bgm_muted", String(nextMute));

    if (!audioRef.current) return;

    if (!nextMute) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      <button
        type="button"
        onClick={toggleMute}
        className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold backdrop-blur-md transition-all duration-200 shadow-lg cursor-pointer ${
          isPlaying && !isMuted
            ? "border-cyan-400/60 bg-black/85 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.35)] hover:border-cyan-300"
            : "border-white/20 bg-black/80 text-gray-400 hover:border-white/40 hover:text-white"
        }`}
        title={isMuted ? "Nyalakan Musik Latar (BGM)" : "Bisukan Musik Latar (Mute BGM)"}
      >
        {/* Ikon Suara / Gelombang */}
        <span className="text-sm">
          {isMuted || !isPlaying ? "🔇" : "🔊"}
        </span>

        {/* Teks Status */}
        <span>
          {isMuted || !isPlaying ? "BGM OFF" : "BGM ON"}
        </span>

        {/* Indikator Animasi Bar Musik Saat Berbunyi */}
        {isPlaying && !isMuted && (
          <span className="flex items-end gap-0.5 h-3 ml-0.5">
            <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="w-0.5 h-3 bg-cyan-300 rounded-full animate-bounce" />
            <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          </span>
        )}
      </button>
    </div>
  );
}
