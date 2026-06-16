"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Music, Pause, Play, Volume2, VolumeX, SkipForward, SkipBack, ChevronUp, ChevronDown, Shuffle } from "lucide-react";

// ── Playlist ────────────────────────────────────────────────────────────────
const PLAYLIST = [
  { file: "chase9602-the-wind-awakening-memories-of-the-forest-468152.mp3", label: "The Wind — Awakening Memories I" },
  { file: "chase9602-the-wind-awakening-memories-of-the-forest-468155.mp3", label: "The Wind — Awakening Memories II" },
  { file: "ryoish-cellar-five-336880.mp3",          label: "Cellar Five" },
  { file: "ryoish-dignified-336885.mp3",            label: "Dignified" },
  { file: "ryoish-five-days-336887.mp3",            label: "Five Days" },
  { file: "ryoish-january-336894.mp3",              label: "January" },
  { file: "ryoish-peace-336882.mp3",                label: "Peace" },
  { file: "ryoish-rainfall-336891.mp3",             label: "Rainfall" },
  { file: "ryoish-the-peoplex27s-land-336886.mp3",  label: "The People's Land" },
  { file: "ryoish-thought-336888.mp3",              label: "Thought" },
];

const LS_VOLUME  = "bgm_volume";
const LS_PLAYING = "bgm_playing";
const LS_TRACK   = "bgm_track";
const LS_SHUFFLE = "bgm_shuffle";

// ── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function randomOther(current: number, total: number): number {
  if (total <= 1) return 0;
  let next = Math.floor(Math.random() * (total - 1));
  if (next >= current) next++;
  return next;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function BGMPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [trackIdx, setTrackIdx] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return clamp(Number(localStorage.getItem(LS_TRACK) ?? 0), 0, PLAYLIST.length - 1);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const v = Number(localStorage.getItem(LS_VOLUME));
    return isNaN(v) ? 0 : clamp(v, 0, 1);
  });
  const [muted, setMuted]     = useState(true);
  const [shuffle, setShuffle] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const s = localStorage.getItem(LS_SHUFFLE);
    return s === null ? true : s === "1"; // default ON
  });
  const [expanded, setExpanded]   = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // ── Audio init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio(`/music/${PLAYLIST[trackIdx].file}`);
    audio.loop = false;
    audio.volume = muted ? 0 : volume;
    audioRef.current = audio;
    return () => { audio.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Track change ───────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = !audio.paused;
    audio.pause();
    audio.src = `/music/${PLAYLIST[trackIdx].file}`;
    audio.load();
    audio.volume = muted ? 0 : volume;
    if (wasPlaying) audio.play().catch(() => setIsPlaying(false));
    localStorage.setItem(LS_TRACK, String(trackIdx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx]);

  // ── Play / pause ───────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
    localStorage.setItem(LS_PLAYING, isPlaying ? "1" : "0");
  }, [isPlaying]);

  // ── Volume ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
    localStorage.setItem(LS_VOLUME, String(volume));
  }, [volume, muted]);

  // ── Shuffle persist ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_SHUFFLE, shuffle ? "1" : "0");
  }, [shuffle]);

  // ── Auto-advance ───────────────────────────────────────────────────────────
  const handleEnded = useCallback(() => {
    setTrackIdx((i) => shuffle ? randomOther(i, PLAYLIST.length) : (i + 1) % PLAYLIST.length);
  }, [shuffle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [handleEnded]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const togglePlay   = () => setIsPlaying((p) => !p);
  const toggleMute   = () => setMuted((m) => !m);
  const toggleShuffle = () => setShuffle((s) => !s);
  const prevTrack    = () => setTrackIdx((i) => shuffle ? randomOther(i, PLAYLIST.length) : (i - 1 + PLAYLIST.length) % PLAYLIST.length);
  const nextTrack    = () => setTrackIdx((i) => shuffle ? randomOther(i, PLAYLIST.length) : (i + 1) % PLAYLIST.length);

  const track = PLAYLIST[trackIdx];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>

      {/* ── Header trigger button ── */}
      <button
        onClick={() => setPanelOpen((o) => !o)}
        title="BGM / 音楽"
        aria-label={panelOpen ? "Close BGM player" : "Open BGM player"}
        style={{
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isPlaying ? "rgba(var(--accent-rgb,139,92,246),0.15)" : "var(--bg-glass)",
          border: `1px solid ${isPlaying ? "rgba(var(--accent-rgb,139,92,246),0.4)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          color: isPlaying ? "var(--accent-bright, var(--accent))" : "var(--fg-secondary)",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        <Music size={15} />
      </button>

      {/* ── Floating panel ── */}
      {panelOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 280,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 12px)",
            boxShadow: "var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.3))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px 8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              BGM / 音楽
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Shuffle toggle */}
              <button
                onClick={toggleShuffle}
                title={shuffle ? "Shuffle ON — click to turn off / シャッフルON" : "Shuffle OFF — click to turn on / シャッフルOFF"}
                style={{
                  background: shuffle ? "rgba(var(--accent-rgb,139,92,246),0.15)" : "none",
                  border: shuffle ? "1px solid rgba(var(--accent-rgb,139,92,246),0.4)" : "1px solid transparent",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  color: shuffle ? "var(--accent-bright, var(--accent))" : "var(--fg-muted)",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px 4px",
                  transition: "all 0.2s",
                }}
              >
                <Shuffle size={13} />
              </button>
              {/* Playlist expand */}
              <button
                onClick={() => setExpanded((e) => !e)}
                title={expanded ? "Hide playlist" : "Show playlist / プレイリスト"}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", display: "flex", alignItems: "center" }}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Now playing */}
          <div style={{ padding: "12px 14px 10px" }}>
            <p style={{ fontSize: 11, color: "var(--fg-muted)", marginBottom: 2 }}>
              {shuffle ? "🔀 Shuffle / シャッフル" : `${trackIdx + 1} / ${PLAYLIST.length}`}
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--fg-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: 12,
              }}
            >
              {track.label}
            </p>

            {/* Transport controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
              <button onClick={prevTrack} title="Previous / 前の曲" style={iconBtn}>
                <SkipBack size={15} />
              </button>
              <button
                onClick={togglePlay}
                title={isPlaying ? "Pause / 一時停止" : "Play / 再生"}
                style={{
                  ...iconBtn,
                  width: 36,
                  height: 36,
                  background: "var(--accent, #7c3aed)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "50%",
                  boxShadow: "0 2px 8px var(--accent-glow, rgba(124,58,237,0.4))",
                }}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={nextTrack} title="Next / 次の曲" style={iconBtn}>
                <SkipForward size={15} />
              </button>
            </div>

            {/* Volume row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={toggleMute}
                title={muted ? "Unmute / ミュート解除" : "Mute / ミュート"}
                style={{ ...iconBtn, flexShrink: 0 }}
              >
                {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  setMuted(v === 0);
                }}
                style={{ flex: 1, accentColor: "var(--accent, #7c3aed)", cursor: "pointer" }}
                aria-label="Volume / 音量"
              />
            </div>
          </div>

          {/* Playlist (expandable) */}
          {expanded && (
            <div style={{ borderTop: "1px solid var(--border)", maxHeight: 220, overflowY: "auto" }}>
              {PLAYLIST.map((t, i) => (
                <button
                  key={t.file}
                  onClick={() => { setTrackIdx(i); setIsPlaying(true); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 14px",
                    background: i === trackIdx ? "rgba(var(--accent-rgb,139,92,246),0.12)" : "none",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    color: i === trackIdx ? "var(--accent-bright, var(--accent))" : "var(--fg-secondary)",
                    fontSize: 12,
                    fontWeight: i === trackIdx ? 600 : 400,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (i !== trackIdx) e.currentTarget.style.background = "var(--bg-glass)"; }}
                  onMouseLeave={(e) => { if (i !== trackIdx) e.currentTarget.style.background = "none"; }}
                >
                  <span style={{ fontSize: 10, color: "var(--fg-muted)", width: 18, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</span>
                  {i === trackIdx && isPlaying && (
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--accent-bright, var(--accent))" }}>▶</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared icon button style ─────────────────────────────────────────────────
const iconBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg-glass)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  color: "var(--fg-secondary)",
  transition: "all 0.2s",
  flexShrink: 0,
};
