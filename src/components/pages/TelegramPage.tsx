import React, { useState } from 'react';
import type { Settings } from '../../types';

interface Props {
  settings: Settings;
  onUpdate: (s: Partial<Settings>) => void;
}

type Dest = 'chat' | 'channel' | 'private';

const fmtTime = (raw: string): string => {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0, 2) + ':' + d.slice(2);
};

const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <button onClick={onChange} className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${on ? 'bg-accent' : 'bg-border'}`}>
    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${on ? 'left-[18px]' : 'left-0.5'}`} />
  </button>
);

const inputCls = "w-full h-9 px-3 rounded-md bg-surface/60 border border-border text-[13px] text-text placeholder:text-text-muted/40 outline-none focus:border-accent/50 transition-all";
const disabledCls = "w-full h-9 px-3 rounded-md bg-surface/20 border border-border/50 text-[13px] text-text-muted/50 outline-none cursor-not-allowed";

/* ─── Telegram message preview component ─── */
const TgMsg: React.FC<{ children: React.ReactNode; buttons?: Array<{ label: string; danger?: boolean }> }> = ({ children, buttons }) => (
  <div className="rounded-lg bg-[#1b2836] border border-[#2a3a4a] overflow-hidden my-2">
    <div className="px-3 py-2.5 text-[11px] text-[#d4dee8] leading-relaxed whitespace-pre-line">{children}</div>
    {buttons && buttons.length > 0 && (
      <div className="border-t border-[#2a3a4a] flex flex-col">
        {buttons.map((b, i) => (
          <button key={i} className={`h-9 text-[12px] font-medium transition-colors border-t border-[#2a3a4a] first:border-t-0 ${b.danger ? 'text-[#ff6b6b] hover:bg-[#ff6b6b10]' : 'text-[#64b5f6] hover:bg-[#64b5f610]'}`}>
            {b.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

const TgBold: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-semibold text-[#e8f0f8]">{children}</span>;
const TgLink: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="text-[#64b5f6] underline cursor-pointer">{children}</span>;
const TgMuted: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="text-[#7a8a9a]">{children}</span>;

export const TelegramPage: React.FC<Props> = ({ settings, onUpdate }) => {
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState('');
  const [dest, setDest] = useState<Dest>('chat');
  const [chatId, setChatId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [useManualId, setUseManualId] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreviews, setShowPreviews] = useState(false);

  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietFrom, setQuietFrom] = useState('23:00');
  const [quietTo, setQuietTo] = useState('08:00');

  const [summaryEnabled, setSummaryEnabled] = useState(false);
  const [summaryTime, setSummaryTime] = useState('09:00');

  const [notifyShare, setNotifyShare] = useState(true);
  const [notifyUpload, setNotifyUpload] = useState(true);
  const [notifyReceived, setNotifyReceived] = useState(true);
  const [notifyService, setNotifyService] = useState(true);

  const [pollInterval, setPollInterval] = useState(settings.botPollInterval.toString());
  const [pollUnit, setPollUnit] = useState<'sec' | 'min'>(settings.botPollUnit);

  const isConfigured = token.length > 10;
  const status = !isConfigured ? 'Не настроен' : enabled ? 'Запущен' : 'Остановлен';
  const statusColor = !isConfigured ? 'text-text-muted' : enabled ? 'text-accent' : 'text-danger';

  const handleSave = () => {
    onUpdate({ botPollInterval: parseInt(pollInterval) || 3, botPollUnit: pollUnit });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Status */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${enabled && isConfigured ? 'bg-accent/10 border-accent/20' : 'bg-surface-2/50 border-border'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={enabled && isConfigured ? 'text-accent' : 'text-text-muted'}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-medium text-text">Telegram bot</div>
              <div className={`text-[10px] font-medium ${statusColor}`}>{status}</div>
            </div>
          </div>
          <Toggle on={enabled} onChange={() => setEnabled(!enabled)} />
        </div>
      </div>

      {/* Connection */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-4">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Подключение
        </h3>
        <div>
          <label className="block text-[10px] text-text-muted mb-1">Токен бота</label>
          <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="123456789:ABCdefGHI..." className={inputCls + ' font-mono text-[11px]'} />
          <p className="text-[9px] text-text-muted/50 mt-1">Получите у @BotFather</p>
        </div>

        <div>
          <label className="block text-[10px] text-text-muted mb-1.5">Куда отправлять</label>
          <div className="flex rounded-md border border-border overflow-hidden">
            {([{ id: 'chat' as Dest, label: 'Бот-чат' }, { id: 'channel' as Dest, label: 'Канал' }, { id: 'private' as Dest, label: 'Личные' }]).map(d => (
              <button key={d.id} onClick={() => setDest(d.id)} className={`flex-1 h-9 text-[11px] font-medium transition-colors ${dest === d.id ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text'}`}>{d.label}</button>
            ))}
          </div>
        </div>

        {dest === 'chat' && (
          <div>
            <label className="block text-[10px] text-text-muted mb-1">Chat ID</label>
            <input type="text" value={chatId} onChange={e => setChatId(e.target.value)} placeholder="123456789" className={inputCls + ' font-mono text-[11px]'} />
            <p className="text-[9px] text-text-muted/50 mt-1">Напишите боту /start, затем @userinfobot</p>
          </div>
        )}
        {dest === 'channel' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-text-muted">{useManualId ? 'ID канала' : 'Имя канала'}</label>
              <button onClick={() => setUseManualId(!useManualId)} className="text-[9px] text-accent/70 hover:text-accent">{useManualId ? 'По имени' : 'По ID'}</button>
            </div>
            <input type="text" value={channelId} onChange={e => setChannelId(e.target.value)} placeholder={useManualId ? '-1001234567890' : '@my_channel'} className={inputCls + ' font-mono text-[11px]'} />
            <p className="text-[9px] text-text-muted/50 mt-1">{useManualId ? 'Числовой ID (начинается с -100)' : 'Бот должен быть админом канала'}</p>
          </div>
        )}
        {dest === 'private' && (
          <div>
            <label className="block text-[10px] text-text-muted mb-1">User ID</label>
            <input type="text" value={chatId} onChange={e => setChatId(e.target.value)} placeholder="123456789" className={inputCls + ' font-mono text-[11px]'} />
          </div>
        )}
      </div>

      {/* Monitoring */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Мониторинг
        </h3>
        <div>
          <div className="text-[11px] text-text mb-1.5">Интервал проверки файлов</div>
          <div className="flex items-center gap-1.5">
            <input type="text" inputMode="numeric" value={pollInterval} onChange={e => setPollInterval(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="3" className={inputCls + ' w-12 text-center text-[12px]'} />
            <div className="flex rounded-md border border-border overflow-hidden flex-shrink-0">
              <button onClick={() => setPollUnit('sec')} className={`px-2 h-9 text-[10px] font-medium transition-colors ${pollUnit === 'sec' ? 'bg-accent/15 text-accent' : 'text-text-muted'}`}>сек</button>
              <button onClick={() => setPollUnit('min')} className={`px-2 h-9 text-[10px] font-medium transition-colors ${pollUnit === 'min' ? 'bg-accent/15 text-accent' : 'text-text-muted'}`}>мин</button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Уведомления
          </h3>
          <button onClick={() => setShowPreviews(!showPreviews)} className="text-[9px] text-accent/70 hover:text-accent transition-colors">
            {showPreviews ? 'Скрыть превью' : 'Показать превью'}
          </button>
        </div>

        {/* Share notification */}
        <div>
          <div className="flex items-center justify-between py-0.5">
            <div><div className="text-[11px] text-text">Новая раздача</div><div className="text-[9px] text-text-muted">При создании раздачи</div></div>
            <Toggle on={notifyShare} onChange={() => setNotifyShare(!notifyShare)} />
          </div>
          {showPreviews && notifyShare && (
            <TgMsg buttons={[{ label: '🔗 Скопировать ссылку' }, { label: '🗑 Очистить', danger: true }]}>
              <TgBold>📤 Создана новая раздача</TgBold>{'\n\n'}
              <TgMuted>Файл:</TgMuted> {'photo_2025.jpg'}{'\n'}
              <TgMuted>Ссылка:</TgMuted> <TgLink>{'https://example.com/s/YWJj...'}</TgLink>{'\n'}
              <TgMuted>Время жизни:</TgMuted> {'24ч 0м'}{'\n'}
              <TgMuted>Создано:</TgMuted> {'15.01.2025 14:32'}
            </TgMsg>
          )}
        </div>

        {/* Upload notification */}
        <div>
          <div className="flex items-center justify-between py-0.5">
            <div><div className="text-[11px] text-text">Новая загрузка</div><div className="text-[9px] text-text-muted">При создании страницы загрузки</div></div>
            <Toggle on={notifyUpload} onChange={() => setNotifyUpload(!notifyUpload)} />
          </div>
          {showPreviews && notifyUpload && (
            <TgMsg buttons={[{ label: '🔗 Скопировать ссылку' }, { label: '🗑 Очистить', danger: true }]}>
              <TgBold>📥 Создана новая загрузка</TgBold>{'\n\n'}
              <TgMuted>Название:</TgMuted> {'Загрузите отчёты'}{'\n'}
              <TgMuted>Ссылка:</TgMuted> <TgLink>{'https://example.com/u/eHl6...'}</TgLink>{'\n'}
              <TgMuted>Лимит:</TgMuted> {'1 файл, 1 загрузка'}{'\n'}
              <TgMuted>Создано:</TgMuted> {'15.01.2025 14:35'}
            </TgMsg>
          )}
        </div>

        {/* Received file notification */}
        <div>
          <div className="flex items-center justify-between py-0.5">
            <div><div className="text-[11px] text-text">Принятый файл</div><div className="text-[9px] text-text-muted">Когда загружен новый файл</div></div>
            <Toggle on={notifyReceived} onChange={() => setNotifyReceived(!notifyReceived)} />
          </div>
          {showPreviews && notifyReceived && (
            <TgMsg buttons={[{ label: '📦 Получить файл' }, { label: '🗑 Очистить', danger: true }]}>
              <TgBold>📎 Загружен новый файл</TgBold>{'\n\n'}
              <TgMuted>Файл:</TgMuted> {'report_Q4.pdf'}{'\n'}
              <TgMuted>Размер:</TgMuted> {'2.4 МБ'}{'\n'}
              <TgMuted>Формат:</TgMuted> {'PDF'}{'\n'}
              <TgMuted>Комментарий:</TgMuted> {'Отчёт за квартал'}{'\n'}
              <TgMuted>Загружено:</TgMuted> {'15.01.2025 15:10'}{'\n'}
              <TgMuted>Страница:</TgMuted> {'Загрузите отчёты'}
            </TgMsg>
          )}
        </div>

        {/* Service notifications */}
        <div>
          <div className="flex items-center justify-between py-0.5">
            <div><div className="text-[11px] text-text">Служебные</div><div className="text-[9px] text-text-muted">Обновления, место, система</div></div>
            <Toggle on={notifyService} onChange={() => setNotifyService(!notifyService)} />
          </div>
          {showPreviews && notifyService && (
            <div className="space-y-2 mt-2">
              <div className="text-[9px] text-text-muted/50 px-1">Доступно обновление:</div>
              <TgMsg buttons={[{ label: '⬆️ Обновить панель' }, { label: '🗑 Очистить', danger: true }]}>
                <TgBold>🔄 Доступно обновление панели</TgBold>{'\n\n'}
                <TgMuted>Текущая:</TgMuted> {'1.0.1'}{'\n'}
                <TgMuted>Доступна:</TgMuted> {'1.1.0'}{'\n'}
                <TgMuted>Изменения:</TgMuted> {'Исправления, новые функции'}
              </TgMsg>

              <div className="text-[9px] text-text-muted/50 px-1">Панель обновлена:</div>
              <TgMsg buttons={[{ label: '🗑 Очистить', danger: true }]}>
                <TgBold>✅ Панель обновлена и запущена</TgBold>{'\n\n'}
                <TgMuted>Версия:</TgMuted> {'1.1.0 (stable)'}{'\n'}
                <TgMuted>Время:</TgMuted> {'15.01.2025 16:00'}
              </TgMsg>

              <div className="text-[9px] text-text-muted/50 px-1">Мало места:</div>
              <TgMsg buttons={[{ label: '⚙️ Настройки квоты' }, { label: '🗑 Очистить', danger: true }]}>
                <TgBold>⚠️ Заканчивается место на диске</TgBold>{'\n\n'}
                <TgMuted>Занято:</TgMuted> {'49.5 ГБ / 50 ГБ'}{'\n'}
                <TgMuted>Осталось:</TgMuted> {'~500 МБ'}{'\n\n'}
                {'Удалите ненужные файлы или увеличьте квоту'}
              </TgMsg>

              <div className="text-[9px] text-text-muted/50 px-1">Время покоя:</div>
              <TgMsg buttons={[{ label: '🗑 Очистить', danger: true }]}>
                <TgBold>🌙 Установлено время покоя</TgBold>{'\n\n'}
                <TgMuted>Интервал:</TgMuted> {'23:00 — 08:00'}{'\n\n'}
                {'Уведомления в это время отправляться не будут'}
              </TgMsg>

              <div className="text-[9px] text-text-muted/50 px-1">Время сводки:</div>
              <TgMsg buttons={[{ label: '🗑 Очистить', danger: true }]}>
                <TgBold>📋 Установлено новое время сводки</TgBold>{'\n\n'}
                <TgMuted>Отправка в:</TgMuted> {'09:00 ежедневно'}
              </TgMsg>
            </div>
          )}
        </div>
      </div>

      {/* Quiet hours */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          Время покоя
        </h3>
        <div className="flex items-center justify-between">
          <div><div className="text-[11px] text-text">Не беспокоить</div><div className="text-[9px] text-text-muted">Без уведомлений в это время</div></div>
          <Toggle on={quietEnabled} onChange={() => setQuietEnabled(!quietEnabled)} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[9px] text-text-muted mb-1">С</label>
            <input type="text" inputMode="numeric" value={quietFrom} onChange={e => setQuietFrom(fmtTime(e.target.value))} disabled={!quietEnabled} placeholder="23:00" maxLength={5} className={(quietEnabled ? inputCls : disabledCls) + ' text-center'} />
          </div>
          <div className="flex-1">
            <label className="block text-[9px] text-text-muted mb-1">До</label>
            <input type="text" inputMode="numeric" value={quietTo} onChange={e => setQuietTo(fmtTime(e.target.value))} disabled={!quietEnabled} placeholder="08:00" maxLength={5} className={(quietEnabled ? inputCls : disabledCls) + ' text-center'} />
          </div>
        </div>
      </div>

      {/* Daily summary */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Ежедневная сводка
        </h3>
        <div className="flex items-center justify-between">
          <div><div className="text-[11px] text-text">Отправлять сводку</div><div className="text-[9px] text-text-muted">Статистика за сутки</div></div>
          <Toggle on={summaryEnabled} onChange={() => setSummaryEnabled(!summaryEnabled)} />
        </div>
        <div className="w-32">
          <label className="block text-[9px] text-text-muted mb-1">Время</label>
          <input type="text" inputMode="numeric" value={summaryTime} onChange={e => setSummaryTime(fmtTime(e.target.value))} disabled={!summaryEnabled} placeholder="09:00" maxLength={5} className={(summaryEnabled ? inputCls : disabledCls) + ' text-center'} />
        </div>
        {summaryEnabled && (
          <TgMsg buttons={[{ label: '🗑 Очистить', danger: true }]}>
            <TgBold>📊 Ежедневная сводка</TgBold>{'\n\n'}
            <TgMuted>Период:</TgMuted> {'14.01 — 15.01.2025'}{'\n\n'}
            {'📤 Раздач создано: 3'}{'\n'}
            {'📥 Загрузок создано: 2'}{'\n'}
            {'📎 Файлов получено: 7'}{'\n\n'}
            {'💾 Занято: 2.40 ГБ / 50.00 ГБ'}{'\n'}
            {'📁 Всего файлов: 156'}{'\n'}
            {'💚 Свободно: 47.60 ГБ'}
          </TgMsg>
        )}
      </div>

      {/* Save */}
      <button onClick={handleSave} className={`w-full h-10 rounded-lg text-[13px] font-semibold transition-all ${saved ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-accent/90 text-bg hover:bg-accent shadow-[0_0_20px_#22c55e18]'}`}>
        {saved ? '✓ Сохранено' : 'Сохранить настройки'}
      </button>
    </div>
  );
};
