const test = require("node:test");
const assert = require("node:assert/strict");

const {
  contentFileFor,
  groupContent,
  parsePost,
  serializePost,
  slugify,
} = require("./site-manager");

test("slugify creates Hugo-friendly slugs", () => {
  assert.equal(slugify("Building CLI for AI Agents!"), "building-cli-for-ai-agents");
});

test("parsePost reads TOML front matter and body", () => {
  const source = `+++
date = '2026-09-18T12:00:00+05:30'
draft = true
title = 'Draft Post'
tags = ['ai', 'systems']
description = 'Short summary'
+++
Hello world.
`;

  assert.deepEqual(parsePost(source), {
    date: "2026-09-18T12:00:00+05:30",
    draft: true,
    title: "Draft Post",
    tags: ["ai", "systems"],
    description: "Short summary",
    extraFrontMatter: "",
    body: "Hello world.\n",
  });
});

test("parsePost reads YAML front matter and body", () => {
  const source = `---
title: "About"
description: "About Shahid"
date: '2023-06-10T11:56:14+05:30'
---
About body.
`;

  assert.deepEqual(parsePost(source), {
    date: "2023-06-10T11:56:14+05:30",
    draft: false,
    title: "About",
    tags: [],
    description: "About Shahid",
    extraFrontMatter: "",
    body: "About body.\n",
  });
});

test("parsePost preserves nested front matter used by structured pages", () => {
  const source = `+++
date = '2026-09-18T12:00:00+05:30'
draft = false
title = 'Papershelf'
description = 'Research shelf'
tags = []

[params]
themes = ['AI Agents']

[[params.authored]]
title = 'A paper'
+++
`;

  const parsed = parsePost(source);

  assert.match(parsed.extraFrontMatter, /\[params\]/);
  assert.match(parsed.extraFrontMatter, /A paper/);
});

test("serializePost writes TOML front matter and body", () => {
  const output = serializePost({
    date: "2026-09-18T12:00:00+05:30",
    draft: false,
    title: "Published Post",
    tags: ["ai"],
    description: "Short summary",
    body: "Body text.\n",
  });

  assert.match(output, /title = 'Published Post'/);
  assert.match(output, /draft = false/);
  assert.match(output, /tags = \['ai'\]/);
  assert.match(output, /\+\+\+\nBody text\.\n$/);
});

test("serializePost keeps nested front matter when saving a page", () => {
  const output = serializePost({
    date: "2026-09-18T12:00:00+05:30",
    draft: false,
    title: "Papershelf",
    tags: [],
    description: "Research shelf",
    extraFrontMatter: "[params]\nthemes = ['AI Agents']",
    body: "",
  });

  assert.match(output, /\[params\]\nthemes = \['AI Agents'\]/);
  assert.match(output, /\+\+\+\n\n$/);
});

test("contentFileFor maps pages and posts to Hugo content files", () => {
  assert.equal(contentFileFor({ kind: "page", slug: "about" }), "content/about.md");
  assert.equal(
    contentFileFor({ kind: "post", slug: "new-post" }),
    "content/blog/new-post/index.md"
  );
});

test("groupContent separates pages and posts for the manager sidebar", () => {
  const grouped = groupContent([
    { kind: "post", title: "Post" },
    { kind: "page", title: "About" },
    { kind: "post", title: "Another Post" },
  ]);

  assert.deepEqual(grouped.pages.map((item) => item.title), ["About"]);
  assert.deepEqual(grouped.posts.map((item) => item.title), ["Post", "Another Post"]);
});
