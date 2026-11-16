"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerCharacter from "@/components/PlayerCharacter";

type Platform = { x: number; y: number; w: number; h: number };
type Job = { id: string; name: string; burst: number };

export default function Stage6() {
  const router = useRouter();

  // Koordinat game memakai kanvas 1024 x 576 (16:9), disesuaikan dengan stage6.png.
  const W = 1024;
  const H = 576;
  const PLAYER_W = 52;
  const PLAYER_H = 50;
  const SPEED = 3.8;
  const JUMP = -13.8;
  const GRAVITY = 0.48;
  const FLOOR = 548;

  // Platform visual pada background Stage 6.
  const platforms: Platform[] = [
    { x: 58, y: 326, w: 316, h: 28 },   // pijakan atas kiri
    { x: 255, y: 270, w: 120, h: 16 },   // pijakan kecil di kiri atas
    { x: 405, y: 348, w: 155, h: 28 },   // pijakan tengah dengan tuas
    { x: 255, y: 346, w: 132, h: 28 },   // pijakan kiri bawah
    { x: 630, y: 362, w: 90, h: 20 },    // pijakan kecil kanan tengah
    { x: 632, y: 300, w: 90, h: 20 },    // pijakan kecil atas kanan
    { x: 745, y: 312, w: 150, h: 20 },   // pijakan menuju laser
    { x: 890, y: 370, w: 120, h: 20 },   // pijakan kanan
    { x: 0, y: FLOOR, w: W, h: H - FLOOR },
  ];

  const [player, setPlayer] = useState({
    x: 55,
    y: FLOOR - PLAYER_H,
    vy: 0,
    jumping: false,
    facingRight: true,
  });
  const playerRef = useRef(player);
  const keys = useRef(new Set<string>());
  const [nearLever, setNearLever] = useState(false);
  const [miniGameOpen, setMiniGameOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queue, setQueue] = useState<(Job | null)[]>([null, null, null]);
  const [laserOpen, setLaserOpen] = useState(false);
  const [portalActive, setPortalActive] = useState(false);
  const [enteringPortal, setEnteringPortal] = useState(false);
  const portalTransitionRef = useRef(false);

  playerRef.current = player;

  const createJobs = () => {
    const values: number[] = [];
    while (values.length < 3) {
      const value = Math.floor(Math.random() * 14) + 2;
      if (!values.includes(value)) values.push(value);
    }
    setJobs([
      { id: "A", name: "Modul A", burst: values[0] },
      { id: "B", name: "Modul B", burst: values[1] },
      { id: "C", name: "Modul C", burst: values[2] },
    ]);
    setQueue([null, null, null]);
  };

  const openMiniGame = () => {
    createJobs();
    setMiniGameOpen(true);
  };

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "e" && nearLever && !miniGameOpen) openMiniGame();
      if (key === "escape") setMiniGameOpen(false);
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
      }
      keys.current.add(key);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [nearLever, miniGameOpen]);

  useEffect(() => {
    let frame = 0;
    let raf = 0;
    const loop = () => {
      if (!miniGameOpen) {
        const p = { ...playerRef.current };
        const input = keys.current;
        let dx = 0;
        if (input.has("a") || input.has("arrowleft")) {
          dx -= SPEED;
          p.facingRight = false;
        }
        if (input.has("d") || input.has("arrowright")) {
          dx += SPEED;
          p.facingRight = true;
        }
        if ((input.has("w") || input.has("arrowup") || input.has(" ")) && !p.jumping) {
          p.vy = JUMP;
          p.jumping = true;
        }

        const oldBottom = p.y + PLAYER_H;
        p.x = Math.max(0, Math.min(W - PLAYER_W, p.x + dx));
        p.vy += GRAVITY;
        p.y += p.vy;

        // Landing collision: hanya mendarat saat bergerak turun melewati top platform.
        for (const plat of platforms) {
          const bottom = p.y + PLAYER_H;
          const horizontal = p.x + PLAYER_W > plat.x && p.x < plat.x + plat.w;
          if (horizontal && p.vy >= 0 && oldBottom <= plat.y + 8 && bottom >= plat.y) {
            p.y = plat.y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
          }
        }

        // Laser beam menjaga akses ke portal hingga puzzle lever berhasil.
        const beam = { x: 748, y: 330, w: 8, h: 165 };
        if (!laserOpen && p.x + PLAYER_W > beam.x && p.x < beam.x + beam.w &&
            p.y + PLAYER_H > beam.y && p.y < beam.y + beam.h) {
          if (dx > 0) p.x = beam.x - PLAYER_W;
          else if (dx < 0) p.x = beam.x + beam.w;
        }

        const leverCenter = { x: 490, y: 244 };
        const playerCenter = { x: p.x + PLAYER_W / 2, y: p.y + PLAYER_H / 2 };
        const dist = Math.hypot(playerCenter.x - leverCenter.x, playerCenter.y - leverCenter.y);
        setNearLever(dist < 75);

        // Portal berada di ujung kanan stage; aktif setelah puzzle diselesaikan.
        if (portalActive && p.x > 950 && p.y < 430 && !portalTransitionRef.current) {
          portalTransitionRef.current = true;
          setEnteringPortal(true);
          window.setTimeout(() => router.push("/stage/stage7"), 350);
        }

        playerRef.current = p;
        setPlayer(p);
      }
      frame++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [miniGameOpen, laserOpen, portalActive, router]);

  const handleDrop = (index: number, job: Job) => {
    setQueue((previous) => {
      const next = [...previous];
      next.forEach((item, i) => {
        if (item?.id === job.id) next[i] = null;
      });
      next[index] = job;
      return next;
    });
  };

  const verifyQueue = () => {
    if (queue.some((job) => job === null)) {
      alert("Isi seluruh slot antrean terlebih dahulu.");
      return;
    }
    const ordered = queue as Job[];
    if (ordered[0].burst <= ordered[1].burst && ordered[1].burst <= ordered[2].burst) {
      setLaserOpen(true);
      setPortalActive(true);
      setMiniGameOpen(false);
      alert("✅ Reaktor aktif! Urutan SJF benar. Laser terbuka dan portal Stage 7 aktif.");
    } else {
      alert("❌ Urutan belum tepat. Susun modul dari burst time terkecil ke terbesar.");
      setQueue([null, null, null]);
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-3">
      <header className="mb-3 flex w-[1024px] items-center justify-between rounded-xl border border-cyan-400/30 bg-slate-950/80 px-5 py-2 text-xs">
        <strong className="text-amber-300 tracking-widest">OS-SCAPE // STAGE 6</strong>
        <span>A / D: Jalan • W / Spasi: Lompat • E: Interaksi</span>
        <span className={laserOpen ? "text-emerald-300" : "text-rose-300"}>
          LASER: {laserOpen ? "TERBUKA" : "AKTIF"}
        </span>
      </header>

      <section
        className="relative overflow-hidden border-2 border-cyan-400/30 shadow-[0_0_45px_#000] "
        style={{ width: W, height: H, backgroundImage: "url('/stage6.png')", backgroundSize: "100% 100%" }}
      >
        {/* Hitbox platform dibuat transparan; gambar background menjadi visual utama. */}
        {platforms.map((plat, index) => (
          <div key={index} className="absolute pointer-events-none"
            style={{ left: plat.x, top: plat.y, width: plat.w, height: plat.h }} />
        ))}

        {/* Lever pemicu mini-game pada pijakan tengah. */}
        <button
          type="button"
          onClick={openMiniGame}
          className="absolute z-20 h-12 w-14 rounded-md border border-amber-300/70 bg-amber-400/10"
          style={{ left: 465, top: 225 }}
          aria-label="Aktifkan konsol lever"
        >
          {nearLever && <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-amber-300 px-2 py-1 text-[10px] font-black text-black">[E] Konsol</span>}
        </button>

        {/* Beam laser, visual overlay ikut status. */}
        {!laserOpen && (
          <div className="absolute z-10 pointer-events-none animate-pulse"
            style={{ left: 748, top: 330, width: 8, height: 165, background: "linear-gradient(#fb7185,#ff1744,#fb7185)", boxShadow: "0 0 16px #fb1744" }} />
        )}

        {/* Sprite astronaut memakai komponen PlayerCharacter */}
        <PlayerCharacter
          x={player.x - 12}
          y={player.y - 32}
          width={52}
          height={50}
          facingRight={player.facingRight}
          isHurt={false}
          enteringPortal={enteringPortal}
        />

        {/* Portal status */}
        <div className={`absolute right-8 top-[390px] z-20 rounded-full border-2 p-3 text-xs font-black ${
          portalActive ? "border-emerald-300 bg-emerald-500/40 text-emerald-100 shadow-[0_0_25px_#34d399]" : "border-purple-300/50 bg-purple-900/30 text-purple-200"
        }`}>
          {portalActive ? "PORTAL AKTIF" : "PORTAL TERKUNCI"}
        </div>
      </section>

      {miniGameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border-2 border-cyan-400 bg-slate-950 p-6 shadow-[0_0_45px_#0891b2]">
            <div className="flex items-start justify-between border-b border-cyan-400/30 pb-4">
              <div>
                <h2 className="text-lg font-black tracking-wider text-cyan-300">KONSOL REAKTOR // SJF</h2>
                <p className="mt-1 text-xs text-slate-300">Tarik modul ke slot antrean dengan burst time terkecil hingga terbesar.</p>
              </div>
              <button onClick={() => setMiniGameOpen(false)} className="rounded border border-slate-600 px-3 py-1 text-xs">Tutup ✕</button>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300">Modul proses tersedia</p>
              <div className="grid grid-cols-3 gap-3">
                {jobs.map((job) => {
                  const placed = queue.some((slot) => slot?.id === job.id);
                  return (
                    <div key={job.id} draggable={!placed}
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", job.id)}
                      className={`rounded-xl border p-3 ${placed ? "opacity-40 border-slate-700" : "cursor-grab border-cyan-400/60 bg-cyan-950/50"}`}>
                      <div className="font-black text-cyan-200">{job.name}</div>
                      <div className="mt-2 text-xs text-slate-300">Burst time: <b className="text-amber-300">{job.burst} ms</b></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-300">Antrean eksekusi (SJF)</p>
              <div className="grid grid-cols-3 gap-3">
                {queue.map((job, index) => (
                  <div key={index}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const id = event.dataTransfer.getData("text/plain");
                      const selected = jobs.find((item) => item.id === id);
                      if (selected) handleDrop(index, selected);
                    }}
                    className="min-h-24 rounded-xl border-2 border-dashed border-emerald-400/50 bg-emerald-950/30 p-3 text-center">
                    <div className="text-[10px] text-emerald-300">SLOT {index + 1}</div>
                    {job ? (
                      <button onClick={() => setQueue((old) => old.map((item, i) => i === index ? null : item))}
                        className="mt-2 w-full rounded bg-emerald-500/20 p-2 text-xs">
                        {job.name}<br /><b>{job.burst} ms</b><br /><span className="text-[10px]">Klik untuk keluarkan</span>
                      </button>
                    ) : <div className="mt-4 text-xs text-slate-500">Drop modul di sini</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setQueue([null, null, null])} className="rounded-lg border border-slate-600 px-4 py-2 text-xs">Reset</button>
              <button onClick={verifyQueue} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-black">Aktifkan Reaktor</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
import Link from "next/link";

export default function Stage6Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#060411] p-4 text-white">
      <div className="max-w-md w-full rounded-2xl border border-cyan-500/40 bg-black/85 p-8 text-center shadow-[0_0_60px_rgba(34,211,238,0.3)] backdrop-blur-md">
        <span className="text-6xl block mb-4 animate-bounce">🚀</span>
        <h1 className="text-2xl font-bold font-mono text-cyan-300 mb-2">SELAMAT!</h1>
        <p className="text-sm text-gray-300 mb-6">
          Anda berhasil menyelesaikan Stage 5 dan menembus Portal menuju Stage 6!
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/stage/stage5"
            className="rounded-xl border border-cyan-400 bg-cyan-950/70 px-5 py-2.5 font-mono text-sm font-bold text-cyan-300 hover:bg-cyan-900 transition shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          >
            ← Kembali ke Stage 5
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 font-mono text-sm font-bold text-gray-300 hover:bg-white/20 transition"
          >
            Kembali ke Menu Utama
          </Link>
        </div>
      </div>
    </main>
  );
}

