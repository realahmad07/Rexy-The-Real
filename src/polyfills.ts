import { Buffer } from 'buffer';
import process from 'process';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = process;
  (window as any).global = window;

  // Patch console methods to catch circular JSON errors from external wrappers (e.g. AI Studio / DevTools)
  const patchConsole = (method: 'log' | 'warn' | 'error') => {
    const original = console[method];
    console[method] = function (...args) {
      try {
        original.apply(console, args);
      } catch (e) {
        if (e instanceof Error && e.message.toLowerCase().includes('circular')) {
          const safeArgs = args.map(arg => {
            try {
              JSON.stringify(arg);
              return arg;
            } catch (err) {
              return `[Unserializable ${arg?.constructor?.name || typeof arg}]`;
            }
          });
          original.apply(console, ["[Circular Prevented]", ...safeArgs]);
        } else {
          try {
            original.apply(console, ["[Console Error Forwarding Failed]", String(e)]);
          } catch(err2) {
             // Silently fail if even that fails
          }
        }
      }
    };
  };

  patchConsole('log');
  patchConsole('warn');
  patchConsole('error');
}

