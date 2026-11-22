"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function GlobalBGMPlayer() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.35); // Default volume 35% agar tidak terlalu keras
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Jika di halaman prolog cerita (atau halaman awal /), putar prolog.mp3. Di stage lain, putar bgm.mp3.
  const isPrologue = pathname === "/" || pathname?.startsWith("/story/prologue");
  const targetTrack = isPrologue ? "/prolog.mp3" : "/bgm.mp3";

  // Inisialisasi audio & restore preferensi mute dari localStorage
  useEffect(() => {
    const savedMute = localStorage.getItem("os_scape_bgm_muted");
    if (savedMute !== null) {
      const muted = savedMute === "true";
      setIsMuted(muted);
    }

    const audio = new Audio(targetTrack);
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
          .catch(() => {});
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

  // Berganti lagu secara mulus saat rute berpindah
  useEffect(() => {
    if (!audioRef.current) return;
    const currentSrc = audioRef.current.getAttribute("src");
    if (currentSrc !== targetTrack) {
      audioRef.current.setAttribute("src", targetTrack);
      audioRef.current.src = targetTrack;
      audioRef.current.load();
      if (!isMuted && hasInteracted) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }
  }, [targetTrack, isMuted, hasInteracted]);

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
        className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 shadow-lg cursor-pointer ${
          isPlaying && !isMuted
            ? "border-cyan-400/50 bg-black/75 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)] hover:scale-105 hover:border-cyan-300 hover:bg-black/90"
            : "border-white/15 bg-black/70 text-gray-400 hover:border-white/30 hover:text-white"
        }`}
        title={isMuted ? "Nyalakan Musik Latar (BGM)" : "Bisukan Musik Latar (Mute BGM)"}
        aria-label={isMuted ? "Nyalakan Musik Latar" : "Bisukan Musik Latar"}
      >
        <span className="text-sm">
          {isMuted || !isPlaying ? "🔇" : isPrologue ? "🎵" : "🔊"}
        </span>
      </button>
    </div>
  );
}
