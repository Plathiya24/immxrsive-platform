import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { CommandPalette } from "../components/CommandPalette";
import { EcosystemMap } from "../components/EcosystemMap";
import { EcosystemStatusBadge } from "../components/EcosystemStatusBadge";
import { paletteKeys, paletteShortcut } from "../components/palette-shortcut";
import { ecosystemEntities, entityById } from "../data/ecosystem";
import { pillars, statuses, type EcosystemEntity } from "../types/ecosystem";

const initialEntity = ecosystemEntities[1];

export default function EcosystemPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(initialEntity);
  const [palette, setPalette] = useState(false);
  const [keys, setKeys] = useState("Ctrl K");
  const search = useRef<HTMLButtonElement>(null);
  const details = useRef<HTMLHeadingElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  function openPalette() {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPalette(true);
  }

  function closePalette() {
    setPalette(false);
    requestAnimationFrame(() => {
      if (previousFocus.current?.isConnected && previousFocus.current !== document.body) previousFocus.current.focus();
      else search.current?.focus();
    });
  }

  useEffect(() => {
    function syncSelection() {
      setSelected(entityById.get(window.location.hash.slice(1)) ?? initialEntity);
    }
    function shortcut(event: KeyboardEvent) {
      if (!paletteShortcut(event)) return;
      event.preventDefault();
      if (!document.querySelector(".ecosystem-palette[open]")) openPalette();
    }
    syncSelection();
    setKeys(paletteKeys());
    window.addEventListener("hashchange", syncSelection);
    window.addEventListener("popstate", syncSelection);
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("hashchange", syncSelection);
      window.removeEventListener("popstate", syncSelection);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);

  function navigate(entity: EcosystemEntity, focusDetails = false) {
    if (focusDetails) flushSync(() => setPalette(false));
    function update() {
      flushSync(() => setSelected(entity));
      if (window.location.hash !== "#" + entity.id) {
        void router.push(entity.href, undefined, { shallow: true, scroll: false }).catch(() => {
          window.location.assign(entity.href);
        });
      }
      if (focusDetails) details.current?.focus();
    }
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const transition = document.startViewTransition(update);
      // The browser may skip the animation while another transition is ending.
      void transition.ready.catch(() => {});
    } else {
      update();
    }
  }

  function follow(event: MouseEvent<HTMLAnchorElement>, id: string, focusDetails = false) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const entity = entityById.get(id);
    if (entity) navigate(entity, focusDetails);
  }

  return (
    <>
      <Head>
        <title>Ecosystem map · ImmXrsive</title>
        <meta name="description" content="Explore example connections between Algoma research labs, student teams, ventures, and industry partners." />
      </Head>
      <a className="map-skip" href="#map-content">Skip to content</a>
      <header className="map-header">
        <div className="map-wrap flex flex-wrap items-center gap-x-6 gap-y-1">
          <a href="/" className="map-brand" aria-label="ImmXrsive home">Imm<span>X</span>rsive</a>
          <nav aria-label="Main navigation" className="map-nav flex flex-wrap items-center gap-1">
            <a href="/projects">Projects</a>
            <a href="/talent">Talent</a>
            <a href="/partners">Industry partners</a>
            <a href="/ecosystem" aria-current="page">Ecosystem</a>
            <a href="/staff">Staff</a>
            <a href="/studio">Student studio</a>
          </nav>
          <button ref={search} type="button" className="ecosystem-palette-trigger" aria-label="Search ecosystem" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K" onClick={openPalette}>
            <span className="ecosystem-search-icon" aria-hidden="true" />
            <span>Search</span>
            <kbd aria-hidden="true">{keys}</kbd>
          </button>
        </div>
      </header>
      <main id="map-content" className="map-wrap">
        <div className="map-intro">
          <h1>Ecosystem map</h1>
          <p>Explore how Algoma’s research, student teams, accelerators, and industry partners could connect.</p>
          <p className="map-sample-note">Sample records and relationships for demonstration.</p>
        </div>
        <div className="map-layout">
          <section className="map-board" aria-label="Interactive connection map">
            <h2>Select a connection</h2>
            <EcosystemMap selected={selected} onSelect={navigate} />
          </section>
          <section className="map-details" aria-label="Selected record">
            <div aria-live="polite">
              <p className="map-detail-type">{pillars[selected.pillar]} · {statuses[selected.status]}</p>
              <h2 ref={details} tabIndex={-1}>{selected.name}</h2>
              <ul className="map-tags flex flex-wrap gap-2" aria-label="Topics">
                {selected.tags.map(tag => <li key={tag}>{tag}</li>)}
              </ul>
            </div>
            <h3>Connected records</h3>
            <ul className="map-relationships">
              {selected.connectedIds.map(id => {
                const entity = entityById.get(id);
                return entity && <li key={id}><a href={entity.href} onClick={event => follow(event, id)}>{entity.name}</a></li>;
              })}
            </ul>
          </section>
        </div>
        <section className="map-records" aria-labelledby="map-records-title">
          <h2 id="map-records-title">Ecosystem records</h2>
          <div className="map-bento">
            {ecosystemEntities.map(entity => (
              <article className="map-bento-card" key={entity.id}>
                <div className="map-bento-meta">
                  <span>{pillars[entity.pillar]}</span>
                  <EcosystemStatusBadge status={entity.status} />
                </div>
                <h3><a href={entity.href} onClick={event => follow(event, entity.id, true)}>{entity.name}</a></h3>
              </article>
            ))}
          </div>
        </section>
      </main>
      {palette && <CommandPalette onClose={closePalette} onNavigate={entity => navigate(entity, true)} />}
    </>
  );
}
