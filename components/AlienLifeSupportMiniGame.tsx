"use client";

import React, { useState } from "react";

interface AlienLifeSupportMiniGameProps {
  onUnlockLock: (lockType: "green" | "blue" | "purple") => void;
  unlockedLocks: {
    green: boolean;
    blue: boolean;
    purple: boolean;
  };
  onClose?: () => void;
  onOpenQuiz?: () => void;
}

export default function AlienLifeSupportMiniGame({
  onUnlockLock,
  unlockedLocks,
  onClose,
  onOpenQuiz,
}: AlienLifeSupportMiniGameProps) {
  const [activeLockTab, setActiveLockTab] = useState<"green" | "blue" | "purple">("green");

  // State Gembok Hijau (Safety Check)
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  const [greenFeedback, setGreenFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [showGreenHint, setShowGreenHint] = useState(false);

  // State Gembok Biru (Resource-Request)
  const [selectedBlueDecision, setSelectedBlueDecision] = useState<"GRANT" | "WAIT" | null>(null);
  const [blueFeedback, setBlueFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [showBlueHint, setShowBlueHint] = useState(false);

  // State Gembok Ungu (Deadlock Detection)
  const [hasTappedCircle, setHasTappedCircle] = useState(false);
  const [selectedFork, setSelectedFork] = useState<number | null>(null);
  const [purpleFeedback, setPurpleFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [showPurpleHint, setShowPurpleHint] = useState(false);

  // 1. Logika Gembok Hijau (Safety Check)
  const handlePickAlien = (alien: string) => {
    if (unlockedLocks.green) return;
    if (selectedSequence.includes(alien)) {
      setSelectedSequence(selectedSequence.filter((a) => a !== alien));
      setGreenFeedback(null);
    } else {
      if (selectedSequence.length < 3) {
        setSelectedSequence([...selectedSequence, alien]);
        setGreenFeedback(null);
      }
    }
  };

  const handleCheckGreen = () => {
    if (selectedSequence.length !== 3) {
      setGreenFeedback({
        success: false,
        msg: "Pilih urutan ketiga alien (A, B, C) secara lengkap terlebih dahulu sebelum memeriksa jawaban.",
      });
      return;
    }

    const seqStr = selectedSequence.join(" → ");
    if (seqStr === "A → C → B") {
      setGreenFeedback({
        success: true,
        msg: "Tepat sekali! Urutan A → C → B memungkinkan semua alien selesai: A selesai (tabung bebas jadi 4), C selesai (tabung bebas jadi 5), lalu B selesai (tabung bebas jadi 7). Gembok Hijau Terbuka (+100 poin)!",
      });
      onUnlockLock("green");
    } else {
      setGreenFeedback({
        success: false,
        msg: `Urutan ${seqStr} belum aman. Tabung tersedia saat ini hanya 2, perhatikan sisa kebutuhan masing-masing alien. Jawaban salah tidak mengurangi nyawa, silakan coba lagi!`,
      });
    }
  };

  // 2. Logika Gembok Biru (Resource-Request)
  const handleCheckBlue = () => {
    if (!selectedBlueDecision) {
      setBlueFeedback({
        success: false,
        msg: "Pilih salah satu keputusan (GRANT atau WAIT) terlebih dahulu sebelum memeriksa jawaban.",
      });
      return;
    }

    if (selectedBlueDecision === "GRANT") {
      setBlueFeedback({
        success: true,
        msg: "Tepat sekali! Jawaban adalah GRANT (Setujui). Jika C diberi 2 tabung, kebutuhan C terpenuhi seluruhnya sehingga C langsung selesai dan melepaskan 3 tabung. Sisa tabung (3) cukup untuk menyelesaikan A dan B. Sistem tetap berada dalam Safe State! Gembok Biru Terbuka (+100 poin)!",
      });
      onUnlockLock("blue");
    } else {
      setBlueFeedback({
        success: false,
        msg: "Kurang tepat. Menahan permintaan C tidak diperlukan karena memberikan 2 tabung ke C justru mempercepat C mengembalikan seluruh 3 tabungnya ke sistem. Jawaban salah tidak mengurangi nyawa, silakan coba lagi!",
      });
    }
  };

  // 3. Logika Gembok Ungu (Deadlock Detection & Dining Philosophers)
  const handleTapCycle = () => {
    setHasTappedCircle(true);
    setPurpleFeedback({
      success: false,
      msg: "Lingkaran siklus terdeteksi! Semua 5 filsuf menahan garpu kiri dan menunggu garpu tetangganya (Circular Wait). Sekarang pilih salah satu garpu di bawah, lalu klik 'Periksa Jawaban' untuk melepaskannya!",
    });
  };

  const handleCheckPurple = () => {
    if (!hasTappedCircle) {
      setPurpleFeedback({
        success: false,
        msg: "Tap lingkaran diagram filsuf di atas terlebih dahulu untuk mendeteksi siklus Deadlock.",
      });
      return;
    }

    if (selectedFork === null) {
      setPurpleFeedback({
        success: false,
        msg: "Pilih salah satu garpu (F0 s.d F4) yang ingin dilepaskan terlebih dahulu.",
      });
      return;
    }

    setPurpleFeedback({
      success: true,
      msg: `Garpu F${selectedFork} berhasil dilepaskan! Rantai Circular Wait terputus secara permanen, proses dapat makan dan melepas garpu berikutnya bergiliran. Gembok Ungu Terbuka (+100 poin)!`,
    });
    onUnlockLock("purple");
  };

  const allUnlocked = unlockedLocks.green && unlockedLocks.blue && unlockedLocks.purple;

  return (
    <div className="relative flex flex-col w-full rounded-2xl border border-cyan-500/40 bg-[#071324]/95 text-gray-100 shadow-[0_0_60px_rgba(34,211,238,0.25)] overflow-hidden">
      {/* Header Modal */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 px-6 py-4 bg-cyan-950/30">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-base md:text-lg font-bold tracking-wide text-cyan-200">
              MINI-GAME: ALIEN LIFE-SUPPORT BANKER
            </h2>
            <p className="text-xs text-gray-400">
              Evaluasi alokasi tabung sumber daya agar sistem tetap aman
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10"
          >
            ✕ Tutup (ESC)
          </button>
        )}
      </div>

      {/* Ringkasan Data Tabung Oksigen & Alien dengan Custom Scrollbar */}
      <div className="custom-scrollbar max-h-[82vh] overflow-y-auto p-4 md:p-6 space-y-5">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 text-xs">
            <span className="font-bold text-cyan-300 uppercase tracking-wider">
              📊 Status Penopang Hidup OMNI
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>
                Total Tabung Oksigen: <strong className="text-cyan-400">7 Tabung</strong>
              </span>
              <span>
                Tersedia Sekarang:{" "}
                <strong className="text-emerald-400 text-sm">2 Tabung</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-2 px-3">Alien</th>
                  <th className="py-2 px-3">Sudah Pegang (Allocation)</th>
                  <th className="py-2 px-3">Masih Butuh (Need)</th>
                  <th className="py-2 px-3">Kebutuhan Maks (Max)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5">
                  <td className="py-2 px-3 font-bold text-cyan-300">Alien A</td>
                  <td className="py-2 px-3">2 Tabung</td>
                  <td className="py-2 px-3 text-amber-300 font-bold">2 Tabung</td>
                  <td className="py-2 px-3 text-gray-400">4 Tabung</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-2 px-3 font-bold text-purple-300">Alien B</td>
                  <td className="py-2 px-3">2 Tabung</td>
                  <td className="py-2 px-3 text-amber-300 font-bold">5 Tabung</td>
                  <td className="py-2 px-3 text-gray-400">7 Tabung</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-2 px-3 font-bold text-emerald-300">Alien C</td>
                  <td className="py-2 px-3">1 Tabung</td>
                  <td className="py-2 px-3 text-amber-300 font-bold">2 Tabung</td>
                  <td className="py-2 px-3 text-gray-400">3 Tabung</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tab 3 Gembok */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveLockTab("green")}
            className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
              activeLockTab === "green"
                ? "border-emerald-400 bg-emerald-950/40 text-emerald-200"
                : "border-white/10 bg-black/30 text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>
              <span className="text-xs font-bold block">1. Gembok Hijau</span>
              <span className="text-[11px] text-gray-400">Banker's Safety Check</span>
            </div>
            <span className="text-lg">{unlockedLocks.green ? "🔓" : "🔒"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLockTab("blue")}
            className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
              activeLockTab === "blue"
                ? "border-cyan-400 bg-cyan-950/40 text-cyan-200"
                : "border-white/10 bg-black/30 text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>
              <span className="text-xs font-bold block">2. Gembok Biru</span>
              <span className="text-[11px] text-gray-400">Resource-Request</span>
            </div>
            <span className="text-lg">{unlockedLocks.blue ? "🔓" : "🔒"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLockTab("purple")}
            className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
              activeLockTab === "purple"
                ? "border-purple-400 bg-purple-950/40 text-purple-200"
                : "border-white/10 bg-black/30 text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>
              <span className="text-xs font-bold block">3. Gembok Ungu</span>
              <span className="text-[11px] text-gray-400">Deadlock Detection</span>
            </div>
            <span className="text-lg">{unlockedLocks.purple ? "🔓" : "🔒"}</span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* KONTEN GEMBOK 1: HIJAU (SAFETY CHECK)                         */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeLockTab === "green" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-bold text-emerald-300">
                  🟢 Gembok Hijau (Safety Check)
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Tugas: Urutkan alien supaya semuanya bisa selesai tanpa kekurangan oksigen (Safe
                  Sequence).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGreenHint(!showGreenHint)}
                className="text-xs text-emerald-300 hover:underline flex items-center gap-1 font-mono"
              >
                <span>💡</span> {showGreenHint ? "Tutup Hint" : "Hint Gratis"}
              </button>
            </div>

            {showGreenHint && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-950/30 p-3 text-xs text-amber-200">
                Hint: Cek siapa alien yang sisa kebutuhannya (Masih butuh) &le; 2 tabung yang
                tersedia sekarang. Setelah alien tersebut selesai, tabung yang dipegangnya akan
                kembali bebas ke sistem!
              </div>
            )}

            {/* Display Urutan yang Dipilih */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
              <span className="text-xs text-gray-400 block font-mono">Urutan Pilihan Pemain:</span>
              <div className="flex items-center gap-2 min-h-[36px]">
                {selectedSequence.length === 0 ? (
                  <span className="text-xs text-gray-500 italic">
                    Klik tombol alien di bawah untuk menyusun urutan, lalu klik "Periksa Jawaban"...
                  </span>
                ) : (
                  selectedSequence.map((alien, idx) => (
                    <React.Fragment key={alien}>
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 font-bold text-emerald-300 text-sm">
                        Alien {alien}
                      </span>
                      {idx < selectedSequence.length - 1 && (
                        <span className="text-gray-400 font-bold">➔</span>
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>

            {/* Tombol Pilihan Alien & Tombol Periksa Jawaban */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {["A", "B", "C"].map((alien) => (
                  <button
                    key={alien}
                    type="button"
                    disabled={unlockedLocks.green}
                    onClick={() => handlePickAlien(alien)}
                    className={`px-4 py-2 rounded-xl border font-bold text-xs md:text-sm transition ${
                      selectedSequence.includes(alien)
                        ? "border-emerald-400 bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        : "border-white/20 bg-white/5 text-gray-200 hover:bg-white/10"
                    }`}
                  >
                    + Alien {alien}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={unlockedLocks.green || selectedSequence.length === 0}
                  onClick={() => {
                    setSelectedSequence([]);
                    setGreenFeedback(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white"
                >
                  Reset
                </button>
              </div>

              {!unlockedLocks.green && (
                <button
                  type="button"
                  onClick={handleCheckGreen}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-black text-xs md:text-sm transition shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2"
                >
                  🔍 Periksa Jawaban
                </button>
              )}
            </div>

            {/* Feedback Hasil */}
            {greenFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  greenFeedback.success
                    ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200"
                    : "border-amber-500/50 bg-amber-950/40 text-amber-200"
                }`}
              >
                {greenFeedback.msg}
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* KONTEN GEMBOK 2: BIRU (RESOURCE-REQUEST)                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeLockTab === "blue" && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-bold text-cyan-300">
                  🔵 Gembok Biru (Resource-Request)
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Kasus: Alien C meminta 2 tabung oksigen sekarang. Apakah permintaan ini harus
                  diberikan (GRANT) atau ditolak/ditunda (WAIT)?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlueHint(!showBlueHint)}
                className="text-xs text-cyan-300 hover:underline flex items-center gap-1 font-mono"
              >
                <span>💡</span> {showBlueHint ? "Tutup Hint" : "Hint Gratis"}
              </button>
            </div>

            {showBlueHint && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-950/30 p-3 text-xs text-amber-200">
                Hint: Alien C saat ini sudah memegang 1 tabung dan masih butuh 2 tabung (total
                maksimal 3). Jika C diberi 2 tabung, apa yang langsung terjadi pada status Alien C?
                Apakah Alien C bisa langsung menyelesaikan tugasnya dan melepaskan seluruh tabungnya?
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2 text-xs">
              <span className="font-bold text-cyan-200 block">Evaluasi Banker:</span>
              <p className="text-gray-300">
                • Permintaan Alien C: 2 Tabung Oksigen
                <br />
                • Tabung Tersedia Saat Ini: 2 Tabung
                <br />
                • Sisa Kebutuhan Alien C: 2 Tabung
              </p>
            </div>

            {/* Pilihan Opsi Keputusan */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={unlockedLocks.blue}
                  onClick={() => {
                    setSelectedBlueDecision("GRANT");
                    setBlueFeedback(null);
                  }}
                  className={`px-5 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition flex items-center gap-2 ${
                    selectedBlueDecision === "GRANT"
                      ? "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      : "border-white/20 bg-white/5 hover:bg-white/10 text-gray-300"
                  }`}
                >
                  🟢 GRANT (Setujui Permintaan)
                </button>
                <button
                  type="button"
                  disabled={unlockedLocks.blue}
                  onClick={() => {
                    setSelectedBlueDecision("WAIT");
                    setBlueFeedback(null);
                  }}
                  className={`px-5 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition flex items-center gap-2 ${
                    selectedBlueDecision === "WAIT"
                      ? "border-amber-400 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "border-white/20 bg-white/5 hover:bg-white/10 text-gray-300"
                  }`}
                >
                  🔴 WAIT / DENY (Tolak / Tunda)
                </button>
              </div>

              {!unlockedLocks.blue && (
                <button
                  type="button"
                  disabled={!selectedBlueDecision}
                  onClick={handleCheckBlue}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-black text-xs md:text-sm transition shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  🔍 Periksa Jawaban
                </button>
              )}
            </div>

            {blueFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  blueFeedback.success
                    ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-200"
                    : "border-amber-500/50 bg-amber-950/40 text-amber-200"
                }`}
              >
                {blueFeedback.msg}
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* KONTEN GEMBOK 3: UNGU (DEADLOCK DETECTION)                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeLockTab === "purple" && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-bold text-purple-300">
                  🟣 Gembok Ungu (Deadlock Detection)
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Tugas: Tap lingkaran filsuf yang saling menunggu, pilih garpu yang dilepas, lalu
                  klik "Periksa Jawaban".
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPurpleHint(!showPurpleHint)}
                className="text-xs text-purple-300 hover:underline flex items-center gap-1 font-mono"
              >
                <span>💡</span> {showPurpleHint ? "Tutup Hint" : "Hint Gratis"}
              </button>
            </div>

            {showPurpleHint && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-950/30 p-3 text-xs text-amber-200">
                Hint: Semua filsuf terkunci karena masing-masing menahan satu garpu dan menunggu
                garpu tetangganya. Klik diagram lingkaran untuk mendeteksi siklus, lalu klik salah
                satu tombol garpu untuk melepasnya!
              </div>
            )}

            {/* Diagram Meja Makan Bundar 5 Filsuf */}
            <div className="rounded-xl border border-white/10 bg-black/50 p-4 flex flex-col items-center space-y-4">
              <div
                onClick={handleTapCycle}
                className={`relative w-64 h-64 rounded-full border-2 transition cursor-pointer flex items-center justify-center ${
                  hasTappedCircle
                    ? "border-red-400 bg-red-950/30 shadow-[0_0_20px_rgba(248,113,113,0.3)]"
                    : "border-purple-400/60 bg-purple-950/20 hover:border-purple-300"
                }`}
              >
                <div className="text-center p-3">
                  <span className="text-2xl block mb-1">
                    {unlockedLocks.purple ? "✅" : hasTappedCircle ? "🚨" : "🍝"}
                  </span>
                  <span className="text-[11px] font-bold font-mono text-purple-200">
                    {unlockedLocks.purple
                      ? "DEADLOCK TERPECAHKAN!"
                      : hasTappedCircle
                      ? "CIRCULAR WAIT TERDETEKSI"
                      : "TAP LINGKARAN DI SINI"}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-1">
                    {hasTappedCircle
                      ? "Pilih salah satu garpu di bawah"
                      : "Klik untuk mendeteksi deadlock"}
                  </span>
                </div>
              </div>

              {/* Pilihan Garpu yang Ingin Dilepas */}
              {hasTappedCircle && !unlockedLocks.purple && (
                <div className="space-y-3 text-center w-full">
                  <span className="text-xs text-gray-400 font-mono block">
                    Pilih garpu yang akan dilepas dari siklus:
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[0, 1, 2, 3, 4].map((fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => {
                          setSelectedFork(fIdx);
                          setPurpleFeedback(null);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition ${
                          selectedFork === fIdx
                            ? "border-purple-300 bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                            : "border-purple-400/50 bg-purple-900/40 hover:bg-purple-800 text-purple-200"
                        }`}
                      >
                        Garpu F{fIdx}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      disabled={selectedFork === null}
                      onClick={handleCheckPurple}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-white text-xs md:text-sm transition shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      🔍 Periksa Jawaban
                    </button>
                  </div>
                </div>
              )}
            </div>

            {purpleFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  purpleFeedback.success
                    ? "border-purple-500/50 bg-purple-950/40 text-purple-200"
                    : "border-red-500/50 bg-red-950/40 text-red-200"
                }`}
              >
                {purpleFeedback.msg}
              </div>
            )}
          </div>
        )}

        {/* Ringkasan Skor & Status Kelulusan */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span>Status 3 Gembok:</span>
            <span className={unlockedLocks.green ? "text-emerald-400 font-bold" : "text-gray-500"}>
              {unlockedLocks.green ? "✓ Hijau (100)" : "✕ Hijau"}
            </span>
            <span className={unlockedLocks.blue ? "text-cyan-400 font-bold" : "text-gray-500"}>
              {unlockedLocks.blue ? "✓ Biru (100)" : "✕ Biru"}
            </span>
            <span className={unlockedLocks.purple ? "text-purple-400 font-bold" : "text-gray-500"}>
              {unlockedLocks.purple ? "✓ Ungu (100)" : "✕ Ungu"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {allUnlocked && (
              <span className="text-emerald-300 font-bold">
                🎉 Ketiga Gembok Terbuka! Gerbang Portal Aktif
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
