import React, { useState, useEffect, useCallback } from 'react';

interface Props {
  firstRun: boolean;
  onRegister: (u: string, p: string) => any;
  onLogin: (u: string, p: string) => any;
  name: string;
  logo: string;
}

export const Auth: React.FC<Props> = ({ firstRun, onRegister, onLogin, name, logo }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [locked, setLocked] = useState(false);
  const [sec, setSec] = useState(0);
  const [shake, setShake] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setReady(true)); }, []);

  useEffect(() => {
    if (!locked || sec <= 0) return;
    const t = setInterval(() => setSec(s => {
      if (s <= 1) { setLocked(false); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [locked, sec]);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 450); };

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (!user.trim()) { setErr('Введите логин'); doShake(); return; }
    if (!pass.trim()) { setErr('Введите пароль'); doShake(); return; }
    if (firstRun && pass.length < 6) { setErr('Пароль минимум 6 символов'); doShake(); return; }

    setLoading(true);

    if (firstRun) {
      const reg = await onRegister(user, pass);
      if (reg && !reg.ok && reg.error) { setErr(reg.error); doShake(); }
    } else {
      if (locked) { setLoading(false); return; }
      const r = await onLogin(user, pass);
      if (!r.ok) {
        if (r.locked) { setLocked(true); setSec(r.sec || 300); setErr('Слишком много попыток'); }
        else setErr(r.error || 'Неверный логин или пароль');
        doShake();
      }
    }
    setLoading(false);
  }, [user, pass, firstRun, locked, onRegister, onLogin]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const inputClass = "w-full h-9 px-3 rounded-md bg-surface/60 border border-border text-[13px] text-text placeholder:text-text-muted/40 outline-none glow-input backdrop-blur-sm transition-all duration-200 disabled:opacity-30";

  return (
    <div className="min-h-dvh flex flex-col bg-bg bg-grid relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-vignette pointer-events-none" />



      <main className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div
          className="w-full max-w-[280px]"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.5s ease 0.1s',
            animation: shake ? 'shake 0.4s ease-in-out' : undefined,
          }}
        >
          <div className="text-center mb-6">
            <div className="animate-float mb-3">
              {logo ? (
                <img src={logo} alt="" className="w-11 h-11 mx-auto object-contain" style={{ maxWidth: '44px', maxHeight: '44px' }} />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto shadow-[0_0_20px_#22c55e12]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight animate-glow-text mb-1">{name}</h1>
            <p className="text-[11px] text-text-muted">
              {firstRun ? 'Создайте данные для входа' : 'Вход в панель управления'}
            </p>
          </div>

          {locked && (
            <div className="mb-4 p-2.5 rounded-md border border-danger/20 bg-danger/5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div>
                  <p className="text-[11px] text-danger font-medium">Заблокировано · {fmt(sec)}</p>
                </div>
              </div>
            </div>
          )}

          {firstRun && (
            <div className="mb-4 p-2.5 rounded-md border border-accent/15 bg-accent/5 backdrop-blur-sm flex items-start gap-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent mt-0.5 flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p className="text-[11px] text-text-secondary leading-relaxed">Первый запуск. Придумайте логин и надёжный пароль.</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">Логин</label>
              <input type="text" value={user} onChange={e => { setUser(e.target.value); setErr(''); }} disabled={locked || loading} autoComplete="username" className={inputClass} placeholder="admin" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => { setPass(e.target.value); setErr(''); }}
                  disabled={locked || loading}
                  autoComplete={firstRun ? 'new-password' : 'current-password'}
                  className={inputClass + ' pr-8'}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/50 hover:text-accent/70 transition-colors"
                >
                  {showPass ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {err && <p className="text-[11px] text-danger">{err}</p>}

            <button
              type="submit"
              disabled={locked || loading}
              className="w-full h-9 rounded-md bg-accent/90 text-bg text-[13px] font-semibold hover:bg-accent active:scale-[0.98] transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_15px_#22c55e18]"
            >
              {loading ? '...' : firstRun ? 'Создать' : 'Войти'}
            </button>
          </form>
        </div>
      </main>

      <footer className="relative z-10 py-3 text-center" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease 0.6s' }}>
        <p className="text-[9px] text-text-muted/25">by invilink | LarsGravesen</p>
      </footer>
    </div>
  );
};
