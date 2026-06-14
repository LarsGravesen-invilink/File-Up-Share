import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Eye, EyeOff, Type, Save, ChevronDown, Link2, Image as ImageIcon, X, ZoomIn, ZoomOut, Move, Crop, Sparkles, ExternalLink } from 'lucide-react';
import { Toggle } from '../Toggle';
import type { Settings } from '../../types';
import { themes } from '../../themes';

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
}

// ────────────────────────────────────────────────
// Inline image cropper (no external deps needed)
// ────────────────────────────────────────────────
interface CropperProps {
  src: string;
  onDone: (dataUrl: string) => void;
  onCancel: () => void;
}

function ImageCropper({ src, onDone, onCancel }: CropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // State: scale, pan offset (cx,cy = image center in canvas coords)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  // Lock viewport zoom while cropper is open (prevents pinch-to-zoom on mobile)
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport ? viewport.getAttribute('content') : null;
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    return () => {
      if (viewport && originalContent !== null) {
        viewport.setAttribute('content', originalContent);
      }
    };
  }, []);

  // OG recommended size 1200×630
  const CANVAS_W = 1200;
  const CANVAS_H = 630;
  // Display size
  const DISP_W = 480;
  const DISP_H = 252;

  // Load image once
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Auto-fit: scale to cover the canvas
      const scaleX = CANVAS_W / img.naturalWidth;
      const scaleY = CANVAS_H / img.naturalHeight;
      const s = Math.max(scaleX, scaleY);
      setScale(s);
      setOffset({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
    };
    img.src = src;
  }, [src]);

  // Redraw canvas when scale/offset change
  useEffect(() => {
    draw();
  }, [scale, offset]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, offset.x - w / 2, offset.y - h / 2, w, h);
  }, [scale, offset]);

  const autoFit = () => {
    const img = imgRef.current;
    if (!img) return;
    const scaleX = CANVAS_W / img.naturalWidth;
    const scaleY = CANVAS_H / img.naturalHeight;
    const s = Math.max(scaleX, scaleY);
    setScale(s);
    setOffset({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  };

  const zoom = (factor: number) => {
    setScale(prev => Math.min(10, Math.max(0.1, prev * factor)));
  };

  // Pointer drag
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = (e.clientX - dragStart.current.mx) * (CANVAS_W / DISP_W);
    const dy = (e.clientY - dragStart.current.my) * (CANVAS_H / DISP_H);
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  };
  const onMouseUp = () => { dragging.current = false; };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    dragging.current = true;
    dragStart.current = { mx: e.touches[0].clientX, my: e.touches[0].clientY, ox: offset.x, oy: offset.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || e.touches.length !== 1) return;
    const dx = (e.touches[0].clientX - dragStart.current.mx) * (CANVAS_W / DISP_W);
    const dy = (e.touches[0].clientY - dragStart.current.my) * (CANVAS_H / DISP_H);
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  };

  const handleDone = () => {
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    onDone(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-lg rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <Crop className="h-4 w-4 text-violet-400" />
            Редактор изображения
          </span>
          <button onClick={onCancel} className="text-white/30 hover:text-white/70 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[10px] text-white/30">Перетащите изображение, чтобы выбрать отображаемую область (1200×630 px)</p>

        {/* Canvas display */}
        <div className="relative overflow-hidden rounded-xl border border-white/10"
          style={{ width: DISP_W, height: DISP_H, cursor: 'grab', maxWidth: '100%', margin: '0 auto' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ width: DISP_W, height: DISP_H, display: 'block', maxWidth: '100%' }}
          />
          {/* crosshair overlay */}
          <div className="pointer-events-none absolute inset-0 border border-cyan-400/20" />
          <div className="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/10 -translate-x-1/2" />
          <div className="pointer-events-none absolute top-1/2 left-0 right-0 h-px bg-cyan-400/10 -translate-y-1/2" />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <button onClick={() => zoom(0.9)} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white/60 hover:text-white/90 transition active:scale-95">
            <ZoomOut className="h-3.5 w-3.5" /> Уменьшить
          </button>
          <button onClick={() => zoom(1.1)} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white/60 hover:text-white/90 transition active:scale-95">
            <ZoomIn className="h-3.5 w-3.5" /> Увеличить
          </button>
          <button onClick={autoFit} className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/20 transition active:scale-95">
            <Sparkles className="h-3.5 w-3.5" /> Автоподгонка
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/40 hover:bg-white/5 transition active:scale-95"
          >
            Отмена
          </button>
          <button
            onClick={handleDone}
            className="btn-glow flex-1 rounded-lg bg-gradient-to-r from-violet-500/80 to-cyan-600/80 hover:from-violet-500 hover:to-cyan-600 py-2 text-xs font-semibold text-white transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" /> Применить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Demo preview overlay
// ────────────────────────────────────────────────
interface DemoPreviewProps {
  title: string;
  description: string;
  siteName: string;
  image: string;
  onClose: () => void;
}

function DemoPreview({ title, description, siteName, image, onClose }: DemoPreviewProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm mx-auto"
        style={{ maxHeight: '90vh', overflowY: 'auto', padding: '12px 12px 20px' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40 flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Предпросмотр карточки ссылки
          </span>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Telegram-style card */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#1a1f2e]">
            {image && (
              <div className="w-full aspect-[1200/630] overflow-hidden bg-black/20">
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-3 space-y-0.5">
              {siteName && <p className="text-[10px] text-cyan-400 font-medium">{siteName}</p>}
              <p className="text-sm font-semibold text-white leading-tight">{title || 'Заголовок карточки'}</p>
              {description && <p className="text-xs text-white/50 leading-snug line-clamp-2">{description}</p>}
            </div>
          </div>

          {/* WhatsApp-style card */}
          <div className="rounded-xl overflow-hidden border-l-4 border-[#25D366] bg-[#1a1f2e]/80">
            {image && (
              <div className="w-full aspect-[1200/630] overflow-hidden bg-black/20">
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-3 space-y-0.5">
              <p className="text-sm font-semibold text-white leading-tight">{title || 'Заголовок карточки'}</p>
              {description && <p className="text-xs text-white/50 leading-snug line-clamp-2">{description}</p>}
              {siteName && <p className="text-[10px] text-white/30">{siteName}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg border border-white/10 py-2.5 text-xs text-white/40 hover:bg-white/5 transition active:scale-95"
          >
            Закрыть демо
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Main DesignPage
// ────────────────────────────────────────────────
export function DesignPage({ settings, onUpdate }: Props) {
  const [confirmTheme, setConfirmTheme] = useState<string | null>(null);
  const [adTextLocal, setAdTextLocal] = useState(settings.adText);
  const [adSaved, setAdSaved] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Preview settings local state
  const [prevTitle, setPrevTitle] = useState(settings.previewTitle || '');
  const [prevDesc, setPrevDesc] = useState(settings.previewDescription || '');
  const [prevSite, setPrevSite] = useState(settings.previewSiteName || '');
  const [prevImage, setPrevImage] = useState(settings.previewImage || '');
  const [prevSaved, setPrevSaved] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentTheme = themes.find(t => t.id === settings.pageTheme) || themes[0];

  const applyTheme = (id: string) => {
    onUpdate({ pageTheme: id });
    setConfirmTheme(null);
  };

  const saveAdText = () => {
    onUpdate({ adText: adTextLocal });
    setAdSaved(true);
    setTimeout(() => setAdSaved(false), 2000);
  };

  const savePreview = () => {
    onUpdate({
      previewTitle: prevTitle,
      previewDescription: prevDesc,
      previewSiteName: prevSite,
      previewImage: prevImage,
    });
    setPrevSaved(true);
    setTimeout(() => setPrevSaved(false), 2500);
  };

  // Image selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setCropSrc(result);
    };
    reader.readAsDataURL(file);
  };

  const onDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
    if (dropZoneRef.current) dropZoneRef.current.classList.remove('border-cyan-500/60');
  };

  const onDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) dropZoneRef.current.classList.add('border-cyan-500/60');
  };

  const onDropZoneDragLeave = () => {
    if (dropZoneRef.current) dropZoneRef.current.classList.remove('border-cyan-500/60');
  };

  // Effective preview values for demo (uses panel branding as fallback)
  const demoTitle = settings.previewEnabled
    ? (prevTitle || settings.name || 'FileUpShare')
    : (settings.name || 'FileUpShare');
  const demoDesc = settings.previewEnabled
    ? prevDesc
    : 'Персональная система обмена файлами FileUpShare';
  const demoSite = settings.previewEnabled
    ? (prevSite || demoTitle)
    : demoTitle;
  const demoImage = settings.previewEnabled
    ? (prevImage || settings.logo || '')
    : (settings.logo || '');

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Palette className="h-4 w-4 text-violet-400" />
          Внешний вид страниц
        </h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-5"
        style={{ position: 'relative', zIndex: dropdownOpen ? 10 : undefined }}
      >
        <h4 className="mb-3 text-xs font-medium text-white/40">Темы страниц</h4>
        <div ref={dropdownRef} className="relative">
          {/* Trigger button */}
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-left transition hover:bg-white/6 active:scale-[0.99]"
          >
            {/* Mini preview swatch */}
            <div className="flex h-9 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: currentTheme.bg, border: '1px solid ' + currentTheme.borderColor }}>
              <div className="flex flex-col gap-1 px-1.5">
                <div className="h-0.5 w-8 rounded-full" style={{ background: currentTheme.accent }} />
                <div className="h-0.5 w-5 rounded-full" style={{ background: currentTheme.textMuted, opacity: 0.6 }} />
                <div className="h-0.5 w-6 rounded-full" style={{ background: currentTheme.textMuted, opacity: 0.3 }} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white">{currentTheme.name}</div>
              <div className="text-[10px] text-white/30">Тёмная тема</div>
            </div>
            <ChevronDown className={`h-4 w-4 flex-shrink-0 text-white/30 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown list */}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#1a1f2e] shadow-2xl shadow-black/60">
              <div className="max-h-72 overflow-y-auto py-1">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setDropdownOpen(false); setConfirmTheme(t.id); }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5 active:bg-white/8"
                  >
                    {/* Swatch */}
                    <div className="flex h-8 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: t.bg, border: '1px solid ' + t.borderColor }}>
                      <div className="flex flex-col gap-1 px-1.5">
                        <div className="h-0.5 w-7 rounded-full" style={{ background: t.accent }} />
                        <div className="h-0.5 w-4 rounded-full" style={{ background: t.textMuted, opacity: 0.5 }} />
                        <div className="h-0.5 w-5 rounded-full" style={{ background: t.textMuted, opacity: 0.25 }} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-white/90">{t.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />
                        <span className="text-[10px]" style={{ color: t.accent + 'cc' }}>
                          {t.bg} · {t.accent}
                        </span>
                      </div>
                    </div>
                    {settings.pageTheme === t.id && (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                        <Check className="h-3 w-3 text-cyan-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Link Preview Toggle ── */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Link2 className="h-3.5 w-3.5" />
              Предпросмотр ссылок
            </div>
            <Toggle checked={!!settings.previewEnabled} onChange={v => onUpdate({ previewEnabled: v })} />
          </div>
          <p className="px-1 text-[10px] text-white/20">
            Отображение метаданных, отображаемых при отправке ссылки например в мессенджер
          </p>

          <AnimatePresence>
            {settings.previewEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  {/* Title */}
                  <div>
                    <label className="mb-1.5 block text-[10px] text-white/30">Заголовок карточки</label>
                    <input
                      type="text"
                      value={prevTitle}
                      onChange={e => setPrevTitle(e.target.value)}
                      placeholder={settings.name || 'FileUpShare'}
                      className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-1.5 block text-[10px] text-white/30">Описание карточки</label>
                    <textarea
                      value={prevDesc}
                      onChange={e => setPrevDesc(e.target.value)}
                      placeholder="Краткое описание вашего сервиса"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
                    />
                  </div>

                  {/* Site name */}
                  <div>
                    <label className="mb-1.5 block text-[10px] text-white/30">Название сайта</label>
                    <input
                      type="text"
                      value={prevSite}
                      onChange={e => setPrevSite(e.target.value)}
                      placeholder={prevTitle || settings.name || 'FileUpShare'}
                      className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
                    />
                  </div>

                  {/* Image */}
                  <div>
                    <label className="mb-1.5 block text-[10px] text-white/30">Логотип / изображение карточки</label>

                    {prevImage ? (
                      <div className="relative overflow-hidden rounded-xl border border-white/10">
                        <div className="aspect-[1200/630] w-full overflow-hidden bg-black/20">
                          <img src={prevImage} alt="preview" className="h-full w-full object-cover" />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <button
                            onClick={() => setCropSrc(prevImage)}
                            className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] text-white/70 hover:bg-white/20 transition active:scale-95"
                          >
                            <Crop className="h-3 w-3" /> Редактировать
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] text-white/70 hover:bg-white/20 transition active:scale-95"
                          >
                            <ImageIcon className="h-3 w-3" /> Заменить
                          </button>
                          <button
                            onClick={() => setPrevImage('')}
                            className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[10px] text-red-400 hover:bg-red-500/30 transition active:scale-95"
                          >
                            <X className="h-3 w-3" /> Удалить
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        ref={dropZoneRef}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={onDropZoneDrop}
                        onDragOver={onDropZoneDragOver}
                        onDragLeave={onDropZoneDragLeave}
                        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/3 py-8 text-center transition hover:border-white/20 hover:bg-white/5"
                      >
                        <ImageIcon className="h-8 w-8 text-white/15" />
                        <div>
                          <p className="text-xs text-white/30">Перетащите или нажмите для выбора</p>
                          <p className="text-[10px] text-white/15 mt-0.5">Рекомендуется 1200×630 px</p>
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* Save + Demo buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowDemo(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-2.5 text-xs text-white/50 hover:bg-white/8 hover:text-white/70 transition active:scale-95"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Демо
                    </button>
                    <button
                      onClick={savePreview}
                      className={`btn-glow flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white transition active:scale-95 ${
                        prevSaved
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gradient-to-r from-violet-500/80 to-cyan-600/80 hover:from-violet-500 hover:to-cyan-600'
                      }`}
                    >
                      {prevSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                      {prevSaved ? 'Настройки предпросмотра сохранены' : 'Сохранить настройки'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo button when preview is disabled */}
          {!settings.previewEnabled && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDemo(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-[10px] text-white/40 hover:bg-white/8 hover:text-white/60 transition active:scale-95"
              >
                <Eye className="h-3 w-3" />
                Демо карточки
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-3 text-xs font-medium text-white/40">Дополнительно</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
              {settings.hideLifetimeOnPage ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              Скрыть таймер на страницах
            </div>
            <Toggle checked={settings.hideLifetimeOnPage} onChange={v => onUpdate({ hideLifetimeOnPage: v })} />
          </div>
          {settings.hideLifetimeOnPage && (
            <p className="px-1 text-[10px] text-white/15">Глобально скрывает обратный отсчёт на всех публичных страницах</p>
          )}

          <div className="rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Type className="h-3.5 w-3.5" />
                Рекламный блок
              </div>
              <Toggle checked={settings.adEnabled} onChange={v => onUpdate({ adEnabled: v })} />
            </div>
            {settings.adEnabled && (
              <>
                <textarea
                  value={adTextLocal}
                  onChange={e => setAdTextLocal(e.target.value)}
                  placeholder="Текст (ссылки станут кликабельными)"
                  rows={2}
                  autoComplete="off"
                  className="mt-3 w-full resize-none rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
                />
                <p className="mt-1 text-[10px] text-white/15">
                  Отображается внизу публичных страниц. Текст некопируем, ссылки кликабельны.
                </p>
                <button
                  onClick={saveAdText}
                  className={`btn-glow mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white transition active:scale-95 ${
                    adSaved
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gradient-to-r from-violet-500/80 to-cyan-600/80 hover:from-violet-500 hover:to-cyan-600'
                  }`}
                >
                  {adSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  {adSaved ? 'Сохранено' : 'Сохранить рекламный блок'}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {confirmTheme && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass mx-4 w-full max-w-sm rounded-2xl p-6"
          >
            <h3 className="mb-2 text-base font-semibold text-white">Применить тему?</h3>
            <p className="mb-5 text-xs text-white/40">
              Тема «{themes.find(t => t.id === confirmTheme)?.name}» будет применена ко всем публичным страницам.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmTheme(null)}
                className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/40 transition active:scale-95 hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                onClick={() => applyTheme(confirmTheme)}
                className="btn-glow flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2 text-xs font-medium text-white transition active:scale-95"
              >
                Применить
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image cropper modal */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onDone={dataUrl => {
            setPrevImage(dataUrl);
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Demo preview modal */}
      {showDemo && (
        <DemoPreview
          title={demoTitle}
          description={demoDesc}
          siteName={demoSite}
          image={demoImage}
          onClose={() => setShowDemo(false)}
        />
      )}
    </div>
  );
}

