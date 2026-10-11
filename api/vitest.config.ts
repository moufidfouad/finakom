import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    env: {
      DATABASE_URL: 'postgresql://user:password@localhost:5432/test_db',
      JWT_ACCESS_SECRET: 'test-access-secret-for-vitest-only',
      JWT_REFRESH_SECRET: 'test-refresh-secret-for-vitest-only',
    },
  },
});
