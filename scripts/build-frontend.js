const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');
const distDir = path.resolve(__dirname, '..', 'dist');

console.log('=== Building & Hardening Frontend Assets ===');
console.log(`Source:      ${srcDir}`);
console.log(`Destination: ${distDir}`);

// Clean / recreate dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function minifyJs(content) {
  // If terser is installed, use it
  try {
    const terser = require('terser');
    const result = terser.minify_sync(content, {
      compress: {
        dead_code: true,
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        toplevel: false
      },
      format: {
        comments: false
      }
    });
    if (result && result.code) {
      return result.code;
    }
  } catch (e) {
    // Fallback to built-in minification
  }

  // Built-in comment & whitespace stripping
  return content
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove single line comments that are not inside quotes or URLs
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//')) return '';
      return line;
    })
    .join('\n')
    .replace(/^\s*[\r\n]/gm, '');
}

function minifyCss(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\}:;,])\s*/g, '$1')
    .trim();
}

function minifyHtml(content) {
  return content
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

function processDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      processDirectory(srcPath, destPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      // Already minified vendor files: copy directly
      if (entry.name.endsWith('.min.js') || entry.name.endsWith('.min.css')) {
        fs.copyFileSync(srcPath, destPath);
      } else if (ext === '.js') {
        const raw = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath, minifyJs(raw), 'utf8');
      } else if (ext === '.css') {
        const raw = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath, minifyCss(raw), 'utf8');
      } else if (ext === '.html') {
        const raw = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath, minifyHtml(raw), 'utf8');
      } else {
        // Assets, images, fonts
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

processDirectory(srcDir, distDir);
console.log('✓ Frontend assets successfully processed and hardened into dist/\n');
