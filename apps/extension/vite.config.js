import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import tailwindcss from '@tailwindcss/vite';
// export default defineConfig({
//   plugins: [
//     react(),
//     webExtension({
//       manifest: "src/manifest.json",
//       disableAutoLaunch: true
//     }),
//     tailwindcss(),
//   ],
//    build: {
//     rollupOptions: {
//       input: {
//         main: resolve(__dirname, 'index.html'),
//         // --- FIX THE TYPOS ON THE LINES BELOW ---
//         background: resolve(__dirname, 'src/background.ts'), // Change .js to .ts
//         content: resolve(__dirname, 'src/content.ts'),       // Change .js to .ts
//         // ----------------------------------------
//       },
//       output: {
//         // ... the rest of your output config is correct ...
//         inlineDynamicImports: false,
//         format: 'es',
//         entryFileNames: `[name].js`,
//         chunkFileNames: `[name].js`,
//         assetFileNames: `[name].[ext]`,
//       }
//     }
//   }
// })
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(),
        webExtension({
            manifest: "src/manifest.json",
            disableAutoLaunch: true
        }),
        tailwindcss(),],
});
// import { resolve } from 'path'
// import { fileURLToPath, URL } from 'node:url'
// const __dirname = fileURLToPath(new URL('.', import.meta.url));
// export default defineConfig({
//   plugins: [
//     react(),  tailwindcss(),
//     webExtension({
//       manifest: "src/manifest.json",
//     }),
//   ],
//   build: {
//     rollupOptions: {
//       input: {
//         sidepanel: resolve(__dirname, 'public/sidepanel.html'),
//         content: resolve(__dirname, 'src/content.ts'),
//       },
//     },
//   },
// })
