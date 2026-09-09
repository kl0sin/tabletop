import { defineConfig } from 'vitest/config';

const page = (relative: string) => new URL(relative, import.meta.url).pathname;

export default defineConfig({
  base: '/tabletop/',
  build: {
    rolldownOptions: {
      input: {
        dashboard: page('index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
