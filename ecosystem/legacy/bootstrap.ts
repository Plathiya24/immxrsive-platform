import { paletteKeys, paletteShortcut } from "../components/palette-shortcut";

const header = document.querySelector<HTMLElement>(".site-header");
const demoTools = document.querySelector<HTMLElement>(".scenario-tools");

if (header || demoTools) {
  const search = document.createElement("button");
  search.type = "button";
  search.className = "ecosystem-palette-trigger secondary";
  search.setAttribute("aria-label", "Search ecosystem");
  search.setAttribute("aria-haspopup", "dialog");
  search.setAttribute("aria-keyshortcuts", "Meta+K Control+K");
  search.innerHTML = '<span class="ecosystem-search-icon" aria-hidden="true"></span><span>Search</span><kbd aria-hidden="true"></kbd>';
  search.querySelector("kbd")!.textContent = paletteKeys();

  if (header) {
    const mapLink = document.createElement("a");
    mapLink.href = "/ecosystem";
    mapLink.textContent = "Ecosystem";
    const nav = header.querySelector("nav");
    nav?.insertBefore(mapLink, nav.querySelector(".nav-staff"));
    header.classList.add("has-ecosystem-search");
  }
  (header ?? demoTools)?.append(search);

  let opening = false;
  async function open() {
    if (opening || document.querySelector(".ecosystem-palette")) return;
    const previous = document.activeElement;
    opening = true;
    try {
      const { mountPalette, trainerScope } = await import("./mount-palette");
      const useTrainerScope = demoTools || /^\/projects\/P01\/?$/i.test(window.location.pathname);
      mountPalette(previous instanceof HTMLElement && previous !== document.body ? previous : search,
        useTrainerScope ? trainerScope : undefined);
    } catch {
      window.location.assign("/ecosystem");
    } finally {
      opening = false;
    }
  }

  search.addEventListener("click", open);
  window.addEventListener("keydown", event => {
    if (!paletteShortcut(event)) return;
    event.preventDefault();
    void open();
  });
}
