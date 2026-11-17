import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths work both at the domain root and in a GitHub Pages repository path.
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});
