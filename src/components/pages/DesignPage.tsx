import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Eye, EyeOff, Type, Save, ChevronDown, Link2, Image as ImageIcon, X, Crop, ExternalLink } from 'lucide-react';
import { Toggle } from '../Toggle';
import type { Settings } from '../../types';
import { themes } from '../../themes';
import { SEOImageEditor } from '../SEOImageEditor';

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
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
  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1320] shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
          <span className="text-xs font-medium text-white/60 flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5" />
            Предпросмотр карточки ссылки
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cards */}
        <div className="overflow-y-auto p-4 space-y-3" style={{ overscrollBehavior: 'contain' }}>
          {/* Вариант 1: с картинкой сверху */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#17212b]">
            {image && (
              <div className="w-full aspect-[1200/630] overflow-hidden bg-black/30">
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="px-3 py-2.5 space-y-0.5">
              {siteName && <p className="text-[10px] text-[#5ac8fa] font-medium">{siteName}</p>}
              <p className="text-sm font-semibold text-white leading-tight">{title || 'Заголовок карточки'}</p>
              {description && <p className="text-xs text-white/45 leading-snug line-clamp-2">{description}</p>}
            </div>
          </div>

          {/* Вариант 2: текст + левая полоса (без картинки) */}
          <div className="rounded-xl overflow-hidden bg-[#1a1f2e] border border-white/8" style={{ borderLeft: '4px solid #25D366' }}>
            <div className="px-3 py-2.5 space-y-0.5">
              <p className="text-sm font-semibold text-white leading-tight">{title || 'Заголовок карточки'}</p>
              {description && <p className="text-xs text-white/45 leading-snug line-clamp-2">{description}</p>}
              {siteName && <p className="text-[10px] text-white/25 mt-0.5">{siteName}</p>}
            </div>
          </div>

          {/* Вариант 3: текст компактный (без картинки) */}
          <div className="rounded-xl overflow-hidden bg-[#1c2233] border border-white/8">
            <div className="px-3 py-2.5 space-y-0.5">
              <p className="text-sm font-semibold text-white leading-tight">{title || 'Заголовок карточки'}</p>
              {description && <p className="text-xs text-white/45 leading-snug line-clamp-2">{description}</p>}
              {siteName && <p className="text-[10px] text-[#7eb3f5] mt-0.5">{siteName}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/8 shrink-0">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-white/6 hover:bg-white/10 py-2.5 text-xs text-white/60 hover:text-white/90 transition font-medium active:scale-[0.98]"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
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
  const [cropFile, setCropFile] = useState<File | undefined>(undefined);
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
      setCropFile(file);
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

      {/* SEO Image Editor modal */}
      {cropSrc && (
        <SEOImageEditor
          src={cropSrc}
          file={cropFile}
          onDone={dataUrl => {
            setPrevImage(dataUrl);
            setCropSrc(null);
            setCropFile(undefined);
          }}
          onCancel={() => { setCropSrc(null); setCropFile(undefined); }}
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

