import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const [owner, repository] = (process.env.GITHUB_REPOSITORY || '').split('/');
const isUserSite = owner && repository === `${owner}.github.io`;
const base =
  process.env.GITHUB_ACTIONS === 'true' && repository && !isUserSite ? `/${repository}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
});
