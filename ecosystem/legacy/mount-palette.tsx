import { createRoot } from "react-dom/client";
import { CommandPalette } from "../components/CommandPalette";

export function mountPalette(previous: HTMLElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  root.render(
    <CommandPalette
      onClose={() => {
        root.unmount();
        host.remove();
        if (previous.isConnected) previous.focus();
      }}
      onNavigate={entity => window.location.assign(entity.href)}
    />,
  );
}
