import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';

const banner = `/*
Linear Calendar 2 - A professional linear calendar view for Obsidian
https://github.com/YOUR_USERNAME/linear-calendar-2
MIT License
*/`;

const prod = process.argv[2] === 'production';

// Target vault for development - adjust path as needed
const DEV_VAULT_PLUGIN_DIR = join(
  process.env.HOME || '',
  'obsidianvaults/Obsidian_Privat/.obsidian/plugins/linear-calendar-2'
);

const context = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ['src/index.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins,
  ],
  format: 'cjs',
  target: 'es2022',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod,
  plugins: [
    {
      name: 'copy-to-vault',
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length > 0) return;

          // Only copy in dev mode
          if (prod) return;

          // Create plugin directory if it doesn't exist
          if (!existsSync(DEV_VAULT_PLUGIN_DIR)) {
            mkdirSync(DEV_VAULT_PLUGIN_DIR, { recursive: true });
          }

          // Copy files to vault
          const filesToCopy = ['main.js', 'manifest.json', 'styles.css'];
          for (const file of filesToCopy) {
            if (existsSync(file)) {
              copyFileSync(file, join(DEV_VAULT_PLUGIN_DIR, file));
              console.log(`Copied ${file} to vault`);
            }
          }
        });
      },
    },
  ],
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
