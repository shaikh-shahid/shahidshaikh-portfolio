const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function renderHomePage() {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), "shahid-site-"));
  execFileSync("hugo", ["--destination", destination, "--cleanDestinationDir"], {
    cwd: root,
    stdio: "pipe",
  });
  return fs.readFileSync(path.join(destination, "index.html"), "utf8");
}

test("rendered navigation keeps a normal nav and provides an accessible mobile toggle", () => {
  const html = renderHomePage();

  assert.doesNotMatch(html, /<details class="site-navigation">/);
  assert.match(html, /<div class="site-navigation">/);
  assert.match(html, /<button[^>]*aria-controls="primary-navigation"[^>]*aria-expanded="false"[^>]*>/);
  assert.match(html, /<nav id="primary-navigation"[^>]*aria-label="Primary navigation"[^>]*>/);
  assert.match(html, /src="https:\/\/shaikhshahid\.com\/js\/navigation\.js"/);
  assert.match(html, /<noscript>[\s\S]*data-mobile-navigation-fallback/);
});

test("mobile navigation and code blocks stay within the viewport", () => {
  const css = fs.readFileSync(path.join(root, "assets", "css", "custom-home.css"), "utf8");

  assert.match(css, /@media screen and \(max-width: 768px\)[\s\S]*?\.navigation-menu-button\s*{[\s\S]*?display:\s*inline-flex/);
  assert.match(css, /\.site-navigation\s*>\s*nav\s*{[\s\S]*?display:\s*none/);
  assert.match(css, /\.post-content[\s\S]*?min-inline-size:\s*0/);
  assert.match(css, /\.highlight[\s\S]*?max-inline-size:\s*100%/);
  assert.match(css, /pre\s*{[\s\S]*?overflow-x:\s*auto/);
});

test("homepage introduces Shahid before presenting the speaking photo", () => {
  const html = renderHomePage();
  const introduction = html.indexOf("Hey, I’m Shahid");
  const photo = html.indexOf("Shahid speaking at a conference");

  assert.notEqual(introduction, -1);
  assert.notEqual(photo, -1);
  assert.ok(introduction < photo);
});
