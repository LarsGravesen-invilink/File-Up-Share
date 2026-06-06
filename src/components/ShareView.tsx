import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ShareItem, ShareFile, Settings } from '../types';
import { getTheme, formatBytes } from '../types';

interface Props { item: ShareItem; settings: Settings; onBack?: () => void; isPreview?: boolean; }

const parseLinks = (text: string): React.ReactNode[] => {
  const re = /(https?:\/\/[^\s]+)/g;
  return text.split(re).map((p, i) => re.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" style={{ userSelect: 'text' }} className="underline opacity-80 hover:opacity-100">{p}</a> : <span key={i}>{p}</span>);
};

const defaultAd = 'Хотите так же управлять получением и раздачей файлов с помощью своего сервера Linux? Посетите страницу проекта ';
const defaultAdLink = 'https://github.com/LarsGravesen-invilink/File-Up-Share';

/* ─── Fullscreen Viewer ─── */
const Viewer: React.FC<{ file: ShareFile; onClose: () => void; viewOnly: boolean }> = ({ file, onClose, viewOnly }) => {
  const isImg = file.type.startsWith('image/');
  const isVid = file.type.startsWith('video/');
  const vidRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    window.history.pushState({ viewer: true }, '');
    const onPop = () => onClose();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [onClose]);

  const goFs = useCallback(() => {
    const el = vidRef.current;
    if (el?.requestFullscreen) el.requestFullscreen();
    try { (screen.orientation as any)?.lock?.('landscape').catch(() => {}); } catch {}
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: '#000' }} onClick={onClose}>
      {viewOnly && <style>{`.vp{-webkit-touch-callout:none}@media print{.vp{visibility:hidden}}`}</style>}
      <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white/80 hover:text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      {isImg && <img src={file.data} alt="" className="max-w-full max-h-full object-contain vp" draggable={false} onClick={e => e.stopPropagation()} style={{ pointerEvents: viewOnly ? 'none' : 'auto' }} />}
      {isVid && (
        <div className="w-full h-full flex items-center justify-center vp" onClick={e => e.stopPropagation()}>
          <video ref={vidRef} src={file.data} controls controlsList="nodownload" autoPlay className="max-w-full max-h-full" />
          <button onClick={goFs} className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white/80 hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Animated background CSS ─── */
const bgStyle = (color: string) => `
@keyframes bg-move{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.share-bg{background:linear-gradient(135deg,${color},${color}dd,${color}bb,${color});background-size:400% 400%;animation:bg-move 15s ease infinite}
@keyframes marquee-name{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.name-marquee{animation:marquee-name 8s linear infinite}
`;

/* ─── Main ─── */
export const ShareView: React.FC<Props> = ({ item, settings, onBack, isPreview }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwErr, setPwErr] = useState(false);
  const [videoIdx, setVideoIdx] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [showCount, setShowCount] = useState(5);
  const [viewerFile, setViewerFile] = useState<ShareFile | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const t = getTheme(settings.pageTheme);
  const showTimer = item.lifetimeEnabled && !settings.hideLifetimeOnPage;
  const adText = settings.adEnabled ? (settings.adText || '') : '';
  const showDefaultAd = settings.adEnabled && !settings.adText;
  const allFiles: ShareFile[] = item.files?.length ? item.files : [{ name: item.fileName, type: item.fileType, data: item.fileData, size: item.fileSize }];
  const canDl = item.mode === 'download' || item.allowDownload;
  const viewOnly = item.mode === 'view' && !item.allowDownload;
  const isAllVideo = allFiles.every(f => f.type.startsWith('video/'));
  const isAllAudio = allFiles.every(f => f.type.startsWith('audio/'));
  const reqPw = item.password || (settings.sharePasswordEnabled ? settings.sharePassword : '');
  const needsPw = reqPw && !unlocked && !isPreview;

  useEffect(() => {
    if (!item.lifetimeEnabled) return;
    const ms = (item.lifetimeHours * 60 + item.lifetimeMinutes) * 60 * 1000;
    const exp = item.createdAt + ms;
    const upd = () => {
      const r = exp - Date.now();
      if (r <= 0) { setExpired(true); setTimeLeft('Истекло'); return; }
      const h = Math.floor(r / 3600000), m = Math.floor((r % 3600000) / 60000), s = Math.floor((r % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`);
    };
    upd(); const i = setInterval(upd, 1000); return () => clearInterval(i);
  }, [item]);

  const dn = (f: ShareFile) => item.hideExtension ? f.name.replace(/\.[^/.]+$/, '') : f.name;
  const dl = (f: ShareFile) => { const a = document.createElement('a'); a.href = f.data; a.download = f.name; a.click(); };
  const unlock = () => { if (pwInput === reqPw) { setUnlocked(true); setPwErr(false); } else setPwErr(true); };
  const playA = (idx: number) => { audioRefs.current.forEach((a, i) => { if (a && i !== idx) { a.pause(); a.currentTime = 0; } }); audioRefs.current[idx]?.play(); setPlayingAudio(idx); };
  const openV = (f: ShareFile) => { if (f.type.startsWith('image/') || f.type.startsWith('video/')) setViewerFile(f); };
  const canV = (f: ShareFile) => f.type.startsWith('image/') || f.type.startsWith('video/');

  const DlBtn: React.FC<{ f: ShareFile; small?: boolean }> = ({ f, small }) => canDl ? (
    <button onClick={e => { e.stopPropagation(); dl(f); }} className={`rounded flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80 ${small ? 'w-7 h-7' : 'h-10 px-6 rounded-lg text-[13px] font-semibold gap-2'}`} style={small ? { color: t.textMuted } : { background: t.text + '18', color: t.text, border: `1px solid ${t.text}25` }}>
      <svg width={small ? 12 : 15} height={small ? 12 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      {!small && 'Скачать'}
    </button>
  ) : null;

  /* Password */
  if (needsPw) return (
    <div className="min-h-dvh flex flex-col share-bg" style={{ color: t.text }}>
      <style>{bgStyle(t.bg)}</style>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-xs text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: t.accent + '20', border: `1px solid ${t.accent}30` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-base font-semibold mb-1" style={{ color: t.text }}>Требуется пароль</h2>
          <p className="text-[12px] mb-5" style={{ color: t.textMuted }}>Введите пароль для доступа</p>
          <input type="password" value={pwInput} onChange={e => { setPwInput(e.target.value); setPwErr(false); }} onKeyDown={e => e.key === 'Enter' && unlock()} placeholder="Пароль" className="w-full h-10 px-4 rounded-lg border text-[13px] text-center outline-none mb-3" style={{ background: t.inputBg, borderColor: pwErr ? '#ef4444' : t.inputBorder, color: t.inputText }} />
          {pwErr && <p className="text-[11px] text-[#ef4444] mb-3">Неверный пароль</p>}
          <button onClick={unlock} className="w-full h-10 rounded-lg text-[13px] font-semibold" style={{ background: t.accent, color: t.accentText }}>Получить доступ</button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col select-none share-bg" style={{ color: t.text }} onContextMenu={e => { if (viewOnly) e.preventDefault(); }}>
      <style>{bgStyle(t.bg)}</style>

      {viewerFile && <Viewer file={viewerFile} onClose={() => setViewerFile(null)} viewOnly={viewOnly} />}

      <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4 flex-shrink-0 backdrop-blur-md" style={{ background: t.bg + 'dd' }}>
        <div className="flex items-center gap-3 min-w-0">
          {isPreview && onBack && <button onClick={onBack} className="mr-2 text-[11px] opacity-60 hover:opacity-100" style={{ color: t.textMuted }}>←</button>}
          {settings.logo ? <img src={settings.logo} alt="" className="w-8 h-8 object-contain flex-shrink-0" /> : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: t.accent + '20' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
          )}
          <div className="text-[15px] font-semibold" style={{ color: t.text }}>{settings.name}</div>
        </div>
        {showTimer && <div className="text-[12px] font-mono font-bold" style={{ color: expired ? '#ef4444' : t.textMuted }}>{timeLeft}</div>}
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-2 pb-6">
        {item.cover && (
          <div className="w-full max-w-xl rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
            <img src={item.cover} alt="" className="w-full h-full object-cover" draggable={false} style={{ pointerEvents: 'none' }} />
          </div>
        )}

        {(item.title || item.comment) && (
          <div className="text-center mb-4 max-w-md">
            {item.title && <h1 className="text-base font-semibold mb-1" style={{ color: t.text }}>{parseLinks(item.title)}</h1>}
            {item.comment && <p className="text-[12px] italic" style={{ color: t.textMuted }}>{parseLinks(item.comment)}</p>}
          </div>
        )}

        {expired ? (
          <div className="text-center py-10"><div className="text-3xl mb-3">⏰</div><div className="text-[14px] font-medium">Раздача истекла</div></div>
        ) : isAllVideo ? (
          <div className="w-full max-w-xl">
            <div className="rounded-lg overflow-hidden mb-3 cursor-pointer" style={{ background: '#000' }} onClick={() => openV(allFiles[videoIdx])}>
              <video key={videoIdx} src={allFiles[videoIdx].data} controls controlsList="nodownload" className="w-full max-h-[55vh]" autoPlay preload="auto" />
            </div>
            {allFiles.length > 1 && <div className="flex items-center justify-between px-2 mb-2"><button onClick={() => setVideoIdx(Math.max(0, videoIdx - 1))} disabled={videoIdx === 0} className="text-[11px] font-medium disabled:opacity-30" style={{ color: t.accent }}>← Пред</button><span className="text-[10px]" style={{ color: t.textMuted }}>{videoIdx + 1} / {allFiles.length}</span><button onClick={() => setVideoIdx(Math.min(allFiles.length - 1, videoIdx + 1))} disabled={videoIdx === allFiles.length - 1} className="text-[11px] font-medium disabled:opacity-30" style={{ color: t.accent }}>След →</button></div>}
            <DlBtn f={allFiles[videoIdx]} />
          </div>
        ) : isAllAudio ? (
          <div className="w-full max-w-md space-y-2">
            {allFiles.map((f, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: t.surface + '80' }}>
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => playA(i)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.accent + '20' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={t.accent}>{playingAudio === i ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> : <polygon points="5 3 19 12 5 21 5 3"/>}</svg>
                  </button>
                  <div className="flex-1 min-w-0"><div className="text-[12px] font-medium truncate" style={{ color: t.text }}>{dn(f)}</div><div className="text-[9px]" style={{ color: t.textMuted }}>{formatBytes(f.size)}</div></div>
                  <DlBtn f={f} small />
                </div>
                <audio ref={el => { audioRefs.current[i] = el; }} src={f.data} controls controlsList="nodownload" className="w-full h-8" style={{ filter: 'sepia(20%) saturate(70%) hue-rotate(100deg)' }} onPlay={() => playA(i)} />
              </div>
            ))}
          </div>
        ) : allFiles.length === 1 ? (
          <div className="w-full max-w-xl flex flex-col items-center">
            {allFiles[0].type.startsWith('image/') && <div className="rounded-lg overflow-hidden mb-4 max-w-full cursor-pointer" onClick={() => openV(allFiles[0])}><img src={allFiles[0].data} alt={dn(allFiles[0])} className="max-w-full max-h-[55vh] object-contain" draggable={false} style={{ pointerEvents: viewOnly ? 'none' : 'auto' }} /></div>}
            {allFiles[0].type.startsWith('video/') && <div className="rounded-lg overflow-hidden mb-4 w-full max-w-lg cursor-pointer" style={{ background: '#000' }} onClick={() => openV(allFiles[0])}><video src={allFiles[0].data} controls controlsList="nodownload" className="w-full max-h-[55vh]" preload="auto" /></div>}
            {allFiles[0].type.startsWith('audio/') && <div className="w-full max-w-sm rounded-xl p-4 mb-4" style={{ background: t.surface + '80' }}><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: t.accent + '15' }}>🎵</div><div className="flex-1 truncate text-[12px] font-medium" style={{ color: t.text }}>{dn(allFiles[0])}</div></div><audio src={allFiles[0].data} controls controlsList="nodownload" className="w-full h-9" style={{ filter: 'sepia(20%) saturate(70%) hue-rotate(100deg)' }} /></div>}
            {!allFiles[0].type.startsWith('image/') && !allFiles[0].type.startsWith('video/') && !allFiles[0].type.startsWith('audio/') && <div className="w-full max-w-xs rounded-xl p-5 mb-4 text-center" style={{ background: t.surface + '80' }}><div className="text-3xl mb-2">📎</div><div className="text-[13px] font-medium" style={{ color: t.text }}>{dn(allFiles[0])}</div></div>}
            <DlBtn f={allFiles[0]} />
          </div>
        ) : (
          <div className="w-full max-w-md space-y-1.5">
            {allFiles.slice(0, showCount).map((f, i) => (
              <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg ${canV(f) ? 'cursor-pointer' : ''}`} style={{ background: t.surface + '80' }} onClick={() => canV(f) && openV(f)}>
                <span className="text-base flex-shrink-0">{f.type.startsWith('image/') ? '🖼️' : f.type.startsWith('video/') ? '🎬' : f.type.startsWith('audio/') ? '🎵' : '📎'}</span>
                <div className="flex-1 min-w-0"><div className="text-[11px] font-medium truncate" style={{ color: t.text }}>{dn(f)}</div><div className="text-[9px]" style={{ color: t.textMuted }}>{formatBytes(f.size)}</div></div>
                <DlBtn f={f} small />
              </div>
            ))}
            {allFiles.length > showCount && <button onClick={() => setShowCount(p => p + 5)} className="w-full h-8 rounded-lg text-[11px] font-medium" style={{ background: t.surface + '60', color: t.accent }}>Ещё {Math.min(5, allFiles.length - showCount)}</button>}
          </div>
        )}
      </main>

      {/* Footer — no border, merged */}
      {(settings.adEnabled) && (
        <div className="px-4 py-3 text-center flex-shrink-0">
          <p className="text-[9px] leading-relaxed" style={{ color: t.textMuted + 'aa', userSelect: 'text' }}>
            {showDefaultAd ? (
              <>{defaultAd}<a href={defaultAdLink} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: t.accent }}>GitHub</a></>
            ) : (
              parseLinks(adText)
            )}
          </p>
        </div>
      )}
    </div>
  );
};
