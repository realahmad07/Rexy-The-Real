import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ""),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ""),
      'process.env.VITE_HELIUS_API_KEY': JSON.stringify(env.VITE_HELIUS_API_KEY || process.env.VITE_HELIUS_API_KEY || ""),
      'process.env.VITE_TREASURY_ADDRESS': JSON.stringify(env.VITE_TREASURY_ADDRESS || process.env.VITE_TREASURY_ADDRESS || ""),
      global: 'globalThis',
    },
    optimizeDeps: {
      include: [
        '@solana/web3.js',
        '@solana/wallet-adapter-react',
        '@solana/wallet-adapter-react-ui',
        'framer-motion',
        'buffer',
        'lucide-react'
      ],
      esbuildOptions: {
        target: 'esnext',
        define: {
          global: 'globalThis'
        }
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
