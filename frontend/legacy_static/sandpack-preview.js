/**
 * Sandpack browser preview for React / Vue (HTML uses iframe.srcdoc in main.js).
 * Loads @codesandbox/sandpack-client from esm.sh — page should be served over http(s), not file://.
 */

let _client = null;

export function destroySandpack() {
  if (_client && typeof _client.destroy === "function") {
    try {
      _client.destroy();
    } catch {
      /* ignore */
    }
  }
  _client = null;
}

function wrapReact(code) {
  const c = code.trim();
  if (!c) return `import React from "react";\nexport default function App() { return <p>Empty</p>; }`;
  if (/^import\s+React/m.test(c) || /from\s+["']react["']/.test(c)) return c;
  return `import React from "react";\n${c}`;
}

export async function mountSandpack(iframeEl, framework, code) {
  destroySandpack();
  if (!iframeEl || !code?.trim()) return;

  const { SandpackClient } = await import(
    "https://esm.sh/@codesandbox/sandpack-client@2.13.0?bundle"
  );

  if (framework === "react") {
    const files = {
      "/App.js": { code: wrapReact(code) },
    };
    _client = new SandpackClient(
      iframeEl,
      { files, template: "react" },
      { bundlerURL: "https://sandpack-cdn-v2.codesandbox.io/" },
    );
    return;
  }

  if (framework === "vue") {
    const files = {
      "/src/App.vue": { code: code.trim() },
    };
    _client = new SandpackClient(
      iframeEl,
      { files, template: "vue" },
      { bundlerURL: "https://sandpack-cdn-v2.codesandbox.io/" },
    );
    return;
  }
}
