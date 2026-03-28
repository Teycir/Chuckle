const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const entryPoints = [
  'src/browser-shim.js',
  'src/background.ts',
  'src/content.ts',
  'src/popup.ts',
  'src/viewer.ts'
];

esbuild.build({
  entryPoints: entryPoints,
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  sourcemap: false,
  minify: false,
  external: [],
  outExtension: { '.js': '.js' },
  entryNames: '[name]'
}).then(() => {
  console.log('✅ TypeScript compilation complete!');
  
  // Copy static files
  const filesToCopy = [
    'index.html',
    'manifest.json',
    'popup.html',
    'styles.css',
    'viewer.html'
  ];
  
  filesToCopy.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
  
  // Copy icons
  const iconsSrcDir = path.join(__dirname, 'icons');
  const iconsDestDir = path.join(distDir, 'icons');
  if (!fs.existsSync(iconsDestDir)) {
    fs.mkdirSync(iconsDestDir, { recursive: true });
  }
  
  const iconFiles = fs.readdirSync(iconsSrcDir);
  iconFiles.forEach(file => {
    const src = path.join(iconsSrcDir, file);
    const dest = path.join(iconsDestDir, file);
    fs.copyFileSync(src, dest);
  });
  
  console.log('✅ Static files copied to dist/');
  console.log('\n📦 Extension ready in dist/ folder');
  console.log('Load it in Chrome:');
  console.log('1. Open chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select the dist/ folder');
}).catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
