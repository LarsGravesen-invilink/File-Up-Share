import React, { useState } from 'react';
import type { UploadPage as UploadPageType } from '../../types';
import type { Page } from '../Sidebar';

interface Props {
  uploads: UploadPageType[];
  onRemove: (id: string) => void;
  onNavigate: (p: Page) => void;
  onPreview: (item: UploadPageType) => void;
}

export const MyUploadsPage: React.FC<Props> = ({ uploads, onRemove, onNavigate, onPreview }) => {
  const [extending, setExtending] = useState<string | null>(null);

  const getTimeLeft = (item: UploadPageType) => {
    if (!item.lifetimeEnabled) return '∞';
    const totalMs = (item.lifetimeHours * 60 + item.lifetimeMinutes) * 60 * 1000;
    const remaining = totalMs - (Date.now() - item.createdAt);
    if (remaining <= 0) return 'Истекло';
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
  };

  const getUploadUrl = (id: string) => btoa(id);

  const handleCopyLink = (id: string) => {
    const url = window.location.origin + '/u/' + getUploadUrl(id);
    navigator.clipboard?.writeText(url).catch(() => {});
  };

  const handleShare = (id: string) => {
    const url = window.location.origin + '/u/' + getUploadUrl(id);
    const text = 'Вас просят загрузить файл';
    if (navigator.share) {
      navigator.share({ title: text, text: text + '\n' + url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text + '\n' + url).catch(() => {});
    }
  };

  return (
    <div className="space-y-3 animate-in">
      {uploads.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">📥</div>
          <p className="text-[13px] text-text-muted mb-1">Нет страниц загрузки</p>
          <button onClick={() => onNavigate('create-upload')} className="text-[11px] text-accent hover:text-accent-hover transition-colors mt-1">
            Создать загрузку
          </button>
        </div>
      ) : (
        uploads.map(item => (
          <div key={item.id} className="rounded-xl border border-accent/10 bg-surface/30 backdrop-blur-sm overflow-hidden hover-tilt">
            <div className="p-4">
              <div className="text-[13px] font-medium text-text truncate mb-1">
                {item.title || 'Загрузка #' + item.id.slice(0, 6)}
              </div>
              <div className="text-[10px] text-text-muted mb-3">
                {item.currentUploads}/{item.maxUploads} загрузок · {item.maxFiles} файл(а) за раз · {getTimeLeft(item)}
                {item.password && <span className="ml-1">🔒</span>}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => handleCopyLink(item.id)} className="h-7 px-2.5 rounded-md border border-border text-[10px] text-text-muted hover:text-text hover:border-border-light transition-colors flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Ссылка
                </button>
                <button onClick={() => handleShare(item.id)} className="h-7 px-2.5 rounded-md border border-border text-[10px] text-text-muted hover:text-text hover:border-border-light transition-colors flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Поделиться
                </button>
                <button onClick={() => setExtending(extending === item.id ? null : item.id)} className="h-7 px-2.5 rounded-md border border-border text-[10px] text-text-muted hover:text-text hover:border-border-light transition-colors flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Продлить
                </button>
                <button onClick={() => onPreview(item)} className="h-7 px-2.5 rounded-md border border-border text-[10px] text-text-muted hover:text-text hover:border-border-light transition-colors flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Открыть
                </button>
                <button onClick={() => onRemove(item.id)} className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-danger hover:border-danger/25 transition-colors ml-auto">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>

              {extending === item.id && (
                <div className="mt-3 p-3 rounded-lg bg-bg/50 border border-accent/15 animate-in">
                  <div className="text-[11px] text-text-secondary mb-2">Продлить на</div>
                  <div className="flex items-center gap-2">
                    <input type="text" inputMode="numeric" placeholder="0" className="w-14 h-8 px-2 rounded-md bg-surface/60 border border-border text-[12px] text-text text-center outline-none focus:border-accent/50 transition-all" onChange={e => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4))} />
                    <span className="text-[10px] text-text-muted">ч</span>
                    <input type="text" inputMode="numeric" placeholder="0" className="w-14 h-8 px-2 rounded-md bg-surface/60 border border-border text-[12px] text-text text-center outline-none focus:border-accent/50 transition-all" onChange={e => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2))} />
                    <span className="text-[10px] text-text-muted">м</span>
                    <button className="h-8 px-3 rounded-md bg-accent text-bg text-[11px] font-medium hover:bg-accent/90 transition-colors ml-auto" onClick={() => setExtending(null)}>
                      ОК
                    </button>
                    <button className="h-8 px-2 rounded-md border border-border text-[11px] text-text-muted hover:text-text transition-colors" onClick={() => setExtending(null)}>
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
