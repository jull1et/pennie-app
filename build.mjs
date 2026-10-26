// Страницы Pennie для App Store: поддержка (index.html) и Privacy Policy (privacy.html).
// Тексты берутся из кода приложения, чтобы на сайте и в приложении было одно и то же:
//   node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const APP = path.resolve(import.meta.dirname, '../glp1-tracker');
const require = createRequire(path.join(APP, 'package.json'));
const ts = require('typescript');

/** TS-файл из приложения → объект с его export */
function load(file, deps = {}) {
  const src = fs.readFileSync(path.join(APP, file), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', js)((name) => deps[name], module, module.exports);
  return module.exports;
}

const legal = load('src/lib/legal.ts');
const policy = load('src/lib/privacy-policy.ts', { './legal': legal });
const plusSrc = fs.readFileSync(path.join(APP, 'src/lib/plus.ts'), 'utf8');
const HOW_TO_CANCEL = new Function(`return (${plusSrc.match(/export const HOW_TO_CANCEL =([\s\S]*?);\n/)[1]})`)();

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mail = legal.SUPPORT_EMAIL;
const linkify = (s) => esc(s).replace(esc(mail), `<a href="mailto:${mail}">${mail}</a>`).replace('revenuecat.com/privacy', '<a href="https://www.revenuecat.com/privacy">revenuecat.com/privacy</a>');

const page = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600&display=swap" rel="stylesheet">
<style>
  :root { --bg: #FBF7EE; --surface: #FFFDF9; --ink: #10090A; --ink2: #59555F; --accent: #BC2848; --line: #EFE6D8; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 18px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
  header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
  header img { width: 56px; height: 56px; border-radius: 13px; }
  header a { color: inherit; text-decoration: none; font: 600 24px/1.2 Unbounded, sans-serif; }
  h1 { font: 600 30px/1.25 Unbounded, sans-serif; margin: 0 0 8px; }
  h2 { font: 600 19px/1.3 Unbounded, sans-serif; margin: 32px 0 8px; }
  p { margin: 0 0 14px; }
  .muted { color: var(--ink2); }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: 20px; margin: 20px 0; }
  a { color: var(--accent); }
  .button { display: inline-block; background: var(--accent); color: #FFF8F4; text-decoration: none; padding: 14px 22px; border-radius: 14px; font-weight: 600; min-height: 44px; }
  footer { margin-top: 48px; color: var(--ink2); font-size: 15px; }
  footer a { margin-right: 16px; }
</style>
</head>
<body>
<main>
<header><img src="icon.png" alt=""><a href="./">Pennie</a></header>
${body}
<footer><a href="./">Support</a><a href="privacy.html">Privacy Policy</a><a href="${legal.TERMS_URL}">Terms of Use</a></footer>
</main>
</body>
</html>
`;

const support = page('Pennie support', `
<h1>Pennie support</h1>
<p class="muted">Pennie is a private journal for life on GLP-1 shots and pills.</p>
<div class="card">
  <h2 style="margin-top:0">Contact us</h2>
  <p>Questions, ideas or something not working? Write to us and we'll reply by email.</p>
  <p><a class="button" href="mailto:${mail}?subject=Pennie">${mail}</a></p>
</div>
<h2>How to cancel Plus</h2>
<p>${esc(HOW_TO_CANCEL)}</p>
<h2>Your data</h2>
<p>${esc(legal.PRIVACY_LINE)} ${esc(legal.NEW_IPHONE)}</p>
<h2>Not medical advice</h2>
<p>${esc(legal.MEDICAL_DISCLAIMER)}</p>
`);

const privacy = page('Pennie Privacy Policy', `
<h1>Privacy Policy</h1>
<p class="muted">Last updated: ${esc(policy.POLICY_UPDATED)}</p>
${policy.PRIVACY_POLICY.map((s) => `<h2>${esc(s.title)}</h2>\n${s.body.filter((b) => !b.startsWith('Last updated')).map((b) => `<p>${linkify(b)}</p>`).join('\n')}`).join('\n')}
`);

fs.writeFileSync(path.join(import.meta.dirname, 'index.html'), support);
fs.writeFileSync(path.join(import.meta.dirname, 'privacy.html'), privacy);
fs.copyFileSync(path.join(APP, 'assets/images/icon.png'), path.join(import.meta.dirname, 'icon.png'));
console.log('ok: index.html, privacy.html, icon.png');
