/**
 * Shared utility to mark background content as `inert` while a modal or
 * drawer is open. Uses a reference counter so nested/stacked modals work
 * correctly.
 */

let inertCount = 0;
let inertedElements: HTMLElement[] = [];

export function acquireInert() {
  if (inertCount === 0) {
    const targets = (
      [
        document.getElementById("main-content"),
        document.querySelector("footer"),
        document.querySelector("nav[aria-label='Main navigation']"),
      ] as (HTMLElement | null)[]
    ).filter(Boolean) as HTMLElement[];
    targets.forEach((el) => el.setAttribute("inert", ""));
    inertedElements = targets;
  }
  inertCount++;
}

export function releaseInert() {
  inertCount = Math.max(0, inertCount - 1);
  if (inertCount === 0) {
    inertedElements.forEach((el) => el.removeAttribute("inert"));
    inertedElements = [];
  }
}
