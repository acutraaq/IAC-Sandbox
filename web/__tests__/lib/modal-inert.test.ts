import { describe, it, expect, vi, afterEach } from "vitest";

function setupDOM() {
  document.body.innerHTML = `
    <div id="main-content">Main</div>
    <footer>Footer</footer>
    <nav aria-label="Main navigation">Nav</nav>
  `;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("modal-inert", () => {
  it("sets inert on main-content, footer, and nav on first acquire", async () => {
    vi.resetModules();
    setupDOM();
    const { acquireInert } = await import("@/lib/modal-inert");
    acquireInert();
    expect(document.getElementById("main-content")?.getAttribute("inert")).toBe("");
    expect(document.querySelector("footer")?.getAttribute("inert")).toBe("");
    expect(document.querySelector("nav[aria-label='Main navigation']")?.getAttribute("inert")).toBe("");
  });

  it("does not double-set inert on subsequent acquires", async () => {
    vi.resetModules();
    setupDOM();
    const { acquireInert } = await import("@/lib/modal-inert");
    acquireInert();
    acquireInert();
    const main = document.getElementById("main-content");
    expect(main?.getAttribute("inert")).toBe("");
  });

  it("releaseInert does not remove inert until count reaches zero", async () => {
    vi.resetModules();
    setupDOM();
    const { acquireInert, releaseInert } = await import("@/lib/modal-inert");
    acquireInert();
    acquireInert();
    releaseInert();
    expect(document.getElementById("main-content")?.getAttribute("inert")).toBe("");
    releaseInert();
    expect(document.getElementById("main-content")?.hasAttribute("inert")).toBe(false);
    expect(document.querySelector("footer")?.hasAttribute("inert")).toBe(false);
    expect(document.querySelector("nav[aria-label='Main navigation']")?.hasAttribute("inert")).toBe(false);
  });

  it("releaseInert is safe when called without acquire", async () => {
    vi.resetModules();
    setupDOM();
    const { releaseInert } = await import("@/lib/modal-inert");
    releaseInert();
    expect(document.getElementById("main-content")?.hasAttribute("inert")).toBe(false);
  });

  it("handles missing DOM elements gracefully", async () => {
    vi.resetModules();
    document.body.innerHTML = "";
    const { acquireInert, releaseInert } = await import("@/lib/modal-inert");
    expect(() => {
      acquireInert();
      releaseInert();
    }).not.toThrow();
  });
});
