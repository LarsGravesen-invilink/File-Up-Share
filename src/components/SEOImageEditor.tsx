/**
 * SEOImageEditor — профессиональный редактор SEO-обложек (Open Graph / социальные сети)
 * Canvas-based, без внешних зависимостей кроме React + framer-motion + lucide-react
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, ZoomIn, ZoomOut, RotateCw, FlipHorizontal,
  FlipVertical, Maximize2, ChevronDown, Shield, Info,
} from 'lucide-react';

// ─────────────────────────── Preset formats ───────────────────────────

interface FormatPreset {
  id: string;
  label: string;
  short: string;
  w: number;
  h: number;
  safePercent: number; // сколько % от краёв — "опасная зона"
  description: string;
}

const PRESETS: FormatPreset[] = [
  { id: 'og',      label: 'Open Graph (рекомендуется)', short: 'OG',       w: 1200, h: 630,  safePercent: 5,  description: '1200 × 630 · Facebook, VK, WhatsApp' },
  { id: 'twitter', label: 'Twitter Large Card',         short: 'TW',       w: 1200, h: 675,  safePercent: 5,  description: '1200 × 675 · Twitter / X Summary Card' },
  { id: 'tg',      label: 'Telegram Universal',         short: 'TG',       w: 1200, h: 630,  safePercent: 8,  description: '1200 × 630 · Telegram (края обрезаются)' },
  { id: 'square',  label: 'Square',                     short: '1:1',      w: 1200, h: 1200, safePercent: 5,  description: '1200 × 1200 · Instagram, квадратный превью' },
  { id: 'story',   label: 'Story',                      short: 'Story',    w: 1080, h: 1920, safePercent: 10, description: '1080 × 1920 · Instagram / VK Истории' },
  { id: 'custom',  label: 'Свободный размер',           short: 'Custom',   w: 0,    h: 0,    safePercent: 5,  description: 'Произвольные размеры' },
];

// ─────────────────────────── Helpers ─────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function getExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.getUint16(0, false) !== 0xFFD8) return 1;
  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint16(offset, false) === 0xFFE1) {
      if (view.getUint32(offset + 4, false) !== 0x45786966) break;
      const little = view.getUint16(offset + 10, false) === 0x4949;
      const ifdOffset = view.getUint32(offset + 14, little);
      const tags = view.getUint16(offset + 10 + ifdOffset, little);
      for (let i = 0; i < tags; i++) {
        const tag = view.getUint16(offset + 10 + ifdOffset + 2 + i * 12, little);
        if (tag === 0x0112) {
          return view.getUint16(offset + 10 + ifdOffset + 2 + i * 12 + 8, little);
        }
      }
    }
    offset += 2 + view.getUint16(offset + 2, false);
  }
  return 1;
}

/** Нормализуем изображение с учётом EXIF-поворота — рисуем в offscreen canvas */
function normalizeImage(img: HTMLImageElement, orientation: number): HTMLCanvasElement {
  const { naturalWidth: w, naturalHeight: h } = img;
  const swapped = orientation >= 5 && orientation <= 8;
  const canvas = document.createElement('canvas');
  canvas.width  = swapped ? h : w;
  canvas.height = swapped ? w : h;
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, w, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, w, h); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, h); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, h, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, h, w); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, w); break;
  }
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  return canvas;
}

// ─────────────────────────── Props ───────────────────────────────────

export interface SEOImageEditorProps {
  /** base64 data-URL или object-URL исходника */
  src: string;
  /** Исходный File (для определения EXIF). Если не передан — EXIF не читается */
  file?: File;
  onDone: (dataUrl: string) => void;
  onCancel: () => void;
}

// ─────────────────────────── Component ───────────────────────────────

