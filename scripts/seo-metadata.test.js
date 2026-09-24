const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const destination = fs.mkdtempSync(path.join(os.tmpdir(), "shahid-seo-"));

execFileSync("hugo", ["--destination", destination, "--cleanDestinationDir"], {
  cwd: root,
  stdio: "pipe",
});

function page(relativePath) {
  return fs.readFileSync(path.join(destination, relativePath, "index.html"), "utf8");
}

function canonical(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
}

function schemas(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

function description(html) {
  return html.match(/<meta name="description" content="([^"]*)"/)?.[1];
}

function meta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(
    new RegExp(`<meta (?:name|property)="${escaped}" content="([^"]*)"`)
  )?.[1];
}

test("homepage publishes a canonical URL and Person schema", () => {
  const html = page("");
  const person = schemas(html).find((schema) => schema["@type"] === "Person");

  assert.equal(canonical(html), "https://shaikhshahid.com/");
  assert.equal(person?.name, "Shahid Shaikh");
  assert.equal(person?.jobTitle, "Principal Software Architect");
  assert.ok(person?.sameAs.includes("https://github.com/shaikh-shahid"));
  assert.equal(meta(html, "og:description"), description(html));
  assert.equal(meta(html, "twitter:card"), "summary_large_image");
  assert.equal(
    meta(html, "twitter:image"),
    "https://shaikhshahid.com/images/shahid-speaking.jpeg"
  );
});

test("blog posts publish canonical URLs and BlogPosting schema", () => {
  const html = page("blog/speculative-decoding");
  const article = schemas(html).find((schema) => schema["@type"] === "BlogPosting");

  assert.equal(
    canonical(html),
    "https://shaikhshahid.com/blog/speculative-decoding/"
  );
  assert.equal(article?.headline, "Speculative Decoding");
  assert.equal(article?.author?.name, "Shahid Shaikh");
  assert.match(article?.datePublished ?? "", /^2026-09-18/);
  assert.ok((article?.description ?? "").length > 80);
  assert.equal(meta(html, "og:type"), "article");
  assert.match(meta(html, "article:published_time") ?? "", /^2026-09-18/);
  assert.equal(meta(html, "twitter:card"), "summary_large_image");
  assert.equal(meta(html, "twitter:image"), meta(html, "og:image"));
});

test("books page publishes a four-book ItemList schema", () => {
  const html = page("books");
  const itemList = schemas(html).find((schema) => schema["@type"] === "ItemList");

  assert.equal(canonical(html), "https://shaikhshahid.com/books/");
  assert.equal(itemList?.numberOfItems, 4);
  assert.equal(itemList?.itemListElement?.[0]?.item?.["@type"], "Book");
  assert.equal(itemList?.itemListElement?.[0]?.item?.author?.name, "Shahid Shaikh");
});

test("core pages use substantive, page-specific descriptions", () => {
  for (const route of ["about", "projects", "contact", "books"]) {
    const value = description(page(route));
    assert.ok(value?.length >= 70, `${route} description is too short`);
    assert.match(value, /Shahid/i);
  }
});
