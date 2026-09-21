const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { imagePathFor, managerAssetPath, managerImagePath, sanitizeImageName } = require("./site-manager");

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
  const bundle = fs.readFileSync(path.join(root, "static/manager/toastui-editor.js"), "utf8");
  assert.doesNotMatch(bundle, /require\("prosemirror/);
  assert.match(source, /beforeunload/);
  assert.match(source, /hasUnsavedChanges/);
});

test("manager serves its bundled editor assets", () => {
  assert.equal(managerAssetPath("/manager/toastui-editor.js").endsWith("static/manager/toastui-editor.js"), true);
  assert.equal(managerAssetPath("/manager/toastui-editor.css").endsWith("static/manager/toastui-editor.css"), true);
  assert.equal(managerAssetPath("/manager/secret.txt"), null);
});

test("manager serves uploaded images from the editor path", () => {
  assert.equal(
    managerImagePath("/images/uploads/abha-card-22-2308-6417-5739.png").endsWith(
      "static/images/uploads/abha-card-22-2308-6417-5739.png"
    ),
    true
  );
  assert.equal(managerImagePath("/images/uploads/../site-manager.js"), null);
  assert.equal(managerImagePath("/images/private.png"), null);
});

test("manager editor uses a compact fixed editing height", () => {
  const source = fs.readFileSync(path.join(root, "scripts/site-manager.js"), "utf8");

  assert.match(source, /\.wysiwyg-editor \{ min-height: 0; \}/);
  assert.match(source, /height: "430px"/);
});

test("Writing archive uses ten-item pagination", () => {
  const source = fs.readFileSync(
    path.join(root, "layouts/blog/list.html"),
    "utf8"
  );

  assert.match(source, /\.Paginate \$pages 10/);
  assert.match(source, /writing-pagination/);
});
