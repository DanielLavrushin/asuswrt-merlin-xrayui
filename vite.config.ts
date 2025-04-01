import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { exec } from 'child_process';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import fs from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';

function watchAllShFiles(pluginContext, dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      watchAllShFiles(pluginContext, fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.sh')) {
      pluginContext.addWatchFile(fullPath);
    }
  });
}

function inlineShellImports(scriptPath, visited = new Set(), isRoot = true) {
  if (visited.has(scriptPath)) {
    return '';
  }
  visited.add(scriptPath);

  let content = fs.readFileSync(scriptPath, 'utf8');
  const dirOfScript = path.dirname(scriptPath);

  const lines = content.split('\n');
  let output = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const match = line.match(/^import\s+(.+)$/);
    if (match) {
      const importedFile = match[1].trim();
      const importAbsolutePath = path.resolve(dirOfScript, importedFile);

      output += inlineShellImports(importAbsolutePath, visited, false);
    } else {
      if (!isRoot && i === 0 && line.match(/^#!.*(sh|bash|zsh)/)) {
        continue;
      }
      output += line + '\n';
    }
  }

  return output;
}

export default defineConfig(({ mode }) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  const isProduction = mode === 'production';
  console.log(`Building for ${isProduction ? 'production' : 'development'}...`);

  return {
    build: {
      minify: !isProduction,
      outDir: 'dist',
      rollupOptions: {
        input: 'src/App.ts',
        output: {
          entryFileNames: 'app.js'
        }
      },
      watch: process.env.VITE_WATCH ? {} : undefined
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `
            @use "@/App.globals.scss" as *;
        `
        }
      }
    },
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src', 'components'),
        '@ibd': path.resolve(__dirname, 'src', 'components', 'inbounds'),
        '@obd': path.resolve(__dirname, 'src', 'components', 'outbounds'),
        '@modal': path.resolve(__dirname, 'src', 'components', 'modals'),
        '@clients': path.resolve(__dirname, 'src', 'components', 'clients'),
        '@': path.resolve(__dirname, 'src')
      }
    },

    server: {
      hmr: false
    },

    plugins: [
      vue(),
      cssInjectedByJsPlugin(),
      {
        buildStart() {
          this.addWatchFile(path.resolve(__dirname, 'src', 'App.html'));

          const backendDir = path.resolve(__dirname, 'src', 'backend');
          watchAllShFiles(this, backendDir);
        },
        name: 'copy-and-sync',
        closeBundle: () => {
          console.log('Vite finished building. Copying extra files...');

          try {
            const scriptPath = path.join(__dirname, 'src', 'backend', 'xrayui.sh');
            const mergedContent = inlineShellImports(scriptPath);

            const distScript = path.join(__dirname, 'dist', 'xrayui');
            fs.writeFileSync(distScript, mergedContent, { mode: 0o755 });

            fs.copyFileSync('src/App.html', 'dist/index.asp');
            console.log('Files copied successfully.');
          } catch (e) {
            console.error('File copy error:', e);
          }

          if (!process.env.VITE_WATCH) return;
          console.log('Running sync.js script...');
          exec('node vite.sync.js', (error, stdout, stderr) => {
            if (error) {
              console.error('Error running sync.js script:', error);
              return;
            }
            console.log(`Sync script output: ${stdout}`);
            if (stderr) {
              console.error(`Sync script errors: ${stderr}`);
            }
          });
        }
      }
    ]
  };
});
