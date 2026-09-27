(function (createCodeCopy) {
  const codeCopy = createCodeCopy();

  if (typeof module === "object" && module.exports) {
    module.exports = codeCopy;
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    codeCopy.addCopyButtons(document, navigator.clipboard);
  });
})(function () {
  function fallbackCopy(text, documentRoot) {
    const textarea = documentRoot.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    documentRoot.body.appendChild(textarea);
    textarea.select();
    const copied = documentRoot.execCommand("copy");
    documentRoot.body.removeChild(textarea);

    if (!copied) throw new Error("Copy command failed");
  }

  async function copyText(text, documentRoot, clipboard) {
    if (clipboard && typeof clipboard.writeText === "function") {
      await clipboard.writeText(text);
      return;
    }

    fallbackCopy(text, documentRoot);
  }

  function addCopyButtons(documentRoot, clipboard, schedule = setTimeout) {
    for (const pre of documentRoot.querySelectorAll(".post-content pre")) {
      if (pre.dataset.copyButtonInitialized) continue;
      pre.dataset.copyButtonInitialized = "true";

      const container = pre.closest(".highlight, .code-block");
      if (!container) continue;
      container.classList.add("code-block");

      const button = documentRoot.createElement("button");
      button.type = "button";
      button.className = "code-copy-button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code");
      button.setAttribute("aria-live", "polite");

      button.addEventListener("click", async () => {
        try {
          await copyText(pre.textContent, documentRoot, clipboard);
          button.textContent = "Copied";
        } catch {
          button.textContent = "Copy failed";
        }

        schedule(() => {
          button.textContent = "Copy";
        }, 2000);
      });

      container.prepend(button);
    }
  }

  return { addCopyButtons };
});
