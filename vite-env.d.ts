
// Manually declared environment types since vite/client is missing
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_LIPANA_SECRET_KEY: string;
  readonly VITE_LIPANA_PUBLIC_KEY: string;
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}