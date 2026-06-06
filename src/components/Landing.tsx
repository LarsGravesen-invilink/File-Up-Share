import React, { useEffect, useState } from 'react';

interface Props {
  onLogin: () => void;
  name: string;
}

const features = [
  'Раздача файлов',
  'Приём файлов',
  'Защита паролем',
  'Лимиты скачиваний',
  'Настраиваемый дизайн',
  'Telegram уведомления',
  'Статистика',
  'Управление доступом',
];

export const Landing: React.FC<Props> = ({ onLogin, name }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setReady(true)); }, []);

  const t = (delay: number): React.CSSProperties => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
  });

  return (
    <div className="h-dvh flex flex-col bg-bg bg-grid relative overflow-hidden overflow-y-auto">
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-radial pointer-events-none" />

      {/* ─── Nav — only login button ─── */}
      <nav className="relative z-10 flex items-center justify-end px-5 sm:px-8 h-[56px]" style={t(0.05)}>
        <button
          onClick={onLogin}
          className="h-8 px-4 rounded-md bg-surface-2/80 border border-border text-[12px] font-medium text-text-secondary hover:text-accent hover:border-accent/30 active:scale-[0.97] transition-all duration-150 backdrop-blur-sm"
        >
          Войти в панель
        </button>
      </nav>

      {/* ─── Hero ─── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8">
        <div className="w-full max-w-2xl text-center">
          {/* Main title with glow */}
          <h1
            style={t(0.2)}
            className="text-[clamp(2.5rem,8vw,4.5rem)] font-bold tracking-tight leading-[1.05] mb-6 animate-glow-text text-text"
          >
            {name}
          </h1>

          <p style={t(0.35)} className="text-[15px] sm:text-base text-text-secondary leading-relaxed mb-10 max-w-md mx-auto">
            Панель управления раздачами и загрузками файлов на вашем сервере
          </p>

          {/* Placeholder for future promo button */}
          <div style={t(0.45)} className="mb-12">
            {/* Future: Link to project page */}
          </div>
        </div>

        {/* ─── Marquee / Running text ─── */}
        <div style={t(0.55)} className="w-full max-w-4xl overflow-hidden">
          <div className="relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
            
            {/* Marquee track */}
            <div className="flex animate-marquee">
              {[...features, ...features].map((f, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 mx-3 px-4 py-2 rounded-lg border border-accent/15 bg-accent/5 backdrop-blur-sm"
                >
                  <span className="text-[12px] sm:text-[13px] text-accent/80 font-medium whitespace-nowrap">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Feature cards ─── */}
        <div className="w-full max-w-2xl mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3" style={t(0.7)}>
          {([
            {
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
              title: 'Раздача файлов',
              desc: 'Страницы для скачивания с контролем доступа',
            },
            {
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
              title: 'Приём файлов',
              desc: 'Страницы загрузки от пользователей',
            },
            {
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              title: 'Безопасность',
              desc: 'Пароли, лимиты, полный контроль на VPS',
            },
          ]).map((f, i) => (
            <div key={i} className="p-4 rounded-xl glow-border bg-surface/40 backdrop-blur-sm hover:border-accent/25 hover:bg-surface/60 transition-all duration-300 group">
              <div className="text-text-muted mb-2.5 group-hover:text-accent transition-colors duration-300">{f.icon}</div>
              <div className="text-[13px] font-semibold text-text mb-1">{f.title}</div>
              <div className="text-[12px] text-text-muted leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 px-5 sm:px-8 py-4 text-center" style={t(0.85)}>
        <p className="text-[10px] text-text-muted/30">by invilink | LarsGravesen</p>
      </footer>

      {/* Marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
