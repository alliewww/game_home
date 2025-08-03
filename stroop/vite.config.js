export default {
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(require('./package.json').version),
  },
}; 