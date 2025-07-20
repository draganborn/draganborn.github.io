import { defineConfig } from 'vite';
import pugTransformer from 'vite-plugin-pug-transformer';

export default defineConfig({
  root: 'src',
  plugins: [pugTransformer()],
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    open: true
  }
});
