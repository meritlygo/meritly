/* Собирает папку www для Capacitor из ЕДИНСТВЕННОГО источника правды —
   Meritly.html в корне репозитория.

   Зачем: прототип обязан работать из file:// и без сети, поэтому весь CSS, все
   шрифты и весь JS лежат внутри одного файла. В сборку кладём ровно его копию,
   а не вторую версию кода: иначе через месяц сборка покажет старую игру.

   Чего здесь НЕТ и почему:
   - Не подключается dist/capacitor.js. Проверено по исходникам 8.6.2: это веб-
     сборка, она только дополняет уже существующий window.Capacitor и регистрирует
     плагины через registerPlugin, которому нужен PluginHeaders. Нативный мост iOS
     PluginHeaders не отдаёт, поэтому файл ничего не добавил бы. Доступ к Keychain
     идёт через родной nativePromise прямо из Meritly.html (функция capPlugin).

   Скрипт падает, если исходника нет или он подозрительно мал: молчаливая сборка
   пустого приложения хуже понятной ошибки. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');            // .../app
const repo = resolve(appDir, '..');            // корень репозитория
const src = join(repo, 'Meritly.html');
const outDir = join(appDir, 'www');
const out = join(outDir, 'index.html');

const MIN_BYTES = 500_000;   // прототип ~1,16 МБ; меньше — значит взяли не тот файл
if (!existsSync(src)) {
  console.error(`ОТКАЗ: нет исходника ${src}`);
  process.exit(1);
}
const size = statSync(src).size;
if (size < MIN_BYTES) {
  console.error(`ОТКАЗ: ${src} всего ${size} байт — это не прототип`);
  process.exit(1);
}

const html = readFileSync(src, 'utf8');

/* Метка сборки: на телефоне видно, какая версия установлена. Механику не трогает,
   на игру не влияет — обычный HTML-комментарий. */
const stamp = `<!-- build ${new Date().toISOString()} -->`;

if (!html.includes('</head>')) {
  console.error('ОТКАЗ: в Meritly.html нет </head> — файл не тот');
  process.exit(1);
}
const i = html.indexOf('</head>');
const merged = html.slice(0, i) + stamp + html.slice(i);

mkdirSync(outDir, { recursive: true });
writeFileSync(out, merged, 'utf8');

const bytes = Buffer.byteLength(merged, 'utf8');
console.log(`www собран: ${out}`);
console.log(`  исходник: ${src}  ${size} байт`);
console.log(`  на выходе: ${bytes} байт (+${bytes - size} байт метки)`);
if (bytes < MIN_BYTES) { console.error('ОТКАЗ: результат подозрительно мал'); process.exit(1); }