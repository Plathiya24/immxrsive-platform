import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { CommandPalette, type PaletteScope } from "../components/CommandPalette";
import { EcosystemConnectionMap } from "../components/EcosystemConnectionMap";
import { EcosystemStatusBadge } from "../components/EcosystemStatusBadge";
import { paletteKeys, paletteShortcut } from "../components/palette-shortcut";
import { ecosystemEntities, ecosystemRecordHref, entityById } from "../data/ecosystem";
import { pillars, statuses, type EcosystemEntity, type EcosystemPillar } from "../types/ecosystem";

const initialEntity = ecosystemEntities[1];

export default function EcosystemPage({ briefId }: { briefId?: string }) {
  const router = useRouter();
  const [selection, setSelection] = useState(initialEntity);
  const brief = briefId ? entityById.get(briefId) : undefined;
  const selected = brief ?? selection;
  const [highlight, setHighlight] = useState<EcosystemPillar>();
  const highlightedRecords = new Set(highlight
    ? ecosystemEntities.filter(entity => entity.pillar === highlight).flatMap(entity => entity.connectedIds)
    : []);
  const [palette, setPalette] = useState<{ scope?: PaletteScope }>();
  const [keys, setKeys] = useState("Ctrl K");
  const search = useRef<HTMLButtonElement>(null);
  const details = useRef<HTMLHeadingElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  function openPalette(scope?: PaletteScope) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPalette({ scope });
  }

  function closePalette() {
    setPalette(undefined);
    requestAnimationFrame(() => {
      if (previousFocus.current?.isConnected && previousFocus.current !== document.body) previousFocus.current.focus();
      else search.current?.focus();
    });
  }

  useEffect(() => {
    function syncSelection() {
      setSelection(entityById.get(window.location.hash.slice(1)) ?? initialEntity);
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

  function navigate(entity: EcosystemEntity) {
    const target = brief ? ecosystemRecordHref(entity) : entity.href;
    async function update() {
      flushSync(() => {
        setPalette(undefined);
        setSelection(entity);
      });
      if (router.asPath !== target) {
        try {
          const completed = await router.push(target, undefined, { shallow: !brief, scroll: false });
          if (!completed) return;
        } catch {
          window.location.assign(target);
          return;
        }
      }
      details.current?.focus();
    }
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const transition = document.startViewTransition(update);
      // The browser may skip the animation while another transition is ending.
      void transition.ready.catch(() => {});
    } else {
      void update();
    }
  }

  function follow(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const entity = entityById.get(id);
    if (entity) navigate(entity);
  }

  return (
    <>
      <Head>
        <title>{brief ? brief.name + " · ImmXrsive" : "Ecosystem map · ImmXrsive"}</title>
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
          <button ref={search} type="button" className="ecosystem-palette-trigger" aria-label="Search ecosystem" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K" onClick={() => openPalette()}>
            <span className="ecosystem-search-icon" aria-hidden="true" />
            <span>Search</span>
            <kbd aria-hidden="true">{keys}</kbd>
          </button>
        </div>
      </header>
      <main id="map-content" className="map-wrap">
        {brief ? (
          <div className="map-intro map-intro-brief">
            <a href="/ecosystem">← Ecosystem map</a>
            <p className="map-sample-note">Lab and venture briefs, statuses, and relationships are illustrative.</p>
          </div>
        ) : <div className="map-intro">
          <h1>Ecosystem map</h1>
          <p>Explore how Algoma’s research, student teams, accelerators, and industry partners could connect.</p>
          <p className="map-sample-note">Lab and venture briefs, statuses, and relationships are illustrative.</p>
        </div>}
        <div className={brief ? "map-layout map-layout-brief" : "map-layout"}>
          {!brief && (
            <EcosystemConnectionMap
              entities={ecosystemEntities}
              onExplore={pillar => openPalette({ pillar })}
              onHighlight={setHighlight}
            />
          )}
          <section className="map-details" id="ecosystem-detail" aria-label="Selected record">
            <div aria-live="polite">
              <p className="map-detail-type">{pillars[selected.pillar]} · {statuses[selected.status]}</p>
              {brief
                ? <h1 ref={details} tabIndex={-1}>{selected.name}</h1>
                : <h2 ref={details} tabIndex={-1}>{selected.name}</h2>}
              {selected.summary && <p className="map-detail-summary">{selected.summary}</p>}
              <ul className="map-tags flex flex-wrap gap-2" aria-label="Topics">
                {selected.tags.map(tag => <li key={tag}>{tag}</li>)}
              </ul>
              {selected.resource && <a className="map-resource" href={selected.resource.href}>{selected.resource.label}</a>}
              {!brief && <a className="map-resource" href={ecosystemRecordHref(selected)}>Open brief</a>}
            </div>
            <h2 className="map-relationships-title">Connected records</h2>
            <ul className="map-relationships">
              {selected.connectedIds.map(id => {
                const entity = entityById.get(id);
                return entity && <li key={id}><a href={brief ? ecosystemRecordHref(entity) : entity.href} onClick={event => follow(event, id)}>{entity.name}</a></li>;
              })}
            </ul>
          </section>
        </div>
        {!brief && <section className="map-records" aria-labelledby="map-records-title">
          <h2 id="map-records-title">Ecosystem records</h2>
          <div className="map-bento">
            {ecosystemEntities.map(entity => (
              <article
                className="map-bento-card"
                key={entity.id}
                data-state={!highlight ? undefined : entity.pillar === highlight ? "active" : highlightedRecords.has(entity.id) ? "related" : "muted"}
              >
                <div className="map-bento-meta">
                  <span>{pillars[entity.pillar]}</span>
                  <EcosystemStatusBadge status={entity.status} />
                </div>
                <h3><a href={entity.href} onClick={event => follow(event, entity.id)}>{entity.name}</a></h3>
              </article>
            ))}
          </div>
        </section>}
      </main>
      {palette && <CommandPalette initialScope={palette.scope} onClose={closePalette} onNavigate={navigate} />}
    </>
  );
}
