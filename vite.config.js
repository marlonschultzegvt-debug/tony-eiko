import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'cruel-ties-beg.loca.lt',
      'plasma-twice-css-admissions.trycloudflare.com',
    ],
  },
});
