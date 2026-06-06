import React, { useState } from 'react';
import type { ShareItem } from '../../types';
import { formatBytes, buildShareUrl } from '../../types';
import type { Page } from '../Sidebar';

interface Props {
  shares: ShareItem[];
  onRemove: (id: string) => void;
  onNavigate: (p: Page) => void;
  onPreview: (item: ShareItem) => void;
}

export const MySharesPage: React.FC<Props> = ({ shares, onRemove, onNavigate, onPreview }) => {
  const [extending, setExtending] = useState<string | null>(null);

  const getTimeLeft = (item: ShareItem) => {
    if (!item.lifetimeEnabled) return '∞';
    const totalMs = (item.lifetimeHours * 60 + item.lifetimeMinutes) * 60 * 1000;
    const elapsed = Date.now() - item.createdAt;
    const remaining = totalMs - elapsed;
    if (remaining <= 0) return 'Истекло';
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
  };

  const copyText = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  };

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const url = buildShareUrl(id);
    copyText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleShare = (id: string) => {
    const url = buildShareUrl(id);
    navigator.share({ title: 'С Вами поделились файлом', url }).catch(() => {});
  };

  return (
    <div className="space-y-3 animate-in">
      {shares.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">📂</div>
          <p className="text-[13px] text-text-muted mb-1">Нет активных раздач</p>
          <button onClick={() => onNavigate('create-share')} className="text-[11px] text-accent hover:text-accent-hover transition-colors mt-1">
            Создать раздачу
          </button>
        </div>
      ) : (
        shares.map(item => (
          <div key={item.id} className="rounded-xl border border-accent/10 bg-surface/30 backdrop-blur-sm overflow-hidden hover-tilt">
            <div className="p-4">
              <div className="text-[13px] font-medium text-text truncate mb-1">
                {item.title || (item.hideExtension ? item.fileName.replace(/\.[^/.]+$/, '') : item.fileName)}
              </div>
              <div className="text-[10px] text-text-muted mb-3">
                {formatBytes(item.fileSize)} · {getTimeLeft(item)}
                {item.password && <span className="ml-1">🔒</span>}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => handleCopyLink(item.id)} className={`h-6 px-2 rounded text-[9px] font-medium transition-colors flex items-center gap-1 ${copied === item.id ? 'bg-accent/30 text-accent' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}>
                  {copied === item.id ? '✓' : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                  {copied === item.id ? 'Скопировано' : 'Ссылка'}
                </button>
                {canShare && (
                  <button onClick={() => handleShare(item.id)} className="h-6 px-2 rounded bg-accent/10 text-[9px] text-accent font-medium hover:bg-accent/20 active:scale-[0.97] transition-all flex items-center gap-1">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Отправить
                  </button>
                )}
                <button onClick={() => setExtending(extending === item.id ? null : item.id)} className="h-6 px-2 rounded bg-accent/10 text-[9px] text-accent font-medium hover:bg-accent/20 transition-colors flex items-center gap-1">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  +Время
                </button>
                <button onClick={() => onPreview(item)} className="h-6 px-2 rounded bg-accent/10 text-[9px] text-accent font-medium hover:bg-accent/20 transition-colors flex items-center gap-1">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Вид
                </button>
                <button onClick={() => onRemove(item.id)} className="h-6 w-6 rounded bg-danger/10 flex items-center justify-center text-danger hover:bg-danger/20 transition-colors ml-auto">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>

              {extending === item.id && (
                <ExtendModal onClose={() => setExtending(null)} />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const ExtendModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [h, setH] = useState('');
  const [m, setM] = useState('');

  return (
    <div className="mt-3 p-3 rounded-lg bg-bg/50 border border-accent/15 animate-in">
      <div className="text-[11px] text-text-secondary mb-2">Продлить на</div>
      <div className="flex items-center gap-2">
        <input type="text" inputMode="numeric" value={h} onChange={e => setH(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0" className="w-14 h-8 px-2 rounded-md bg-surface/60 border border-border text-[12px] text-text text-center outline-none focus:border-accent/50 transition-all" />
        <span className="text-[10px] text-text-muted">ч</span>
        <input type="text" inputMode="numeric" value={m} onChange={e => setM(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="0" className="w-14 h-8 px-2 rounded-md bg-surface/60 border border-border text-[12px] text-text text-center outline-none focus:border-accent/50 transition-all" />
        <span className="text-[10px] text-text-muted">м</span>
        <button className="h-8 px-3 rounded-md bg-accent text-bg text-[11px] font-medium hover:bg-accent/90 transition-colors ml-auto" onClick={onClose}>
          ОК
        </button>
        <button className="h-8 px-2 rounded-md border border-border text-[11px] text-text-muted hover:text-text transition-colors" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};
