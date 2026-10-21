import { build } from "esbuild";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const id = process.argv[2];
if (!/^\d{2}$/.test(id || "")) throw new Error("Usage: node scripts/build_gallery_room.mjs 09");
const cache = resolve(`.cache/room${id}`);
const destination = resolve(`src/assets/explore/room${id}`);
await mkdir(cache, { recursive: true });
await mkdir(destination, { recursive: true });
await build({
  entryPoints: [`scripts/room${id}_author.mjs`],
  bundle: true, format: "esm", target: "es2020",
  loader: { ".webp": "dataurl" },
  outfile: resolve(cache, "author.js"),
});
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/") {
    response.writeHead(200, { "content-type": "text/html" });
    response.end('<!doctype html><body style="margin:0;background:#292c36"><script type="module" src="/author.js"></script>');
    return;
  }
  if (pathname !== "/author.js") { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { "content-type": "text/javascript" });
  response.end(await readFile(resolve(cache, "author.js")));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"] });
try {
  const page = await browser.newPage({ viewport: { width: 735, height: 936 } });
  page.on("pageerror", (error) => console.error("Author page:", error));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => typeof window.__authorRoom === "function");
  const result = await page.evaluate(() => window.__authorRoom());
  const decode = (url) => Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
  const preview = decode(result.preview);
  const model = decode(result.glb);
  if (preview.length + model.length > 8_000_000) throw new Error(`Room ${id} exceeds the 8 MB asset target`);
  await writeFile(resolve(destination, "preview.webp"), preview);
  await writeFile(resolve(destination, "room.glb"), model);
  console.log(`Room ${id}: ${result.objects} scene groups, preview ${preview.length} bytes, GLB ${model.length} bytes`);
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
