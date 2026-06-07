import { useState, useEffect, useMemo } from 'react';
import { Upload, Clock } from 'lucide-react';
import { liveCountdown } from '../helpers';

interface Props {
  name: string;
  logo: string;
  expiresAt: number;
  hideLifetime: boolean;
  adEnabled: boolean;
  adText: string;
  children: React.ReactNode;
}

function linkify(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-400/80 underline underline-offset-2 transition hover:text-cyan-400">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PublicLayout({ name, logo, expiresAt, hideLifetime, adEnabled, adText, children }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => liveCountdown(expiresAt));

  useEffect(() => {
    const update = () => setTimeLeft(liveCountdown(expiresAt));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [expiresAt]);

  const adContent = useMemo(() => {
    if (!adEnabled) return null;
    const text = adText || 'Создано с помощью FileUpShare — https://github.com/LarsGravesen-invilink/File-Up-Share';
    return linkify(text);
  }, [adEnabled, adText]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0e1a]">
      <div className="noise-bg" />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[350px] w-[350px] rounded-full bg-violet-500/5 blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <header className="relative z-30 flex-shrink-0 border-b border-white/5 bg-[#0a0e1a]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="" className="h-8 w-8 rounded-lg object-cover sm:h-9 sm:w-9" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20 sm:h-9 sm:w-9">
                <Upload className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="text-sm font-bold text-white sm:text-base">{name}</span>
          </div>

          {!hideLifetime && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 sm:px-3">
              <Clock className="h-3 w-3 text-cyan-400/60 animate-countdown sm:h-3.5 sm:w-3.5" />
              <span className="text-[10px] font-medium tabular-nums text-white/40 sm:text-xs">{timeLeft}</span>
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
        <footer className="relative z-30 flex-shrink-0 border-t border-white/5 bg-[#0a0e1a]/90 backdrop-blur-xl">
          <div className="public-page-link px-4 py-2.5 text-center text-[10px] leading-relaxed text-white/20 sm:px-6 sm:text-[11px]">
            {adContent}
          </div>
        </footer>
      )}
    </div>
  );
}
