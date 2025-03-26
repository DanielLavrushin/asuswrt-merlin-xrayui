import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { exec } from 'child_process';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
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
      watch: {}
    },

    resolve: {
      alias: {
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
          this.addWatchFile(path.resolve(__dirname, 'src', 'xrayui.sh'));
        },
        name: 'copy-and-sync',
        closeBundle: () => {
          console.log('Vite finished building. Copying extra files...');

          try {
            fs.copyFileSync('src/App.html', 'dist/index.asp');
            fs.copyFileSync('src/xrayui.sh', 'dist/xrayui');
            console.log('Files copied successfully.');
          } catch (e) {
            console.error('File copy error:', e);
          }

          console.log('Running sync.js script...');
          exec('node sync.js', (err, stdout, stderr) => {
            if (err) {
              console.error(`Error running sync.js script: ${err}`);
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
