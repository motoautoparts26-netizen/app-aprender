import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Content-Security-Policy restritiva (seção 20): nenhum domínio externo.
 * Só no build: em desenvolvimento o Vite injeta scripts inline para recarga rápida.
 */
const CSP = [
  "default-src 'self'",
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

// GitHub Pages serve o app em /app-aprender/, então todo asset precisa deste base.
export default defineConfig({
  base: '/app-aprender/',
  // Converte sintaxe nova também em desenvolvimento (celulares com Chrome mais antigo).
  esbuild: { target: 'es2019' },
  build: { target: 'es2019' },
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // registro manual em main.tsx, sem script inline
      includeAssets: ['fonts/*.woff2', 'icons/*'],
      manifest: {
        name: 'Aprender: cores, letras e números',
        short_name: 'Aprender',
        lang: 'pt-BR',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#F2F2F2',
        theme_color: '#F2F2F2',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Precache de tudo: o app funciona totalmente offline depois do primeiro carregamento.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,mp3,m4a,json}'],
      },
    }),
  ],
});
