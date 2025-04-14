/* eslint-disable  security/detect-non-literal-fs-filename */
/* eslint-disable  @typescript-eslint/no-unsafe-assignment */
/* eslint-disable  @typescript-eslint/no-unsafe-call */
/* eslint-disable  @typescript-eslint/no-unsafe-member-access */
/* eslint-disable  @typescript-eslint/no-unsafe-return */
/* eslint-disable  @typescript-eslint/no-unsafe-argument */
/* eslint-disable  no-explicit-any */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { exec } from 'child_process';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import fs from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

function watchAllShFiles(pluginContext, dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = join(dir, entry.name);

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
  const dirOfScript = dirname(scriptPath);

  const lines = content.split('\n');
  let output = '';

  for (const line of lines) {
    const match = line.match(/^import\s+(.+)$/);
    if (match) {
      const importedFile = match[1].trim();
      const importAbsolutePath = resolve(dirOfScript, importedFile);
      output += inlineShellImports(importAbsolutePath, visited, false);
    } else {
      if (!isRoot && line.match(/^#/)) {
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
        '@main': resolve(__dirname, 'src', 'components'),
        '@ibd': resolve(__dirname, 'src', 'components', 'inbounds'),
        '@obd': resolve(__dirname, 'src', 'components', 'outbounds'),
        '@modal': resolve(__dirname, 'src', 'components', 'modals'),
        '@clients': resolve(__dirname, 'src', 'components', 'clients'),
        '@': resolve(__dirname, 'src')
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
          this.addWatchFile(resolve(__dirname, 'src', 'App.html'));

          const backendDir = resolve(__dirname, 'src', 'backend');
          watchAllShFiles(this, backendDir);
        },
        name: 'copy-and-sync',
        closeBundle: () => {
          console.log('Vite finished building. Copying extra files...');

          try {
            const scriptPath = join(__dirname, 'src', 'backend', 'xrayui.sh');
            const mergedContent = inlineShellImports(scriptPath);

            const distScript = join(__dirname, 'dist', 'xrayui');
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
