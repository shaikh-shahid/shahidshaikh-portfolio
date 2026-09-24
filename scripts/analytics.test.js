const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function renderHome(environment) {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), `shahid-${environment}-`));
  execFileSync(
    "hugo",
    ["--environment", environment, "--destination", destination, "--cleanDestinationDir"],
    { cwd: root, stdio: "pipe" }
  );
  return fs.readFileSync(path.join(destination, "index.html"), "utf8");
}

test("production pages include the configured Google Analytics tag once", () => {
  const html = renderHome("production");

  assert.equal((html.match(/googletagmanager\.com\/gtag\/js\?id=G-DDRN4S9DSC/g) ?? []).length, 1);
  assert.equal((html.match(/gtag\('config', 'G-DDRN4S9DSC'\)/g) ?? []).length, 1);
});

test("development pages do not send Google Analytics events", () => {
  const html = renderHome("development");

  assert.doesNotMatch(html, /googletagmanager\.com|G-DDRN4S9DSC/);
});
