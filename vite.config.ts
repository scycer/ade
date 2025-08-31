import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tanstackStart from '@tanstack/start-vite-plugin';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tanstackStart(),
    react(),
    viteTsconfigPaths(),
  ],
});