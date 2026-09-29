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

test("homepage and individual articles include the Substack signup form", () => {
  for (const relativePath of [
    "index.html",
    path.join("blog", "building-cli-for-ai-agents", "index.html"),
  ]) {
    const html = fs.readFileSync(path.join(destination, relativePath), "utf8");
    const embeds = html.match(/https:\/\/shahidontech\.substack\.com\/embed/g) ?? [];

    assert.equal(embeds.length, 1, `${relativePath} should contain one signup form`);
    assert.match(html, /title="Subscribe to Shahid's newsletter"/);
    assert.match(html, /loading="lazy"/);
  }

  const archive = fs.readFileSync(path.join(destination, "blog", "index.html"), "utf8");
  assert.doesNotMatch(archive, /shahidontech\.substack\.com\/embed/);
});

test("blog articles load the code-copy enhancement", () => {
  const html = fs.readFileSync(
    path.join(destination, "blog", "api-in-go-using-gin-framework", "index.html"),
    "utf8"
  );

  assert.match(html, /src="https:\/\/shaikhshahid\.com\/js\/code-copy\.js"/);
});

test("Hugging Face profile appears on the homepage and contact page", () => {
  const homepage = fs.readFileSync(path.join(destination, "index.html"), "utf8");
  const contact = fs.readFileSync(path.join(destination, "contact", "index.html"), "utf8");
  const profileUrl = "https://huggingface.co/rwtc66";

  assert.match(homepage, new RegExp(`href="${profileUrl}"`));
  assert.match(homepage, />Hugging Face</);
  assert.match(contact, new RegExp(`href="${profileUrl}"`));
});

test("articles show profile links below metadata and newsletter after the article", () => {
  const html = fs.readFileSync(
    path.join(destination, "blog", "building-cli-for-ai-agents", "index.html"),
    "utf8"
  );
  const metadataPosition = html.indexOf('class="meta"');
  const followPosition = html.indexOf('class="article-follow"');
  const bodyPosition = html.indexOf('class="body"');
  const newsletterPosition = html.indexOf('class="newsletter-signup"');

  assert.ok(metadataPosition >= 0);
  assert.ok(followPosition > metadataPosition);
  assert.ok(bodyPosition > followPosition);
  assert.ok(newsletterPosition > bodyPosition);
  assert.match(html, /Follow my work:/);
  assert.match(html, /href="https:\/\/huggingface\.co\/rwtc66"/);
  assert.match(html, /href="https:\/\/github\.com\/shaikh-shahid"/);
  assert.match(html, /href="https:\/\/www\.linkedin\.com\/in\/skshahid\/"/);
  assert.match(html, /href="https:\/\/x\.com\/shahidontech"/);

  const followMarkup = html.slice(followPosition, bodyPosition);
  assert.ok(followMarkup.indexOf(">X</a>") < followMarkup.indexOf(">GitHub</a>"));
  assert.ok(followMarkup.indexOf(">GitHub</a>") < followMarkup.indexOf(">Hugging Face</a>"));
  assert.ok(followMarkup.indexOf(">Hugging Face</a>") < followMarkup.indexOf(">LinkedIn</a>"));
});
