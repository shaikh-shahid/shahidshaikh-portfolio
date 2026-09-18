const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { imagePathFor, sanitizeImageName } = require("./site-manager");

const root = path.resolve(__dirname, "..");

test("manager uses a posts-first content selector and collapsed advanced front matter", () => {
  const source = fs.readFileSync(path.join(root, "scripts/site-manager.js"), "utf8");

  assert.match(source, /id="contentFilter"/);
  assert.match(source, /<option value="post">Posts<\/option>/);
  assert.match(source, /<details class="advanced-fields">/);
});

test("manager includes Markdown formatting tools and a preview", () => {
  const source = fs.readFileSync(path.join(root, "scripts/site-manager.js"), "utf8");

  assert.match(source, /data-editor-tab="edit"/);
  assert.match(source, /data-editor-tab="preview"/);
  assert.match(source, /id="bodyPreview"/);
});

test("manager uses edit and preview tabs with a WYSIWYG editor", () => {
  const source = fs.readFileSync(path.join(root, "scripts/site-manager.js"), "utf8");

  assert.match(source, /toastui-editor/);
  assert.match(source, /data-editor-tab="edit"/);
  assert.match(source, /data-editor-tab="preview"/);
  assert.match(source, /addImageBlobHook/);
});

test("uploaded image names stay inside the static uploads directory", () => {
  assert.equal(sanitizeImageName("My diagram 01.PNG"), "my-diagram-01.png");
  assert.equal(imagePathFor("my-diagram-01.png"), "static/images/uploads/my-diagram-01.png");
});

test("manager exposes a local image upload endpoint", () => {
  const source = fs.readFileSync(path.join(root, "scripts/site-manager.js"), "utf8");

  assert.match(source, /\/api\/images/);
  assert.match(source, /static.*images.*uploads/);
});

test("manager bundles Toast UI locally and warns before losing edits", () => {
  const source = fs.readFileSync(path.join(root, "scripts/site-manager.js"), "utf8");

  assert.doesNotMatch(source, /uicdn\.toast\.com/);
  assert.equal(fs.existsSync(path.join(root, "static/manager/toastui-editor.js")), true);
  assert.equal(fs.existsSync(path.join(root, "static/manager/toastui-editor.css")), true);
  assert.match(source, /beforeunload/);
  assert.match(source, /hasUnsavedChanges/);
});

test("Writing archive uses ten-item pagination", () => {
  const source = fs.readFileSync(
    path.join(root, "layouts/blog/list.html"),
    "utf8"
  );

  assert.match(source, /\.Paginate \$pages 10/);
  assert.match(source, /writing-pagination/);
});
