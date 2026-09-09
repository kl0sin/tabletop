import { defineConfig } from 'vitest/config';

const page = (relative: string) => new URL(relative, import.meta.url).pathname;

export default defineConfig({
  base: '/tabletop/',
  build: {
    rolldownOptions: {
      input: {
        dashboard: page('index.html'),
        picker: page('picker/index.html'),
        flip7: page('flip7/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
