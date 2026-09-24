const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const destination = fs.mkdtempSync(path.join(os.tmpdir(), "shahid-quality-"));

execFileSync("hugo", ["--destination", destination, "--cleanDestinationDir"], {
  cwd: root,
  stdio: "pipe",
});

function page(relativePath = "") {
  return fs.readFileSync(path.join(destination, relativePath, "index.html"), "utf8");
}

test("homepage uses only local presentation assets", () => {
  const html = page();
  const presentationUrls = [
    ...html.matchAll(/<(?:link|script)\b[^>]*(?:href|src)="([^"]+)"/g),
  ].map((match) => match[1]);

  assert.equal(
    presentationUrls.some((url) =>
      /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg|cdnjs\.cloudflare/i.test(url)
    ),
    false
  );
  assert.doesNotMatch(html, /simple-icons/i);
});

test("homepage hero image reserves its rendered aspect ratio", () => {
  const html = page();
  const image = html.match(/<img[^>]+shahid-speaking\.jpeg[^>]*>/)?.[0] ?? "";

  assert.match(image, /width="1280"/);
  assert.match(image, /height="853"/);
  assert.match(image, /fetchpriority="high"/);
});

test("homepage stylesheet payload stays below 100 KiB", () => {
  const html = page();
  const stylesheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith("/"));
  const bytes = stylesheets.reduce((total, url) => {
    return total + fs.statSync(path.join(destination, url)).size;
  }, 0);

  assert.ok(bytes < 100 * 1024, `stylesheet payload is ${bytes} bytes`);
});

test("generated pages contain no broken internal links", () => {
  const broken = [];
  for (const file of fs.readdirSync(destination, { recursive: true })) {
    if (!file.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(destination, file), "utf8");
    for (const match of html.matchAll(/href="(\/[^"#?]*)"/g)) {
      const target = path.join(destination, match[1]);
      if (!fs.existsSync(target) && !fs.existsSync(path.join(target, "index.html"))) {
        broken.push(`${file} -> ${match[1]}`);
      }
    }
  }

  assert.deepEqual([...new Set(broken)], []);
});
