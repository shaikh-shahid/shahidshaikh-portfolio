const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const scriptPath = path.resolve(__dirname, "..", "static", "js", "code-copy.js");

function loadCopyScript() {
  assert.equal(fs.existsSync(scriptPath), true, "copy-code browser script is missing");
  return require(scriptPath);
}

function fixture(code = "const answer = 42;\n") {
  const listeners = {};
  const attributes = {};
  const container = {
    classList: { add() {} },
    prepend(element) {
      this.button = element;
    },
  };
  const pre = {
    textContent: code,
    dataset: {},
    closest() {
      return container;
    },
  };
  const document = {
    body: {
      appendChild(element) {
        this.child = element;
      },
      removeChild() {
        this.child = undefined;
      },
    },
    querySelectorAll() {
      return [pre];
    },
    createElement(tag) {
      if (tag === "textarea") {
        return {
          value: "",
          setAttribute() {},
          select() {},
          style: {},
        };
      }
      return {
        children: [],
        className: "",
        textContent: "",
        type: "",
        append(...elements) {
          this.children.push(...elements);
        },
        setAttribute(name, value) {
          attributes[name] = value;
        },
        addEventListener(name, handler) {
          listeners[name] = handler;
        },
      };
    },
  };

  return { attributes, container, document, listeners };
}

test("copy button copies only code and confirms success", async () => {
  const { addCopyButtons } = loadCopyScript();
  const page = fixture();
  let copied = "";
  const clipboard = { writeText: async (text) => { copied = text; } };

  addCopyButtons(page.document, clipboard, () => {});

  assert.equal(page.container.button.textContent, "Copy");
  assert.equal(page.attributes["aria-label"], "Copy code");
  await page.listeners.click();
  assert.equal(copied, "const answer = 42;\n");
  assert.equal(page.container.button.textContent, "Copied");
});

test("copy button reports failure without throwing", async () => {
  const { addCopyButtons } = loadCopyScript();
  const page = fixture();
  const clipboard = { writeText: async () => { throw new Error("denied"); } };

  addCopyButtons(page.document, clipboard, () => {});
  await page.listeners.click();

  assert.equal(page.container.button.textContent, "Copy failed");
});

test("copy button falls back when the Clipboard API is unavailable", async () => {
  const { addCopyButtons } = loadCopyScript();
  const page = fixture("fallback();");
  let fallbackUsed = false;
  page.document.execCommand = (command) => {
    fallbackUsed = command === "copy";
    return true;
  };

  addCopyButtons(page.document, undefined, () => {});
  await page.listeners.click();

  assert.equal(fallbackUsed, true);
  assert.equal(page.container.button.textContent, "Copied");
});

test("copy control stays minimal and reveals itself when useful", () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, "..", "assets", "css", "custom-home.css"),
    "utf8"
  );

  assert.doesNotMatch(css, /\.code-toolbar\s*{/);
  assert.doesNotMatch(css, /\.code-language-label\s*{/);
  assert.match(css, /\.code-block pre\s*{[\s\S]*?padding-block-start:\s*1rem/);
  assert.match(css, /\.code-copy-button\s*{[\s\S]*?position:\s*absolute/);
  assert.match(css, /\.code-copy-button\s*{[\s\S]*?opacity:\s*0/);
  assert.match(css, /@media \(hover:\s*none\)[\s\S]*?\.code-copy-button\s*{[\s\S]*?opacity:\s*1/);
  assert.match(css, /\.code-block pre code\[class\*="language-"\]::before\s*{[\s\S]*?content:\s*none/);
});
