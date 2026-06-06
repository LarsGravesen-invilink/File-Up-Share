import React from 'react';

interface Props {
  installed?: string;
  updated?: string;
}

export const AboutPage: React.FC<Props> = ({ installed, updated }) => (
  <div className="space-y-4 animate-in">
    <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-5 text-center">
      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </div>
      <h2 className="text-base font-bold text-text mb-1">FileUpShare</h2>
      <p className="text-[11px] text-text-muted mb-4">Панель управления раздачами и загрузками файлов</p>
      <div className="text-[10px] text-text-muted/60">by LarsGravesen</div>
    </div>

    <div className="flex gap-2">
      <a href="https://t.me/larswall" target="_blank" rel="noopener noreferrer" className="flex-1 h-10 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 flex items-center justify-center gap-2 text-[11px] text-[#229ED9] font-medium hover:bg-[#229ED9]/20 active:scale-[0.97] transition-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
        Telegram
      </a>
      <a href="https://github.com/LarsGravesen-invilink/File-Up-Share" target="_blank" rel="noopener noreferrer" className="flex-1 h-10 rounded-xl bg-text/5 border border-text/10 flex items-center justify-center gap-2 text-[11px] text-text-muted font-medium hover:bg-text/10 active:scale-[0.97] transition-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
        GitHub
      </a>
    </div>

    <a href="https://pay.cloudtips.ru/p/6bba08e1" target="_blank" rel="noopener noreferrer" className="block h-10 rounded-xl bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 flex items-center justify-center gap-2 text-[11px] text-[#ff6b6b] font-medium hover:bg-[#ff6b6b]/20 active:scale-[0.97] transition-all">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      Поддержать проект
    </a>

    <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-2">
      <div className="flex justify-between text-[10px]">
        <span className="text-text-muted">Версия</span>
        <span className="text-text font-mono">1.0.1</span>
      </div>
      {installed && (
        <div className="flex justify-between text-[10px]">
          <span className="text-text-muted">Установлена</span>
          <span className="text-text font-mono">{installed}</span>
        </div>
      )}
      {updated && (
        <div className="flex justify-between text-[10px]">
          <span className="text-text-muted">Обновлена</span>
          <span className="text-text font-mono">{updated}</span>
        </div>
      )}
    </div>
  </div>
);
