const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const destination = fs.mkdtempSync(path.join(os.tmpdir(), "shahid-projects-"));

execFileSync("hugo", ["--destination", destination, "--cleanDestinationDir"], {
  cwd: root,
  stdio: "pipe",
});

function page(relativePath) {
  const file = path.join(destination, relativePath, "index.html");
  assert.ok(fs.existsSync(file), `missing rendered page: ${relativePath || "/"}`);
  return fs.readFileSync(file, "utf8");
}

test("Redistill case study explains ownership, architecture, and measured results", () => {
  const html = page("projects/redistill");

  assert.match(html, /Designed and built entirely by Shahid Shaikh/i);
  assert.match(html, /Architecture and engineering decisions/i);
  assert.match(html, /9\.07M operations per second/i);
  assert.match(html, /AWS c7i\.16xlarge/i);
  assert.match(html, /persistence disabled/i);
});

test("Redistill case study states compatibility boundaries", () => {
  const html = page("projects/redistill");

  assert.match(html, /When Redis remains the better fit/i);
  assert.match(html, /replication/i);
  assert.match(html, /clustering/i);
  assert.match(html, /full Redis data-type surface/i);
});

test("homepage and Projects page link to the Redistill case study", () => {
  assert.match(page(""), /href="\/projects\/redistill\/"/);
  assert.match(page("projects"), /href="\/projects\/redistill\/"/);
});

test("MemX case study explains ownership, architecture, and cross-agent workflow", () => {
  const html = page("projects/memx");

  assert.match(html, /Designed and built entirely by Shahid Shaikh/i);
  assert.match(html, /Local-first architecture/i);
  assert.match(html, /SQLite/i);
  assert.match(html, /sqlite-vec/i);
  assert.match(html, /Ollama/i);
  assert.match(html, /Model Context Protocol|MCP/i);
  assert.match(html, /Claude.*Cursor|Cursor.*Claude/is);
});

test("MemX case study states product boundaries and links to technical sources", () => {
  const html = page("projects/memx");

  assert.match(html, /Deliberate boundaries/i);
  assert.match(html, /authentication/i);
  assert.match(html, /rate limiting/i);
  assert.match(html, /href="https:\/\/github\.com\/shaikh-shahid\/memx"/);
  assert.match(html, /href="\/blog\/memx-local-first-ai-memory-layer\/"/);
});

test("homepage and Projects page link to the MemX case study", () => {
  assert.match(page(""), /href="\/projects\/memx\/"/);
  assert.match(page("projects"), /href="\/projects\/memx\/"/);
});
