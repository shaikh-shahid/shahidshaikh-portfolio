const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const destination = fs.mkdtempSync(path.join(os.tmpdir(), "shahid-release-pages-"));

execFileSync("hugo", ["--environment", "production", "--destination", destination], {
  cwd: root,
  stdio: "pipe",
});

test("custom 404 page gives visitors useful routes back into the site", () => {
  const html = fs.readFileSync(path.join(destination, "404.html"), "utf8");

  assert.match(html, /Page not found/i);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/blog\/"/);
  assert.match(html, /href="\/projects\/"/);
});

test("navigation links to the locally hosted resume", () => {
  const html = fs.readFileSync(path.join(destination, "index.html"), "utf8");
  const resume = fs.readFileSync(path.join(destination, "resume.pdf"));

  assert.match(html, /href="\/resume\.pdf"/);
  assert.equal(resume.subarray(0, 5).toString(), "%PDF-");
});
