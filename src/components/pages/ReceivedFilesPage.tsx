import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Download, Trash2, Eye, MessageSquare, FileIcon, Image, Film, Music } from 'lucide-react';
import type { ReceivedFile } from '../../types';
import { formatBytes, formatDateTime } from '../../helpers';
import * as api from '../../api';

interface Props {
  files: ReceivedFile[];
  onRemove: (id: string) => void;
}

function getFileIcon(type: string) {
  if (type.startsWith('image')) return <Image className="h-4 w-4 text-violet-400" />;
  if (type.startsWith('video')) return <Film className="h-4 w-4 text-blue-400" />;
  if (type.startsWith('audio')) return <Music className="h-4 w-4 text-emerald-400" />;
  return <FileIcon className="h-4 w-4 text-cyan-400" />;
}

export function ReceivedFilesPage({ files, onRemove }: Props) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <FileDown className="h-4 w-4 text-violet-400" />
          Принятые файлы
          <span className="ml-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/25">{files.length}</span>
        </h3>
      </motion.div>

      {files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card flex flex-col items-center justify-center rounded-xl py-16 text-center"
        >
          <FileDown className="mb-3 h-8 w-8 text-white/10" />
          <p className="text-sm text-white/20">Нет принятых файлов</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {files.map((file, i) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card group rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                  {getFileIcon(file.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{file.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-white/20">
                    <span>{formatBytes(file.size)}</span>
                    <span>·</span>
                    <span>{formatDateTime(file.receivedAt)}</span>
                    <span>·</span>
                    <span className="text-white/30">{file.source}</span>
                  </div>
                  {file.comment && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-white/25">
                      <MessageSquare className="h-3 w-3" />
                      {file.comment}
                    </div>
                  )}
                </div>

                <div className="flex flex-shrink-0 gap-1">
                  <a
                    href={api.getReceivedViewUrl(file.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-white/20 transition active:scale-90 hover:bg-white/5 hover:text-violet-400"
                    title="Посмотреть"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={api.getReceivedDownloadUrl(file.id)}
                    className="rounded-lg p-2 text-white/20 transition active:scale-90 hover:bg-white/5 hover:text-cyan-400"
                    title="Скачать"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => onRemove(file.id)}
                    className="rounded-lg p-2 text-white/20 transition active:scale-90 hover:bg-red-500/10 hover:text-red-400"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
