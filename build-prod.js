const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const distDir = path.join(__dirname, 'dist');
const files = ['background.js', 'content.js', 'popup.js'];

async function minifyFiles() {
  console.log('\n🔧 Minifying JavaScript files...\n');
  
  for (const file of files) {
    const filePath = path.join(distDir, file);
    const code = fs.readFileSync(filePath, 'utf8');
    
    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        toplevel: true
      },
      format: {
        comments: false
      }
    });
    
    if (result.code) {
      fs.writeFileSync(filePath, result.code);
      const originalSize = (code.length / 1024).toFixed(2);
      const minifiedSize = (result.code.length / 1024).toFixed(2);
      const savings = ((1 - result.code.length / code.length) * 100).toFixed(1);
      console.log(`✓ ${file}: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
    }
  }
  
  console.log('\n✅ Minification complete!\n');
}

minifyFiles().catch(console.error);
