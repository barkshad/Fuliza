
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      'process.env': {
        ...process.env,
        // Inject keys from environment variables (e.g., .env file)
        LIPANA_PUBLISHABLE_KEY: env.LIPANA_PUBLISHABLE_KEY,
        LIPANA_SECRET_KEY: env.LIPANA_SECRET_KEY,
        API_KEY: env.API_KEY
      }
    }
  };
});
