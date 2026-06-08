import { useState, useEffect, useMemo } from 'react';
import { Upload, Clock, AlertTriangle, Code2 } from 'lucide-react';
import { liveCountdown } from '../helpers';
import { getTheme } from '../themes';

interface Props {
  name: string;
  logo: string;
  expiresAt: number;
  hideLifetime: boolean;
  adEnabled: boolean;
  adText: string;
  pageTheme?: string;
  children: React.ReactNode;
}

function linkify(text: string, color: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color }} className="underline underline-offset-2 transition hover:opacity-80">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PublicLayout({ name, logo, expiresAt, hideLifetime, adEnabled, adText, pageTheme, children }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => liveCountdown(expiresAt));
  const [expired, setExpired] = useState(expiresAt <= Date.now());
  const theme = useMemo(() => getTheme(pageTheme || 'default'), [pageTheme]);

  useEffect(() => {
    const update = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setExpired(true); setTimeLeft('00:00:00'); return; }
      setTimeLeft(liveCountdown(expiresAt));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [expiresAt]);

  const adContent = useMemo(() => {
    if (!adEnabled) return null;
    if (!adText) {
      return (
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span>Создано с помощью FileUpShare</span>
          <a href="https://github.com/LarsGravesen-invilink/File-Up-Share" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 transition hover:opacity-80"
            style={{ background: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: theme.accent }}>
            <Code2 className="h-3 w-3" />
            <span className="text-[9px] font-medium">GitHub</span>
          </a>
        </span>
      );
    }
    return linkify(adText, theme.accent);
  }, [adEnabled, adText, theme]);

  if (expired) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6 text-center" style={{ background: theme.bg }}>
        <div className="noise-bg" />
        <AlertTriangle className="mb-4 h-12 w-12" style={{ color: theme.accent, opacity: 0.6 }} />
        <h2 className="mb-2 text-lg font-semibold" style={{ color: theme.text }}>Срок действия истёк</h2>
        <p className="text-sm" style={{ color: theme.textMuted }}>Эта страница больше недоступна</p>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{
        background: theme.bg,
        color: theme.text,
        '--page-text': theme.text,
        '--page-text-muted': theme.textMuted,
        '--page-accent': theme.accent,
      } as React.CSSProperties}
    >
      <div className="noise-bg" style={{ opacity: theme.dark ? 0.03 : 0.015 }} />

      <header className="relative z-30 flex-shrink-0 backdrop-blur-xl" style={{ borderBottom: '1px solid ' + theme.borderColor, background: theme.dark ? theme.bg + 'e6' : theme.bg + 'e6' }}>
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="" className="h-8 w-8 rounded-lg object-cover sm:h-9 sm:w-9" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg sm:h-9 sm:w-9" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.dark ? '#8b5cf6' : theme.accent})` }}>
                <Upload className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="text-sm font-bold sm:text-base" style={{ color: theme.text }}>{name}</span>
          </div>

          {!hideLifetime && (
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3" style={{ background: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
              <Clock className="h-3 w-3 animate-countdown sm:h-3.5 sm:w-3.5" style={{ color: theme.accent, opacity: 0.6 }} />
              <span className="text-[10px] font-medium tabular-nums sm:text-xs" style={{ color: theme.textMuted }}>{timeLeft}</span>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>

      {adEnabled && (
        <footer className="relative z-30 flex-shrink-0 backdrop-blur-xl" style={{ borderTop: '1px solid ' + theme.borderColor, background: theme.dark ? theme.bg + 'e6' : theme.bg + 'e6' }}>
          <div className="px-4 py-3 text-center text-[11px] leading-relaxed sm:px-6 sm:text-xs" style={{ color: theme.textMuted }}>
            {adContent}
          </div>
        </footer>
      )}
    </div>
  );
}
