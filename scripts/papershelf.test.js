const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("Papershelf content has authored and reading sections", () => {
  const content = fs.readFileSync(path.join(root, "content/papershelf.md"), "utf8");

  assert.match(content, /\[\[params\.authored\]\]/);
  assert.match(content, /\[\[params\.reading\]\]/);
  assert.match(content, /themes = \[/);
  assert.match(content, /AI Security/);
});

test("Papershelf has a dedicated card layout", () => {
  const layout = fs.readFileSync(
    path.join(root, "layouts/papershelf/single.html"),
    "utf8"
  );

  assert.match(layout, /papershelf-page/);
  assert.match(layout, /papershelf-card/);
  assert.match(layout, /papershelf-themes/);
});
