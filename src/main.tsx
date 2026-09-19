import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);

void import('./App.tsx')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    root.render(
      <main className="min-h-screen bg-slate-950 p-6 text-slate-100 flex items-center justify-center">
        <section className="max-w-xl rounded-xl border border-amber-500/50 bg-slate-900 p-6 shadow-xl">
          <h1 className="text-xl font-bold text-amber-300">Không thể khởi động hệ thống</h1>
          <p className="mt-3 text-sm leading-6">Kiểm tra tệp <code>.env.local</code>: cần có các biến <code>VITE_FIREBASE_*</code>, sau đó khởi động lại máy chủ phát triển.</p>
          <pre className="mt-4 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-300">{message}</pre>
        </section>
      </main>,
    );
  });
