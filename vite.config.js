export default defineConfig({
  build: {
    outDir: 'dist', // ← важно
  },
  // Если сайт на корне (не в подпапке)
  base: '/', 
});
