import { defineConfig } from 'vite';
import pugTransformer from 'vite-plugin-pug-transformer';

export default defineConfig({
  base: '/draganborn/',
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
