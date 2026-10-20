"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";

// Font dimuat dari komponen ini (bukan layout.tsx) supaya tidak menyentuh file global.
const display = Chakra_Petch({ subsets: ["latin"], weight: ["600", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"] });

type Tone = "info" | "warn" | "deny";
type BootLine = { text: string; tone: Tone };

// Setiap baris log mengisyaratkan satu konsep SO dari 7 pintu.
const BOOT_LINES: BootLine[] = [
  { text: "OMNI kernel 7.0 mulai berjalan", tone: "info" },
  { text: "sched: antrean patroli dimuat, 0 tahanan dijadwalkan", tone: "info" },
  { text: "ipc: kanal antar-sel diisolasi, akses ditolak", tone: "deny" },
  { text: "thread: firewall dijalankan paralel, 1 thread bebas", tone: "warn" },
  { text: "sync: mutex energi pesawat TERKUNCI oleh proses lain", tone: "deny" },
  { text: "deadlock: reaktor menunggu dirinya sendiri", tone: "warn" },
  { text: "mm: modul kapsul belum teralokasi, memori terfragmentasi", tone: "warn" },
  { text: "vm: tabel halaman navigasi tidak ditemukan", tone: "deny" },
  { text: "Subjek baru terdeteksi di sel 7. Pintu keluar: 7 lapis.", tone: "info" },
];

const TONE_CLASS: Record<Tone, string> = {
  info: "text-[#b9aef0]",
  warn: "text-[#ffb347]",
  deny: "text-[#ff8f8f]",
};

const LINE_DELAY_MS = 420;
const LAUNCH_DELAY_MS = 800;

type Props = {
  /** Tujuan setelah tombol Start ditekan. Ganti ke rute cutscene bila sudah ada. */
  nextHref?: string;
};

export default function TitleScreen({ nextHref = "/stage/stage1" }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(0); // jumlah baris boot yang sudah tampil
  const [launching, setLaunching] = useState(false);
  const launchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phase = launching
    ? "launching"
    : visible >= BOOT_LINES.length
      ? "ready"
      : "boot";

  // Mengetik baris boot satu per satu.
  useEffect(() => {
    if (visible >= BOOT_LINES.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), LINE_DELAY_MS);
    return () => clearTimeout(t);
  }, [visible]);

  // Hormati preferensi "reduce motion": langsung tampilkan semua baris.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(BOOT_LINES.length);
    }
  }, []);

  const skipBoot = useCallback(() => setVisible(BOOT_LINES.length), []);

  const start = useCallback(() => {
    if (launching) return;
    setLaunching(true);
    launchTimer.current = setTimeout(() => router.push(nextHref), LAUNCH_DELAY_MS);
  }, [launching, router, nextHref]);

  useEffect(() => {
    return () => {
      if (launchTimer.current) clearTimeout(launchTimer.current);
    };
  }, []);

  // Keyboard: tombol apa saja melewati boot; Enter memulai saat siap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement) return; // biarkan tombol menangani dirinya
      if (phase === "boot") skipBoot();
      else if (phase === "ready" && e.key === "Enter") start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, skipBoot, start]);

  return (
    <main
      className={`${mono.className} relative min-h-screen overflow-hidden bg-[#140b2e] text-[#e9e4ff]`}
      data-launching={launching}
      onClick={phase === "boot" ? skipBoot : undefined}
    >
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-[1.1fr_0.9fr]">
        {/* Kolom kiri: judul, boot log, tombol */}
        <section className="order-2 md:order-1">
          <h1
            className={`${display.className} text-6xl font-bold leading-none tracking-tight md:text-8xl`}
          >
            OS-Scape
          </h1>
          <p className={`${display.className} mt-3 text-xl text-[#ffb347] md:text-2xl`}>
            The Alien Abduction
          </p>

          <div
            role="log"
            aria-label="Log boot sistem OMNI"
            className="mt-8 h-[17rem] overflow-hidden rounded-sm border border-[#3a2f6b] bg-[#1b1140]/80 p-4 text-sm leading-relaxed"
          >
            {BOOT_LINES.slice(0, visible).map((line) => (
              <p key={line.text} className={TONE_CLASS[line.tone]}>
                {line.text}
              </p>
            ))}
            {phase === "boot" && <span className="cursor" aria-hidden="true" />}
          </div>

          <div className="mt-6 min-h-[5.5rem]">
            {phase === "boot" ? (
              <p className="text-sm text-[#8d84b8]">
                Tekan tombol apa saja untuk melewati boot.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={start}
                  disabled={launching}
                  className={`${display.className} rounded-sm bg-[#ffb347] px-8 py-3 text-lg font-semibold text-[#140b2e] transition hover:bg-[#ffc774] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c9f2ff] disabled:opacity-70`}
                >
                  {launching ? "Menyalakan beam..." : "Mulai kabur"}
                </button>
                <p className="mt-3 text-sm text-[#8d84b8]">
                  Atau tekan Enter. Kamu punya 7 pintu untuk dibuka.
                </p>
              </>
            )}
          </div>
        </section>

        {/* Kolom kanan: UFO + tractor beam (dekoratif) */}
        <section className="order-1 md:order-2" aria-hidden="true">
          <div className="scene">
            <div className="dome" />
            <div className="saucer" />
            <div className="beam" />
            <div className="figure">
              <span className="head" />
              <span className="body" />
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .cursor {
          display: inline-block;
          width: 0.6rem;
          height: 1rem;
          background: #b9aef0;
          vertical-align: text-bottom;
          animation: blink 1s steps(2, start) infinite;
        }
        .scene {
          position: relative;
          height: 26rem;
          max-width: 20rem;
          margin: 0 auto;
        }
        .dome {
          position: absolute;
          top: 0.5rem;
          left: 50%;
          width: 6rem;
          height: 3rem;
          transform: translateX(-50%);
          border-radius: 6rem 6rem 0 0;
          background: #3a2f6b;
        }
        .saucer {
          position: absolute;
          top: 2.5rem;
          left: 50%;
          width: 18rem;
          height: 2.5rem;
          transform: translateX(-50%);
          border-radius: 50%;
          background: linear-gradient(#4b3d8f, #2b2250);
          box-shadow: 0 0 2.5rem rgba(201, 242, 255, 0.25);
        }
        .beam {
          position: absolute;
          top: 4.25rem;
          left: 50%;
          width: 13rem;
          height: 21rem;
          transform: translateX(-50%);
          clip-path: polygon(22% 0, 78% 0, 100% 100%, 0 100%);
          background: linear-gradient(
            to bottom,
            rgba(201, 242, 255, 0.85),
            rgba(201, 242, 255, 0)
          );
          opacity: 0.8;
          transition: filter 0.6s, opacity 0.6s;
          animation: shimmer 4s ease-in-out infinite;
        }
        .figure {
          position: absolute;
          left: 50%;
          bottom: 3rem;
          width: 1.5rem;
          transform: translateX(-50%);
          animation: bob 3.2s ease-in-out infinite;
        }
        .head {
          display: block;
          width: 0.75rem;
          height: 0.75rem;
          margin: 0 auto;
          border-radius: 50%;
          background: #140b2e;
        }
        .body {
          display: block;
          width: 1.25rem;
          height: 2rem;
          margin: 0.1rem auto 0;
          border-radius: 0.5rem 0.5rem 0.2rem 0.2rem;
          background: #140b2e;
        }
        [data-launching="true"] .beam {
          opacity: 1;
          filter: brightness(1.7);
        }
        [data-launching="true"] .figure {
          animation: ascend 0.8s ease-in forwards;
        }
        @keyframes blink {
          to {
            visibility: hidden;
          }
        }
        @keyframes shimmer {
          50% {
            opacity: 0.95;
          }
        }
        @keyframes bob {
          50% {
            transform: translate(-50%, -0.6rem);
          }
        }
        @keyframes ascend {
          to {
            transform: translate(-50%, -17rem);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cursor,
          .beam,
          .figure {
            animation: none;
          }
          [data-launching="true"] .figure {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}