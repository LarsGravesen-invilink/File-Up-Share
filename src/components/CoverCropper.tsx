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
  const [, setImgSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const fitScale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    setScale(fitScale);
    setOffsetX((cw - img.naturalWidth * fitScale) / 2);
    setOffsetY((ch - img.naturalHeight * fitScale) / 2);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offsetX, y: t.clientY - offsetY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  }, [dragging, dragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffsetX(t.clientX - dragStart.x);
    setOffsetY(t.clientY - dragStart.y);
  }, [dragging, dragStart]);

  const handleEnd = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleMouseMove, handleTouchMove, handleEnd]);

  const zoom = (delta: number) => {
    setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY > 0 ? -0.05 : 0.05);
  };

  const cropAndSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const outW = 800;
    const outH = 600;
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      const cw = containerRef.current!.clientWidth;
      const ch = containerRef.current!.clientHeight;

      const srcX = -offsetX / scale;
      const srcY = -offsetY / scale;
      const srcW = cw / scale;
      const srcH = ch / scale;

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      onCrop(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imgSrc;
  };

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
          className="relative mb-3 aspect-[4/3] cursor-move overflow-hidden rounded-xl border border-white/10 bg-black"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
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

        <div className="mb-4 flex items-center justify-center gap-3">
          <button
            onClick={() => zoom(-0.1)}
            className="rounded-lg border border-white/10 p-2 text-white/40 transition active:scale-90 hover:bg-white/5 hover:text-white/60"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="w-32">
            <input
              type="range"
              min={10}
              max={500}
              value={Math.round(scale * 100)}
              onChange={e => setScale(Number(e.target.value) / 100)}
              className="w-full accent-cyan-500"
            />
          </div>
          <button
            onClick={() => zoom(0.1)}
            className="rounded-lg border border-white/10 p-2 text-white/40 transition active:scale-90 hover:bg-white/5 hover:text-white/60"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="text-[10px] tabular-nums text-white/25">{Math.round(scale * 100)}%</span>
        </div>

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