export function SEOImageEditor({ src, file, onDone, onCancel }: SEOImageEditorProps) {
  // ── Format state ──
  const [presetId, setPresetId] = useState<string>('og');
  const [customW, setCustomW] = useState(1200);
  const [customH, setCustomH] = useState(630);
  const [formatOpen, setFormatOpen] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(true);

  // ── Image manipulation state ──
  const [scale, setScale]     = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);   // 0 | 90 | 180 | 270
  const [flipH, setFlipH]     = useState(false);
  const [flipV, setFlipV]     = useState(false);

  // ── Refs ──
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const normalRef     = useRef<HTMLCanvasElement | null>(null);   // нормализованный источник
  const orientRef     = useRef<number>(1);

  // drag
  const dragRef      = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });
  // pinch
  const pinchRef     = useRef({ active: false, dist0: 0, scale0: 1, midX: 0, midY: 0, ox: 0, oy: 0 });

  // live refs (без перерисовки)
  const scaleRef  = useRef(scale);
  const offsetRef = useRef({ x: offsetX, y: offsetY });
  scaleRef.current  = scale;
  offsetRef.current = { x: offsetX, y: offsetY };

  // ── Responsive display size ──
  const [winW, setWinW] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWinW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── Derived preset ──
  const preset = PRESETS.find(p => p.id === presetId)!;
  const canvasW = presetId === 'custom' ? customW : preset.w;
  const canvasH = presetId === 'custom' ? customH : preset.h;

  // Display dimensions — fit inside available width with padding
  // On mobile: winW - 2*padding(12px) - 2*modal-px(20px) = winW - 64
  // On desktop: cap at 500px wide, 340px tall
  const availW = Math.min(winW - 40, 500);   // 20px padding each side inside modal
  const availH = Math.min(Math.floor(availW * 0.72), 300); // max height cap
  const dispScale = Math.min(availW / canvasW, availH / canvasH, 1);
  const dispW = Math.round(canvasW * dispScale);
  const dispH = Math.round(canvasH * dispScale);

  // ── Lock viewport zoom on mobile ──
  useEffect(() => {
    const vp = document.querySelector('meta[name="viewport"]');
    const orig = vp?.getAttribute('content') ?? null;
    vp?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    return () => { if (vp && orig !== null) vp.setAttribute('content', orig); };
  }, []);

  // ── Load & normalise image ──
  useEffect(() => {
    let objectUrl: string | null = null;

    const load = async () => {
      // Try to read EXIF orientation
      let orientation = 1;
      if (file) {
        try {
          const buf = await file.arrayBuffer();
          orientation = getExifOrientation(buf);
        } catch { /* ignore */ }
      }
      orientRef.current = orientation;

      const img = new Image();
      img.onload = () => {
        const norm = normalizeImage(img, orientation);
        normalRef.current = norm;
        fitToCanvas(norm.width, norm.height);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
      img.src = src;
    };

    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // ── Auto-fit when preset or rotation changes ──
  useEffect(() => {
    const norm = normalRef.current;
    if (!norm) return;
    const rotated = rotation === 90 || rotation === 270;
    const w = rotated ? norm.height : norm.width;
    const h = rotated ? norm.width  : norm.height;
    fitToCanvas(w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId, customW, customH, rotation]);

  // ── Draw on canvas whenever state changes ──
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, offsetX, offsetY, rotation, flipH, flipV, canvasW, canvasH, showSafeArea, presetId]);

  // ────────────────────────────── fitToCanvas ──────────────────────────────
  const fitToCanvas = (imgW: number, imgH: number) => {
    const s = Math.max(canvasW / imgW, canvasH / imgH);
    const ox = (canvasW - imgW * s) / 2;
    const oy = (canvasH - imgH * s) / 2;
    setScale(s);
    setOffsetX(ox);
    setOffsetY(oy);
    scaleRef.current  = s;
    offsetRef.current = { x: ox, y: oy };
  };

  // ────────────────────────────── draw ─────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const norm   = normalRef.current;
    if (!canvas || !norm) return;
    canvas.width  = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // ── Image layer ──
    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);

    const iw = norm.width;
    const ih = norm.height;

    // rotation pivot = image centre
    ctx.translate(iw / 2, ih / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);
    if (rotation === 90 || rotation === 270) {
      ctx.drawImage(norm, -ih / 2, -iw / 2, ih, iw);
    } else {
      ctx.drawImage(norm, -iw / 2, -ih / 2, iw, ih);
    }
    ctx.restore();

    // ── Safe-area overlay ──
    if (showSafeArea) {
      const sp = (PRESETS.find(p => p.id === presetId)?.safePercent ?? 5) / 100;
      const sx = canvasW * sp;
      const sy = canvasH * sp;
      const sw = canvasW - sx * 2;
      const sh = canvasH - sy * 2;

      // dim danger zones
      ctx.fillStyle = 'rgba(0,0,0,0.40)';
      ctx.fillRect(0, 0, canvasW, sy);
      ctx.fillRect(0, canvasH - sy, canvasW, sy);
      ctx.fillRect(0, sy, sx, sh);
      ctx.fillRect(canvasW - sx, sy, sx, sh);

      // outer border
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvasW - 2, canvasH - 2);

      // safe border
      ctx.strokeStyle = 'rgba(99,232,199,0.80)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 6]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);

      // corner marks
      const m = Math.min(30, canvasW * 0.025);
      ctx.strokeStyle = 'rgba(99,232,199,1)';
      ctx.lineWidth = 3;
      [[sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh]].forEach(([cx, cy], i) => {
        const dx1 = i % 2 === 0 ? m : -m;
        const dy1 = i < 2 ? m : -m;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx1, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + dy1); ctx.stroke();
      });

      // crosshair
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(canvasW / 2, 0); ctx.lineTo(canvasW / 2, canvasH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, canvasH / 2); ctx.lineTo(canvasW, canvasH / 2); ctx.stroke();
    }
  }, [canvasW, canvasH, rotation, flipH, flipV, showSafeArea, presetId]);

  // ────────────────────────────── Mouse drag ───────────────────────────────
  const toCanvas = useCallback((clientDelta: { dx: number; dy: number }) => ({
    dx: clientDelta.dx / dispScale,
    dy: clientDelta.dy / dispScale,
  }), [dispScale]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const { dx, dy } = toCanvas({ dx: e.clientX - d.startX, dy: e.clientY - d.startY });
    setOffsetX(d.ox + dx);
    setOffsetY(d.oy + dy);
    offsetRef.current = { x: d.ox + dx, y: d.oy + dy };
  }, [toCanvas]);
  const onMouseUp = useCallback(() => { dragRef.current.active = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ────────────────────────────── Wheel zoom ───────────────────────────────
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const curX = (e.clientX - rect.left) / dispScale;
    const curY = (e.clientY - rect.top)  / dispScale;

    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 20;
    if (e.deltaMode === 2) delta *= 300;
    const step = Math.min(0.15, Math.abs(delta) / 400) * (delta > 0 ? -1 : 1);

    const oldS = scaleRef.current;
    const newS = clamp(oldS + oldS * step, 0.05, 20);
    const ratio = newS / oldS;
    const newX = curX - (curX - offsetRef.current.x) * ratio;
    const newY = curY - (curY - offsetRef.current.y) * ratio;

    setScale(newS);
    setOffsetX(newX);
    setOffsetY(newY);
    scaleRef.current  = newS;
    offsetRef.current = { x: newX, y: newY };
  }, [dispScale]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ────────────────────────────── Touch ────────────────────────────────────
  const getTouchDist = (t: React.TouchList) => {
    const dx = t[1].clientX - t[0].clientX;
    const dy = t[1].clientY - t[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      dragRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
      pinchRef.current.active = false;
    } else if (e.touches.length === 2) {
      dragRef.current.active = false;
      const el = containerRef.current;
      const rect = el?.getBoundingClientRect();
      const midClientX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midClientY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchRef.current = {
        active: true,
        dist0: getTouchDist(e.touches),
        scale0: scaleRef.current,
        midX: rect ? (midClientX - rect.left) / dispScale : midClientX,
        midY: rect ? (midClientY - rect.top)  / dispScale : midClientY,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchRef.current.active) {
      const dist = getTouchDist(e.touches);
      const p = pinchRef.current;
      const newS = clamp(p.scale0 * (dist / p.dist0), 0.05, 20);
      const ratio = newS / p.scale0;
      const el = containerRef.current;
      const rect = el?.getBoundingClientRect();
      const midClientX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midClientY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const midX = rect ? (midClientX - rect.left) / dispScale : midClientX;
      const midY = rect ? (midClientY - rect.top)  / dispScale : midClientY;
      const panDX = (midX - p.midX);
      const panDY = (midY - p.midY);
      const newX = p.ox + panDX + p.midX * (1 - ratio);
      const newY = p.oy + panDY + p.midY * (1 - ratio);
      setScale(newS);
      setOffsetX(newX);
      setOffsetY(newY);
      scaleRef.current  = newS;
      offsetRef.current = { x: newX, y: newY };
    } else if (e.touches.length === 1 && dragRef.current.active) {
      const d = dragRef.current;
      const { dx, dy } = toCanvas({ dx: e.touches[0].clientX - d.startX, dy: e.touches[0].clientY - d.startY });
      setOffsetX(d.ox + dx);
      setOffsetY(d.oy + dy);
      offsetRef.current = { x: d.ox + dx, y: d.oy + dy };
    }
  };

  const onTouchEnd = () => {
    dragRef.current.active = false;
    pinchRef.current.active = false;
  };

  // ────────────────────────────── Controls ─────────────────────────────────
  const zoomBy = (factor: number) => {
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const oldS = scaleRef.current;
    const newS = clamp(oldS * factor, 0.05, 20);
    const ratio = newS / oldS;
    const newX = cx - (cx - offsetRef.current.x) * ratio;
    const newY = cy - (cy - offsetRef.current.y) * ratio;
    setScale(newS);
    setOffsetX(newX);
    setOffsetY(newY);
    scaleRef.current  = newS;
    offsetRef.current = { x: newX, y: newY };
  };

  const rotateCW = () => setRotation(r => (r + 90) % 360);
  const doFlipH  = () => setFlipH(v => !v);
  const doFlipV  = () => setFlipV(v => !v);

  const center = () => {
    const norm = normalRef.current;
    if (!norm) return;
    const rotated = rotation === 90 || rotation === 270;
    const iw = rotated ? norm.height : norm.width;
    const ih = rotated ? norm.width  : norm.height;
    const newX = (canvasW - iw * scaleRef.current) / 2;
    const newY = (canvasH - ih * scaleRef.current) / 2;
    setOffsetX(newX);
    setOffsetY(newY);
    offsetRef.current = { x: newX, y: newY };
  };

  // ────────────────────────────── Export ───────────────────────────────────
  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw(); // убедимся, что нарисовано без safe-area overlay

    // Render final WITHOUT safe-area guide
    const final = document.createElement('canvas');
    final.width  = canvasW;
    final.height = canvasH;
    const ctx = final.getContext('2d')!;
    ctx.clearRect(0, 0, canvasW, canvasH);

    const norm = normalRef.current;
    if (norm) {
      ctx.save();
      ctx.translate(offsetRef.current.x, offsetRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);
      const iw = norm.width;
      const ih = norm.height;
      ctx.translate(iw / 2, ih / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);
      if (flipV) ctx.scale(1, -1);
      if (rotation === 90 || rotation === 270) {
        ctx.drawImage(norm, -ih / 2, -iw / 2, ih, iw);
      } else {
        ctx.drawImage(norm, -iw / 2, -ih / 2, iw, ih);
      }
      ctx.restore();
    }

    const isPng = src.startsWith('data:image/png') || src.startsWith('data:image/webp');
    if (isPng) {
      onDone(final.toDataURL('image/png'));
    } else {
      let q = 0.90;
      let url = final.toDataURL('image/jpeg', q);
      while (url.length > 400000 && q > 0.40) { q -= 0.10; url = final.toDataURL('image/jpeg', q); }
      onDone(url);
    }
  };

  // ────────────────────────────── Preset label ─────────────────────────────
  const activePreset = PRESETS.find(p => p.id === presetId)!;

  // ─────────────────────────────── Render ──────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.18 }}
        className="glass w-full rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ maxWidth: 580, maxHeight: '96dvh', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/20">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-tight">SEO-редактор обложки</p>
              <p className="text-[10px] text-white/30">Open Graph · Twitter · Telegram · Социальные сети</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-white/30 hover:bg-white/10 hover:text-white transition active:scale-90">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          {/* ── Format picker ── */}
          <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-3 shrink-0">
            <label className="mb-1.5 block text-[10px] font-medium text-white/30 uppercase tracking-wider">Формат</label>
            <div className="relative">
              <button
                onClick={() => setFormatOpen(v => !v)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2.5 text-left transition hover:bg-white/6 active:scale-[0.99]"
              >
                <span className="flex h-7 w-12 items-center justify-center rounded-lg bg-violet-500/20 text-[10px] font-bold text-violet-300 shrink-0">
                  {activePreset.short}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white">{activePreset.label}</p>
                  <p className="text-[10px] text-white/30 truncate">{activePreset.description}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-white/30 shrink-0 transition-transform duration-150 ${formatOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {formatOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-white/10 bg-[#1a1f2e] shadow-2xl shadow-black/70 overflow-hidden"
                  >
                    {PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setPresetId(p.id); setFormatOpen(false); }}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-white/5 active:bg-white/8"
                      >
                        <span className={`flex h-6 w-10 items-center justify-center rounded-md text-[9px] font-bold shrink-0 ${presetId === p.id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/8 text-white/40'}`}>
                          {p.short}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-white/90">{p.label}</p>
                          <p className="text-[10px] text-white/30">{p.description}</p>
                        </div>
                        {presetId === p.id && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Custom size inputs */}
            {presetId === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 flex items-center gap-2"
              >
                <input
                  type="number" min={100} max={4000} value={customW}
                  onChange={e => setCustomW(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/30 text-center"
                  placeholder="Ширина"
                />
                <span className="text-white/25 text-xs shrink-0">×</span>
                <input
                  type="number" min={100} max={4000} value={customH}
                  onChange={e => setCustomH(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/30 text-center"
                  placeholder="Высота"
                />
                <span className="text-white/25 text-xs shrink-0">px</span>
              </motion.div>
            )}
          </div>

          {/* ── Canvas area ── */}
          <div className="px-4 sm:px-5 pb-2 sm:pb-3 shrink-0">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-xl border border-white/10 mx-auto"
              style={{
                width: dispW,
                maxWidth: '100%',
                height: dispH,
                cursor: 'grab',
                touchAction: 'none',
                background: 'repeating-conic-gradient(#2a2a2a 0% 25%, #1e1e1e 0% 50%) 0 0 / 20px 20px',
                userSelect: 'none',
              }}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <canvas
                ref={canvasRef}
                width={canvasW}
                height={canvasH}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>

            {/* Resolution badge */}
            <div className="mt-1.5 flex items-center justify-between px-0.5">
              <span className="text-[10px] text-white/20">{canvasW} × {canvasH} px · {(canvasW / canvasH).toFixed(2)}:1</span>
              <button
                onClick={() => setShowSafeArea(v => !v)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] transition ${showSafeArea ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/25 hover:text-white/50'}`}
              >
                <Shield className="h-3 w-3" />
                Безопасная зона
              </button>
            </div>
          </div>

          {/* ── Safe area hint ── */}
          <AnimatePresence>
            {showSafeArea && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-4 sm:mx-5 mb-2 sm:mb-3 overflow-hidden"
              >
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/6 px-3 py-2.5">
                  <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-300/70 leading-relaxed">
                    Всё важное размещайте <span className="text-emerald-400 font-medium">внутри безопасной зоны</span> (зелёная рамка).
                    Telegram иногда обрезает края, Facebook кадрирует изображения — содержимое снаружи может быть скрыто.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Transform controls ── */}
          <div className="px-4 sm:px-5 pb-3 sm:pb-4 space-y-2.5 sm:space-y-3 shrink-0">
            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <button onClick={() => zoomBy(0.85)} className="rounded-lg border border-white/10 p-2 text-white/40 hover:bg-white/5 hover:text-white/70 transition active:scale-90 shrink-0">
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <input
                type="range" min={5} max={2000}
                value={Math.round(scale * 100)}
                onChange={e => {
                  const newS = Number(e.target.value) / 100;
                  const cx = canvasW / 2;
                  const cy = canvasH / 2;
                  const ratio = newS / scaleRef.current;
                  const newX = cx - (cx - offsetRef.current.x) * ratio;
                  const newY = cy - (cy - offsetRef.current.y) * ratio;
                  setScale(newS);
                  setOffsetX(newX);
                  setOffsetY(newY);
                  scaleRef.current  = newS;
                  offsetRef.current = { x: newX, y: newY };
                }}
                className="flex-1 accent-cyan-500"
              />
              <button onClick={() => zoomBy(1.15)} className="rounded-lg border border-white/10 p-2 text-white/40 hover:bg-white/5 hover:text-white/70 transition active:scale-90 shrink-0">
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] tabular-nums text-white/25 w-10 text-right shrink-0">{Math.round(scale * 100)}%</span>
            </div>

            {/* Transform buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={rotateCW}
                className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/3 py-2.5 text-[10px] text-white/40 hover:bg-white/6 hover:text-white/70 transition active:scale-95"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Поворот
              </button>
              <button
                onClick={doFlipH}
                className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[10px] transition active:scale-95 ${flipH ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-white/3 text-white/40 hover:bg-white/6 hover:text-white/70'}`}
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                Горизонт.
              </button>
              <button
                onClick={doFlipV}
                className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[10px] transition active:scale-95 ${flipV ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-white/3 text-white/40 hover:bg-white/6 hover:text-white/70'}`}
              >
                <FlipVertical className="h-3.5 w-3.5" />
                Вертикаль.
              </button>
              <button
                onClick={center}
                className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/3 py-2.5 text-[10px] text-white/40 hover:bg-white/6 hover:text-white/70 transition active:scale-95"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Центр
              </button>
            </div>

            {rotation !== 0 && (
              <p className="text-[10px] text-white/20 text-center">
                Поворот: {rotation}° · Двойное нажатие «Поворот» = 180°
              </p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-2 px-4 sm:px-5 py-3 sm:py-4 border-t border-white/8 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white/60 transition active:scale-95"
          >
            Отмена
          </button>
          <button
            onClick={handleDone}
            className="btn-glow flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500/90 to-cyan-600/90 hover:from-violet-500 hover:to-cyan-600 py-2.5 text-xs font-semibold text-white transition active:scale-95"
          >
            <Check className="h-3.5 w-3.5" />
            Сохранить SEO-обложку
          </button>
        </div>
      </motion.div>
    </div>
  );
}
