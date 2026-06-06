import React, { useState } from 'react';
import type { Settings } from '../../types';

interface Props {
  settings: Settings;
  onUpdate: (s: Partial<Settings>) => void;
  onChangeCredentials: (login: string, pass: string) => void;
  onLogout: () => void;
  botConfigured: boolean;
}

export const SecurityPage: React.FC<Props> = ({ settings, onUpdate, onChangeCredentials, onLogout, botConfigured }) => {
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credError, setCredError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [credChangeType, setCredChangeType] = useState<'login' | 'password' | 'both'>('password');
  const [saved, setSaved] = useState(false);

  const [encryptFiles, setEncryptFiles] = useState(settings.encryptFiles);
  const [sharePasswordEnabled, setSharePasswordEnabled] = useState(settings.sharePasswordEnabled);
  const [sharePassword, setSharePassword] = useState(settings.sharePassword);
  const [uploadPasswordEnabled, setUploadPasswordEnabled] = useState(settings.uploadPasswordEnabled);
  const [uploadPassword, setUploadPassword] = useState(settings.uploadPassword);
  const [stealthEnabled, setStealthEnabled] = useState(settings.stealthEnabled);



  const handleSave = () => {
    onUpdate({
      encryptFiles,
      sharePasswordEnabled,
      sharePassword,
      uploadPasswordEnabled,
      uploadPassword,
      stealthEnabled,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "w-full h-9 px-3 rounded-md bg-surface/60 border border-border text-[13px] text-text placeholder:text-text-muted/40 outline-none focus:border-accent/50 transition-all";
  const disabledInputClass = "w-full h-9 px-3 rounded-md bg-surface/20 border border-border/50 text-[13px] text-text-muted/50 outline-none cursor-not-allowed";

  return (
    <div className="space-y-4 animate-in">
      {/* Change login & password */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text mb-1 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Учётные данные
        </h3>

        <div>
          <label className="block text-[10px] text-text-muted mb-1">Новый логин</label>
          <input type="text" value={newLogin} onChange={e => { setNewLogin(e.target.value); setCredError(''); }} placeholder="Оставьте пустым, чтобы не менять" className={inputClass} autoComplete="off" />
        </div>

        <div>
          <label className="block text-[10px] text-text-muted mb-1">Новый пароль</label>
          <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setCredError(''); }} placeholder="Оставьте пустым, чтобы не менять" className={inputClass} autoComplete="new-password" />
        </div>

        {newPassword && (
          <div>
            <label className="block text-[10px] text-text-muted mb-1">Подтвердите пароль</label>
            <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setCredError(''); }} placeholder="Повторите пароль" className={inputClass} autoComplete="new-password" />
          </div>
        )}

        {credError && <p className="text-[11px] text-danger">{credError}</p>}

        <button
          onClick={() => {
            if (!newLogin && !newPassword) { setCredError('Введите логин или пароль'); return; }
            if (newPassword && newPassword.length < 6) { setCredError('Пароль минимум 6 символов'); return; }
            if (newPassword && newPassword !== confirmPassword) { setCredError('Пароли не совпадают'); return; }
            setCredChangeType(newLogin && newPassword ? 'both' : newLogin ? 'login' : 'password');
            setShowConfirmModal(true);
          }}
          disabled={!newLogin && !newPassword}
          className="w-full h-9 rounded-md bg-accent/90 text-bg text-[12px] font-medium hover:bg-accent disabled:opacity-30 transition-colors"
        >
          Изменить
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setShowConfirmModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-danger/20 bg-surface/95 backdrop-blur-xl p-5 animate-in">
            <div className="w-10 h-10 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-[14px] font-semibold text-text text-center mb-2">
              {credChangeType === 'both' ? 'Изменить логин и пароль?' : credChangeType === 'login' ? 'Изменить логин?' : 'Изменить пароль?'}
            </h3>
            <p className="text-[11px] text-text-muted text-center mb-1">
              Доступ в панель будет по новым данным.
            </p>
            <p className="text-[11px] text-danger text-center mb-5 font-medium">
              Будьте внимательны. После применения сессия завершится.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 h-9 rounded-md border border-border text-[12px] text-text-muted hover:text-text transition-colors">Отмена</button>
              <button onClick={() => {
                onChangeCredentials(newLogin, newPassword);
                setShowConfirmModal(false);
                setNewLogin('');
                setNewPassword('');
                setConfirmPassword('');
                // Logout after credentials change
                setTimeout(() => onLogout(), 500);
              }} className="flex-1 h-9 rounded-md bg-danger text-white text-[12px] font-medium hover:bg-danger/90 transition-colors">Подтвердить</button>
            </div>
          </div>
        </div>
      )}

      {/* File encryption */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4">
        <h3 className="text-[12px] font-semibold text-text mb-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Шифрование
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] text-text">Шифровать файлы</div>
            <div className="text-[10px] text-text-muted">Файлы хранятся зашифрованными</div>
          </div>
          <button
            onClick={() => setEncryptFiles(!encryptFiles)}
            className={`w-9 h-5 rounded-full relative transition-colors ${encryptFiles ? 'bg-accent' : 'bg-border'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${encryptFiles ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Global passwords */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-4">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          Глобальные пароли
        </h3>

        {/* Share password */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[11px] text-text">Пароль для раздач</div>
              <div className="text-[9px] text-text-muted">Применяется ко всем страницам раздач</div>
            </div>
            <button
              onClick={() => setSharePasswordEnabled(!sharePasswordEnabled)}
              className={`w-8 h-4 rounded-full relative transition-colors ${sharePasswordEnabled ? 'bg-accent' : 'bg-border'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${sharePasswordEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
          <input
            type="text"
            value={sharePassword}
            onChange={e => setSharePassword(e.target.value)}
            disabled={!sharePasswordEnabled}
            placeholder="Пароль"
            className={sharePasswordEnabled ? inputClass : disabledInputClass}
          />
        </div>

        {/* Upload password */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[11px] text-text">Пароль для загрузок</div>
              <div className="text-[9px] text-text-muted">Применяется ко всем страницам загрузок</div>
            </div>
            <button
              onClick={() => setUploadPasswordEnabled(!uploadPasswordEnabled)}
              className={`w-8 h-4 rounded-full relative transition-colors ${uploadPasswordEnabled ? 'bg-accent' : 'bg-border'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${uploadPasswordEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
          <input
            type="text"
            value={uploadPassword}
            onChange={e => setUploadPassword(e.target.value)}
            disabled={!uploadPasswordEnabled}
            placeholder="Пароль"
            className={uploadPasswordEnabled ? inputClass : disabledInputClass}
          />
        </div>
      </div>

      {/* Stealth mode */}
      <div className={`rounded-xl border bg-surface/30 backdrop-blur-sm p-4 space-y-3 ${botConfigured ? 'border-danger/20' : 'border-border/50 opacity-50'}`}>
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          Режим невидимки
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-text">Разрешить скрытие панели</div>
          </div>
          <button
            onClick={() => botConfigured && setStealthEnabled(!stealthEnabled)}
            disabled={!botConfigured}
            className={`w-9 h-5 rounded-full relative transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${stealthEnabled ? 'bg-danger' : 'bg-border'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${stealthEnabled ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
        <p className="text-[9px] text-text-muted leading-relaxed">
          {botConfigured
            ? 'Бот сможет скрывать панель по команде /close и восстанавливать по /open. Аварийное восстановление: команда unlock-my-panel на сервере с вводом пароля панели.'
            : 'Требуется настроенный и запущенный Telegram bot для работы этой функции.'
          }
        </p>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saved} className={`w-full h-10 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.98] ${saved ? 'bg-accent/20 text-accent border border-accent/30 opacity-60 pointer-events-none' : 'bg-accent/90 text-bg hover:bg-accent shadow-[0_0_20px_#22c55e18]'}`}>
        {saved ? '✓ Сохранено' : 'Сохранить настройки'}
      </button>
    </div>
  );
};
