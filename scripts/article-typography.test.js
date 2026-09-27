const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(
  path.resolve(__dirname, "..", "assets", "css", "custom-home.css"),
  "utf8"
);

test("article paragraphs use a comfortable reading rhythm", () => {
  assert.match(css, /\.post-content \.body\s*{[\s\S]*?font-size:\s*1\.0625rem/);
  assert.match(css, /\.post-content \.body p\s*{[\s\S]*?line-height:\s*1\.65/);
  assert.match(css, /\.post-content \.body p\s*{[\s\S]*?margin-block:\s*0\.75rem/);
  assert.match(css, /\.post-content \.body li\s*{[\s\S]*?line-height:\s*1\.65/);
});

test("article text returns to 16px on small screens", () => {
  assert.match(css, /@media screen and \(max-width: 600px\)[\s\S]*?\.post-content \.body\s*{[\s\S]*?font-size:\s*1rem/);
});

test("article images have breathing room on both sides", () => {
  assert.match(css, /\.post-content \.body img\s*{[\s\S]*?margin-block:\s*1\.5rem/);
  assert.match(css, /\.post-content \.body figure\s*{[\s\S]*?margin-block:\s*1\.5rem/);
});

test("article headings use a clear and consistent hierarchy", () => {
  assert.match(css, /\.post-content \.body h2\s*{[\s\S]*?margin-block:\s*2\.5rem 0\.75rem/);
  assert.match(css, /\.post-content \.body h3\s*{[\s\S]*?margin-block:\s*2rem 0\.65rem/);
  assert.match(css, /\.post-content \.body :is\(h2, h3, h4\) \+ :is\(h2, h3, h4\)\s*{[\s\S]*?margin-block-start:\s*1rem/);
});
