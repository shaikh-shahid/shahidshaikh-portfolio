const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const BLOG_DIR = path.join(ROOT, "content", "blog");
const PORT = Number(process.env.SITE_MANAGER_PORT || 4321);

function escapeToml(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function unquoteToml(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return trimmed;
}

function parseTags(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return [];
  return trimmed
    .slice(1, -1)
    .split(",")
    .map((tag) => unquoteToml(tag.trim()))
    .filter(Boolean);
}

function parsePost(source) {
  const tomlMatch = source.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n?([\s\S]*)$/);
  const yamlMatch = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const match = tomlMatch || yamlMatch;
  if (!match) {
    return {
      date: "",
      draft: false,
      title: "Untitled",
    tags: [],
    description: "",
    extraFrontMatter: "",
    body: source,
  };
  }

  const post = {
    date: "",
    draft: false,
    title: "Untitled",
    tags: [],
    description: "",
    extraFrontMatter: "",
    body: match[2],
  };

  const extraLines = [];
  let collectingExtra = false;
  for (const line of match[1].split("\n")) {
    const separator = tomlMatch ? line.indexOf("=") : line.indexOf(":");
    const trimmed = line.trim();
    if (collectingExtra) {
      extraLines.push(line);
      continue;
    }
    if (trimmed.startsWith("[") || separator === -1) {
      if (trimmed) collectingExtra = true;
      if (collectingExtra) extraLines.push(line);
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key === "title") post.title = unquoteToml(value);
    else if (key === "date") post.date = unquoteToml(value);
    else if (key === "description") post.description = unquoteToml(value);
    else if (key === "draft") post.draft = value === "true";
    else if (key === "tags") post.tags = parseTags(value);
    else {
      collectingExtra = true;
      extraLines.push(line);
    }
  }

  post.extraFrontMatter = extraLines.join("\n").replace(/\s+$/, "");

  return post;
}

function contentFileFor(item) {
  const kind = item.kind === "page" ? "page" : "post";
  const slug = slugify(item.slug || item.title || "untitled");
  if (kind === "page") return path.join("content", `${slug}.md`);
  return path.join("content", "blog", slug, "index.md");
}

function serializePost(post) {
  const tags = Array.isArray(post.tags)
    ? post.tags.map((tag) => `'${escapeToml(tag)}'`).join(", ")
    : "";
  const body = String(post.body || "").replace(/\s*$/, "\n");
  const extraFrontMatter = String(post.extraFrontMatter || "").trim();
  const extra = extraFrontMatter ? `\n${extraFrontMatter}` : "";

  return `+++
date = '${escapeToml(post.date)}'
draft = ${post.draft ? "true" : "false"}
title = '${escapeToml(post.title)}'
description = '${escapeToml(post.description)}'
tags = [${tags}]
${extra}
+++
${body}`;
}

