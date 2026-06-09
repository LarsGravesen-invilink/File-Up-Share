import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface Props {
  src: string;
  controlsList?: string;
  onPlay?: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLAudioElement>) => void;
  audioRef?: (el: HTMLAudioElement | null) => void;
}

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ src, controlsList, onPlay, onContextMenu, audioRef }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Expose native audio ref to parent
  useEffect(() => {
    if (audioRef) audioRef(ref.current);
    return () => { if (audioRef) audioRef(null); };
  }, [audioRef]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) { a.play(); } else { a.pause(); }
  };

  const toggleMute = () => {
    const a = ref.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
  };

  const seek = useCallback((e: React.MouseEvent | MouseEvent) => {
    const bar = progressRef.current;
    const a = ref.current;
    if (!bar || !a || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }, [duration]);

  const handleBarMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    seek(e);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => seek(e);
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, seek]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Hidden native audio — все настройки сохранены */}
      <audio
        ref={ref}
        src={src}
        controlsList={controlsList}
        onPlay={() => { setPlaying(true); onPlay?.(); }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
        onTimeUpdate={() => setCurrentTime(ref.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(ref.current?.duration ?? 0)}
        onContextMenu={onContextMenu}
        className="hidden"
      />

      {/* Play/Pause */}
      <button
        onClick={toggle}
        className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 transition hover:bg-violet-500/35 active:scale-90"
      >
        {playing
          ? <Pause className="h-3.5 w-3.5 fill-current" />
          : <Play className="h-3.5 w-3.5 fill-current translate-x-px" />
        }
      </button>

      {/* Progress bar */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div
          ref={progressRef}
          onMouseDown={handleBarMouseDown}
          className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/8 group"
        >
          {/* Filled */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] tabular-nums text-white/25">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Mute */}
      <button
        onClick={toggleMute}
        className="flex-shrink-0 rounded-lg p-1.5 text-white/25 transition hover:text-white/50 active:scale-90"
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
