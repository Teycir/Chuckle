const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

const filesToCopy = [
  'manifest.json',
  'popup.html',
  'popup-batch.html',
  'styles.css'
];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

const jsFiles = ['background.js', 'content.js', 'popup.js', 'popup-batch.js'];
jsFiles.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

const iconSrc = path.join(__dirname, 'icons', 'icon.svg');
const iconDest = path.join(iconsDir, 'icon.svg');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, iconDest);
}

console.log('Build complete! Extension ready in dist/ folder');
console.log('Files copied:', [...filesToCopy, ...jsFiles, 'icons/icon.svg'].join(', '));