function slugify(input) {
  return String(input || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

function sanitizeImageName(input) {
  const original = path.basename(String(input || "image"));
  const extension = path.extname(original).toLowerCase();
  const allowed = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
  const safeExtension = allowed.has(extension) ? extension : ".png";
  const base = original.slice(0, original.length - path.extname(original).length);
  return `${slugify(base)}${safeExtension}`;
}

function imagePathFor(fileName) {
  return path.join("static", "images", "uploads", sanitizeImageName(fileName));
}

async function saveImage(payload) {
  const match = String(payload.data || "").match(/^data:(image\/(?:png|jpeg|gif|webp));base64,(.+)$/);
  if (!match) throw new Error("Upload a PNG, JPG, GIF, or WebP image.");
  const fileName = sanitizeImageName(payload.name || "image.png");
  const relativePath = imagePathFor(fileName);
  const filePath = path.join(ROOT, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(match[2], "base64"));
  return { fileName, path: `/images/uploads/${fileName}` };
}

async function readPost(slug) {
  const filePath = path.join(BLOG_DIR, slug, "index.md");
  const source = await fs.readFile(filePath, "utf8");
  return { slug, ...parsePost(source) };
}

async function readContentItem(kind, slug) {
  const relativePath = contentFileFor({ kind, slug });
  const source = await fs.readFile(path.join(ROOT, relativePath), "utf8");
  return {
    kind: kind === "page" ? "page" : "post",
    slug,
    path: relativePath,
    ...parsePost(source),
  };
}

async function listPosts() {
  const entries = await fs.readdir(BLOG_DIR, { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      posts.push(await readPost(entry.name));
    } catch {
      // Ignore folders that are not leaf-bundle posts.
    }
  }
  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return posts;
}

async function listPages() {
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  const pages = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const slug = entry.name.replace(/\.md$/, "");
    try {
      pages.push(await readContentItem("page", slug));
    } catch {
      // Ignore unreadable content files.
    }
  }
  pages.sort((a, b) => a.title.localeCompare(b.title));
  return pages;
}

async function listContent() {
  const [pages, posts] = await Promise.all([listPages(), listPosts()]);
  return [
    ...pages,
    ...posts.map((post) => ({
      kind: "post",
      path: contentFileFor({ kind: "post", slug: post.slug }),
      ...post,
    })),
  ];
}

function groupContent(items) {
  return {
    pages: items.filter((item) => item.kind === "page"),
    posts: items.filter((item) => item.kind === "post"),
  };
}

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function savePost(payload) {
  const title = String(payload.title || "Untitled").trim() || "Untitled";
  const slug = slugify(payload.slug || title);
  const dir = path.join(BLOG_DIR, slug);
  const filePath = path.join(dir, "index.md");
  const post = {
    title,
    date: payload.date || new Date().toISOString(),
    draft: Boolean(payload.draft),
    description: payload.description || "",
    extraFrontMatter: payload.extraFrontMatter || "",
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : String(payload.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    body: payload.body || "",
  };

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, serializePost(post), "utf8");
  return { slug, path: path.relative(ROOT, filePath), ...post };
}

async function saveContent(payload) {
  const kind = payload.kind === "page" ? "page" : "post";
  const title = String(payload.title || "Untitled").trim() || "Untitled";
  const slug = slugify(payload.slug || title);
  const relativePath = contentFileFor({ kind, slug });
  const filePath = path.join(ROOT, relativePath);
  const post = {
    title,
    date: payload.date || new Date().toISOString(),
    draft: Boolean(payload.draft),
    description: payload.description || "",
    extraFrontMatter: payload.extraFrontMatter || "",
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : String(payload.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    body: payload.body || "",
  };

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, serializePost(post), "utf8");
  return { kind, slug, path: relativePath, ...post };
}

function page() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/manager/toastui-editor.css">
  <title>Shahid Site Manager</title>
  <style>
    :root { color-scheme: light; --accent: #dc143c; --text: #202124; --muted: #686868; --line: #dedede; --panel: #f8f8f8; }
    * { box-sizing: border-box; }
    body { margin: 0; font: 16px/1.55 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--text); background: #fff; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); }
    h1 { margin: 0; font-size: 1.2rem; }
    main { display: grid; grid-template-columns: minmax(230px, 0.8fr) minmax(0, 2fr); min-height: calc(100vh - 65px); }
    aside { border-right: 1px solid var(--line); background: var(--panel); padding: 1rem; overflow: auto; }
    section { padding: 1rem; }
    button, input, select, textarea { font: inherit; }
    button { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: 8px; padding: 0.45rem 0.75rem; cursor: pointer; font-weight: 700; }
    button.secondary { color: var(--accent); background: #fff; }
    .content-filter { margin-top: 1rem; }
    .content-filter select { margin-top: 0.35rem; }
    .content-list { display: grid; gap: 0.45rem; }
    .content-list button { width: 100%; color: var(--text); background: #fff; border-color: var(--line); text-align: left; font-weight: 600; }
    .content-list small { display: block; color: var(--muted); font-weight: 400; }
    form { display: grid; gap: 0.8rem; max-width: 920px; }
    label { display: grid; gap: 0.25rem; color: var(--muted); font-size: 0.9rem; font-weight: 700; }
    input, select, textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 0.6rem 0.7rem; color: var(--text); background: #fff; }
    textarea { min-height: 44vh; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; line-height: 1.55; }
    textarea.front-matter { min-height: 10rem; }
    .editor-tabs { display: flex; gap: 0.4rem; border-bottom: 1px solid var(--line); }
    .editor-tab { border: 0; border-radius: 0; color: var(--muted); background: transparent; }
    .editor-tab.active { color: var(--accent); border-bottom: 2px solid var(--accent); }
    .editor-panel { display: none; padding-top: 0.8rem; }
    .editor-panel.active { display: block; }
    .wysiwyg-editor { min-height: 52vh; }
    .preview-pane { min-height: 52vh; overflow: auto; border: 1px solid var(--line); border-radius: 8px; padding: 1rem; background: #fff; }
    .preview-pane pre { overflow: auto; padding: 0.7rem; background: #202124; color: #f6f6f6; border-radius: 6px; }
    .preview-pane img { max-width: 100%; }
    .advanced-fields { border: 1px solid var(--line); border-radius: 8px; padding: 0.65rem 0.8rem; }
    .advanced-fields summary { cursor: pointer; color: var(--muted); font-weight: 700; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
    .toolbar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .status { color: var(--muted); }
    @media (max-width: 800px) { main { grid-template-columns: 1fr; } aside { border-right: 0; border-bottom: 1px solid var(--line); } .row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>Site Manager</h1>
    <div class="toolbar">
      <button id="newPage" class="secondary">New page</button>
      <button id="newPost" class="secondary">New post</button>
      <a href="http://localhost:1313/" target="_blank" rel="noreferrer">Preview site</a>
    </div>
  </header>
  <main>
    <aside>
      <strong>Content</strong>
      <label class="content-filter">Show
        <select id="contentFilter">
          <option value="post">Posts</option>
          <option value="page">Pages</option>
        </select>
      </label>
      <div id="contentList" class="content-list"></div>
    </aside>
    <section>
      <form id="editor">
        <div class="row">
          <label>Type
            <select name="kind">
              <option value="page">Page</option>
              <option value="post">Blog post</option>
            </select>
          </label>
          <label>Title <input name="title" required></label>
        </div>
        <div class="row">
          <label>Slug <input name="slug" placeholder="auto-from-title"></label>
          <label>Date <input name="date"></label>
        </div>
        <div class="row">
          <label>Tags <input name="tags" placeholder="ai, systems, go"></label>
          <label>Description <input name="description"></label>
        </div>
        <label><span><input name="draft" type="checkbox" style="width:auto"> Draft</span></label>
        <details class="advanced-fields">
          <summary>Additional front matter (advanced)</summary>
          <textarea class="front-matter" name="extraFrontMatter" spellcheck="false" placeholder="Optional Hugo/TOML sections such as [params] or [[params.items]]"></textarea>
        </details>
        <div class="editor-tabs" role="tablist" aria-label="Editor view">
          <button type="button" class="editor-tab active" data-editor-tab="edit" role="tab" aria-selected="true">Edit</button>
          <button type="button" class="editor-tab" data-editor-tab="preview" role="tab" aria-selected="false">Preview</button>
        </div>
        <div class="editor-panel active" data-editor-panel="edit">
          <label>Body</label>
          <div id="wysiwygEditor" class="wysiwyg-editor"></div>
          <textarea name="body" id="bodyEditor" hidden></textarea>
        </div>
        <div class="editor-panel" data-editor-panel="preview">
          <div id="bodyPreview" class="preview-pane" aria-live="polite"></div>
        </div>
        <div class="toolbar">
          <button type="submit">Save content</button>
          <span id="status" class="status"></span>
        </div>
      </form>
    </section>
  </main>
  <script>
    const contentList = document.querySelector("#contentList");
    const contentFilter = document.querySelector("#contentFilter");
    const editor = document.querySelector("#editor");
    const status = document.querySelector("#status");
    let contentItems = [];
    window.siteManagerState = { dirty: false };

    function hasUnsavedChanges() {
      return window.siteManagerState.dirty;
    }

    function markUnsavedChanges() {
      window.siteManagerState.dirty = true;
      status.textContent = "Unsaved changes";
    }

    function setPost(post = {}) {
      editor.kind.value = post.kind || "post";
      editor.title.value = post.title || "";
      editor.slug.value = post.slug || "";
      editor.date.value = post.date || new Date().toISOString();
      editor.tags.value = (post.tags || []).join(", ");
      editor.description.value = post.description || "";
      editor.extraFrontMatter.value = post.extraFrontMatter || "";
      editor.draft.checked = post.draft ?? true;
      editor.body.value = post.body || "";
      if (window.siteEditor) window.siteEditor.setMarkdown(post.body || "");
      window.siteManagerState.dirty = false;
      status.textContent = "";
    }

    function selectPost(post) {
      if (hasUnsavedChanges() && !window.confirm("Discard unsaved changes?")) return;
      setPost(post);
    }

    async function loadPosts() {
      const response = await fetch("/api/content");
      const data = await response.json();
      contentItems = data.items;
      renderContent();
    }

    function renderContent() {
      contentList.innerHTML = "";
      const selectedKind = contentFilter.value;
      for (const post of contentItems.filter((item) => item.kind === selectedKind)) {
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = post.title + "<small>" + post.path + "</small>";
        button.addEventListener("click", () => selectPost(post));
        contentList.append(button);
      }
    }

    document.querySelector("#newPage").addEventListener("click", () => selectPost({ kind: "page" }));
    document.querySelector("#newPost").addEventListener("click", () => selectPost({ kind: "post" }));
    contentFilter.addEventListener("change", renderContent);
    editor.addEventListener("input", markUnsavedChanges);
    editor.addEventListener("change", markUnsavedChanges);
    editor.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "Saving...";
      const form = new FormData(editor);
      const payload = Object.fromEntries(form.entries());
      payload.draft = editor.draft.checked;
      payload.tags = payload.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      payload.body = window.siteEditor ? window.siteEditor.getMarkdown() : editor.body.value;
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        status.textContent = data.error || "Could not save";
        return;
      }
      status.textContent = "Saved " + data.item.path;
      setPost(data.item);
      await loadPosts();
    });

  </script>
  <script src="/manager/toastui-editor.js"></script>
  <script>
    (() => {
      const bodyEditor = document.querySelector("#bodyEditor");
      const bodyPreview = document.querySelector("#bodyPreview");
      const editorHost = document.querySelector("#wysiwygEditor");
      const tabs = [...document.querySelectorAll("[data-editor-tab]")];
      const panels = [...document.querySelectorAll("[data-editor-panel]")];
      let editorInstance;

      function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      async function uploadImage(blob, callback) {
        const response = await fetch("/api/images", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: blob.name || "image.png", data: await blobToDataUrl(blob) }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Image upload failed");
        callback(data.image.path, blob.name || "Uploaded image");
      }

      if (window.toastui && window.toastui.Editor) {
        editorInstance = new window.toastui.Editor({
          el: editorHost,
          height: "52vh",
          initialEditType: "wysiwyg",
          previewStyle: "tab",
          usageStatistics: false,
          hooks: { addImageBlobHook: uploadImage },
        });
        editorInstance.on("change", () => {
          window.siteManagerState.dirty = true;
          document.querySelector("#status").textContent = "Unsaved changes";
        });
      } else {
        bodyEditor.hidden = false;
        bodyEditor.style.minHeight = "52vh";
        bodyEditor.placeholder = "Toast UI could not load; Markdown editing is available here.";
      }

      window.siteEditor = {
        getMarkdown: () => editorInstance ? editorInstance.getMarkdown() : bodyEditor.value,
        setMarkdown: (value) => {
          bodyEditor.value = value || "";
          if (editorInstance) editorInstance.setMarkdown(bodyEditor.value);
          bodyPreview.innerHTML = editorInstance ? editorInstance.getHTML() : "<pre>" + bodyEditor.value + "</pre>";
        },
        refreshPreview: () => {
          bodyPreview.innerHTML = editorInstance ? editorInstance.getHTML() : "<pre>" + bodyEditor.value + "</pre>";
        },
      };

      for (const tab of tabs) {
        tab.addEventListener("click", () => {
          const selected = tab.dataset.editorTab;
          if (selected === "preview") window.siteEditor.refreshPreview();
          for (const current of tabs) {
            const active = current === tab;
            current.classList.toggle("active", active);
            current.setAttribute("aria-selected", String(active));
          }
          for (const panel of panels) panel.classList.toggle("active", panel.dataset.editorPanel === selected);
        });
      }

      window.addEventListener("beforeunload", (event) => {
        if (!hasUnsavedChanges()) return;
        event.preventDefault();
        event.returnValue = "";
      });

      loadPosts().then(() => setPost({ kind: "post" }));
    })();
  </script>
</body>
</html>`;
}

async function handler(request, response) {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(page());
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/posts") {
      json(response, 200, { posts: await listPosts() });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/content") {
      json(response, 200, { items: await listContent() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/posts") {
      const post = await savePost(await readJson(request));
      json(response, 200, { post, path: post.path });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/content") {
      const item = await saveContent(await readJson(request));
      json(response, 200, { item, path: item.path });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/images") {
      const image = await saveImage(await readJson(request));
      json(response, 200, { image });
      return;
    }
    json(response, 404, { error: "Not found" });
  } catch (error) {
    json(response, 500, { error: error.message });
  }
}

function start() {
  http.createServer(handler).listen(PORT, "127.0.0.1", () => {
    console.log(`Site manager: http://localhost:${PORT}/`);
  });
}

if (require.main === module) start();

module.exports = {
  contentFileFor,
  groupContent,
  imagePathFor,
  parsePost,
  sanitizeImageName,
  serializePost,
  slugify,
};
