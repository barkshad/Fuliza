
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for dependencies or legacy usage
      'process.env': {
        ...process.env,
        API_KEY: env.API_KEY,
        VITE_LIPANA_SECRET_KEY: env.VITE_LIPANA_SECRET_KEY,
        VITE_LIPANA_PUBLIC_KEY: env.VITE_LIPANA_PUBLIC_KEY,
        VITE_CLOUDINARY_CLOUD_NAME: env.VITE_CLOUDINARY_CLOUD_NAME,
        VITE_CLOUDINARY_API_KEY: env.VITE_CLOUDINARY_API_KEY,
        VITE_CLOUDINARY_API_SECRET: env.VITE_CLOUDINARY_API_SECRET
      }
    }
  };
});