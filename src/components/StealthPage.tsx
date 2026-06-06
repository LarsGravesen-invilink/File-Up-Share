import React from 'react';

export const StealthPage: React.FC = () => (
  <div className="min-h-dvh flex items-center justify-center" style={{ background: '#ffffff' }}>
    <div className="text-center px-6">
      <div style={{ color: '#d4a017', fontSize: '72px', lineHeight: 1, marginBottom: '24px' }}>⚠</div>
      <h1 style={{ color: '#333333', fontSize: '22px', fontWeight: 600, margin: '0 0 8px', fontFamily: 'system-ui, sans-serif' }}>
        Страница не доступна
      </h1>
      <p style={{ color: '#999999', fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>
        Запрашиваемая страница не найдена или временно недоступна
      </p>
    </div>
  </div>
);
