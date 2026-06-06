import React from 'react';
import type { ReceivedFile } from '../../preview/store';
import { formatBytes } from '../../preview/store';

interface Props {
  files: ReceivedFile[];
  onRemove: (id: string) => void;
}

const fmtTime = (ts: number) => {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return 'Только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const fileEmoji = (type: string) => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '📦';
  if (type.includes('text')) return '📝';
  return '📎';
};

export const ReceivedFilesPage: React.FC<Props> = ({ files, onRemove }) => {
  const handleDownload = (file: ReceivedFile) => {
    const link = document.createElement('a');
    link.href = file.fileData;
    link.download = file.fileName;
    link.click();
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12 animate-in">
        <div className="text-3xl mb-3">📨</div>
        <p className="text-[13px] text-text-muted">Нет принятых файлов</p>
        <p className="text-[10px] text-text-muted/60 mt-1">Файлы появятся после загрузки через страницы загрузок</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in">
      <div className="text-[10px] text-text-muted mb-2">{files.length} файл(ов)</div>

      {files.map(file => (
        <div key={file.id} className="rounded-xl border border-accent/10 bg-surface/30 backdrop-blur-sm p-3.5 hover-tilt">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center text-base flex-shrink-0">
              {fileEmoji(file.fileType)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-text truncate">{file.fileName}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                <span className="text-[10px] text-text-muted">{formatBytes(file.fileSize)}</span>
                <span className="text-[10px] text-text-muted">{fmtTime(file.receivedAt)}</span>
                <span className="text-[10px] text-text-muted/60">{file.uploadPageTitle || 'Загрузка'}</span>
              </div>
              {file.userComment && (
                <div className="mt-1.5 px-2 py-1 rounded bg-bg/50 border border-border/50">
                  <p className="text-[10px] text-text-muted italic">«{file.userComment}»</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleDownload(file)}
                className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/25 transition-colors"
                title="Скачать"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              <button
                onClick={() => onRemove(file.id)}
                className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-danger hover:border-danger/25 transition-colors"
                title="Удалить"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
