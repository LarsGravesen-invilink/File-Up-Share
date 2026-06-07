import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check, Move } from 'lucide-react';

interface Props {
  imageFile: File;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
}

export function CoverCropper({ imageFile, onCrop, onCancel }: Props) {
  const [imgSrc, setImgSrc] = useState('');
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [transparent, setTransparent] = useState(() =>
    imageFile.type === 'image/png' || imageFile.type === 'image/webp'
  );

  // Используем ref для offset чтобы избежать closure-проблем в mousemove
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const imgSizeRef = useRef({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const applyOffset = (x: number, y: number) => {
    offsetRef.current = { x, y };
    setOffsetX(x);
    setOffsetY(y);
  };

  const applyScale = (s: number) => {
    scaleRef.current = s;
    setScale(s);
  };

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const size = { w: img.naturalWidth, h: img.naturalHeight };
    imgSizeRef.current = size;
    setImgSize(size);
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const fs = Math.max(cw / size.w, ch / size.h);
    applyScale(fs);
    applyOffset((cw - size.w * fs) / 2, (ch - size.h * fs) / 2);
  }, []);

  // Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offsetRef.current.x, y: t.clientY - offsetRef.current.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    applyOffset(e.clientX - dragStart.x, e.clientY - dragStart.y);
  }, [dragging, dragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    applyOffset(t.clientX - dragStart.x, t.clientY - dragStart.y);
  }, [dragging, dragStart]);

  const handleEnd = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleMouseMove, handleTouchMove, handleEnd]);

  // Zoom — нормализованный, относительно позиции курсора
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    // Нормализация deltaY: trackpad даёт маленькие значения, мышь — большие (120)
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 20;        // Firefox линейный режим
    if (e.deltaMode === 2) delta *= 300;       // страничный режим
    // Ограничиваем скорость: не более ±0.15 за событие, плавно для trackpad
    const step = Math.min(0.15, Math.abs(delta) / 400) * (delta > 0 ? -1 : 1);

    const rect = container.getBoundingClientRect();
    // Позиция курсора внутри контейнера
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const oldScale = scaleRef.current;
    const newScale = Math.max(0.05, Math.min(5, oldScale + step));
    if (newScale === oldScale) return;

    // Зум относительно курсора: точка под курсором остаётся на месте
    const ratio = newScale / oldScale;
    const newX = cursorX - (cursorX - offsetRef.current.x) * ratio;
    const newY = cursorY - (cursorY - offsetRef.current.y) * ratio;

    applyScale(newScale);
    applyOffset(newX, newY);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const zoomBtn = (delta: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const oldScale = scaleRef.current;
    const newScale = Math.max(0.05, Math.min(5, oldScale + delta));
    // Зум относительно центра контейнера
    const ratio = newScale / oldScale;
    const cx = cw / 2;
    const cy = ch / 2;
    applyScale(newScale);
    applyOffset(cx - (cx - offsetRef.current.x) * ratio, cy - (cy - offsetRef.current.y) * ratio);
  };

  const cropAndSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current || !imgSizeRef.current.w) return;

    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const s = scaleRef.current;
    const ox = offsetRef.current.x;
    const oy = offsetRef.current.y;
    const iw = imgSizeRef.current.w;
    const ih = imgSizeRef.current.h;

    // Границы изображения в пикселях контейнера
    const imgLeft   = ox;
    const imgTop    = oy;
    const imgRight  = ox + iw * s;
    const imgBottom = oy + ih * s;

    // Видимая область = пересечение контейнера и изображения
    const visLeft   = Math.max(0, imgLeft);
    const visTop    = Math.max(0, imgTop);
    const visRight  = Math.min(cw, imgRight);
    const visBottom = Math.min(ch, imgBottom);

    if (visRight <= visLeft || visBottom <= visTop) return;

    // Проверяем, есть ли пустые поля — т.е. изображение не покрывает весь контейнер
    const hasPadding = imgLeft > 0 || imgTop > 0 || imgRight < cw || imgBottom < ch;

    let srcX: number, srcY: number, srcW: number, srcH: number;
    let outW: number, outH: number;

    if (hasPadding) {
      // Экспортируем только реальные пиксели изображения, видимые в контейнере
      srcX = (visLeft - imgLeft) / s;
      srcY = (visTop  - imgTop)  / s;
      srcW = (visRight  - visLeft) / s;
      srcH = (visBottom - visTop)  / s;
      // Выходной размер пропорционален видимой части, но не мельче 100px
      const maxDim = 800;
      const aspect = srcW / srcH;
      if (aspect >= 1) { outW = maxDim; outH = Math.round(maxDim / aspect); }
      else             { outH = maxDim; outW = Math.round(maxDim * aspect); }
    } else {
      // Картинка покрывает весь кадр — стандартный кроп 800×600
      outW = 800; outH = 600;
      srcX = -ox / s;
      srcY = -oy / s;
      srcW = cw / s;
      srcH = ch / s;
    }

    canvas.width  = outW;
    canvas.height = outH;

    const ctx = canvas.getContext('2d')!;
    if (transparent) {
      ctx.clearRect(0, 0, outW, outH);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, outW, outH);
    }

    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      const mime    = transparent ? 'image/png' : 'image/jpeg';
      const quality = transparent ? undefined : 0.85;
      onCrop(canvas.toDataURL(mime, quality));
    };
    img.src = imgSrc;
  };

  const isPngLike = imageFile.type === 'image/png' || imageFile.type === 'image/webp';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass w-full max-w-lg rounded-2xl p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Обложка 4:3</h3>
            <p className="text-[10px] text-white/30">Переместите и масштабируйте изображение</p>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-white/30 transition active:scale-90 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative mb-3 aspect-[4/3] cursor-move overflow-hidden rounded-xl border border-white/10"
          style={{ background: transparent ? 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 16px 16px' : '#000' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {imgSrc && (
            <img
              src={imgSrc}
              alt=""
              onLoad={onImgLoad}
              className="absolute select-none"
              draggable={false}
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                transformOrigin: '0 0',
                maxWidth: 'none',
              }}
            />
          )}
          <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-xl" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white/40">
            <Move className="h-3 w-3" /> Перетаскивайте для позиционирования
          </div>
        </div>

        <div className="mb-3 flex items-center justify-center gap-3">
          <button
            onClick={() => zoomBtn(-0.1)}
            className="rounded-lg border border-white/10 p-2 text-white/40 transition active:scale-90 hover:bg-white/5 hover:text-white/60"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="w-32">
            <input
              type="range"
              min={5}
              max={500}
              value={Math.round(scale * 100)}
              onChange={e => {
                const newScale = Number(e.target.value) / 100;
                const container = containerRef.current;
                if (!container) return;
                const cx = container.clientWidth / 2;
                const cy = container.clientHeight / 2;
                const ratio = newScale / scaleRef.current;
                applyScale(newScale);
                applyOffset(cx - (cx - offsetRef.current.x) * ratio, cy - (cy - offsetRef.current.y) * ratio);
              }}
              className="w-full accent-cyan-500"
            />
          </div>
          <button
            onClick={() => zoomBtn(0.1)}
            className="rounded-lg border border-white/10 p-2 text-white/40 transition active:scale-90 hover:bg-white/5 hover:text-white/60"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="text-[10px] tabular-nums text-white/25">{Math.round(scale * 100)}%</span>
        </div>

        {isPngLike && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setTransparent(v => !v)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] transition active:scale-95 ${
                transparent
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                  : 'border-white/10 text-white/30 hover:bg-white/5 hover:text-white/50'
              }`}
            >
              <span
                className="inline-block h-3 w-3 rounded-sm border border-white/20 flex-shrink-0"
                style={{ background: transparent ? 'repeating-conic-gradient(#888 0% 25%, #444 0% 50%) 0 0 / 6px 6px' : '#000' }}
              />
              Прозрачный фон
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition active:scale-95 hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            onClick={cropAndSave}
            className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-xs font-medium text-white transition active:scale-95"
          >
            <Check className="h-3.5 w-3.5" />
            Применить
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </motion.div>
  );
}
