// build-copy-public.js - Copy public assets to dist folder
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function copyPublicAssets() {
  const publicDir = path.join(__dirname, 'client', 'public');
  const distDir = path.join(__dirname, 'client', 'dist');

  if (!fs.existsSync(publicDir)) {
    console.log('✓ No public assets to copy');
    return;
  }

  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach((file) => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);

      if (fs.statSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  Copied: ${path.relative(__dirname, destPath)}`);
      }
    });
  }

  console.log('Copying public assets to dist...');
  copyRecursive(publicDir, distDir);
  console.log('✓ Public assets copied successfully');
}

copyPublicAssets().catch((error) => {
  console.error('✗ Error copying public assets:', error);
  process.exit(1);
});
