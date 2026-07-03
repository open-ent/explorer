/**
 * Entrée de montage « in-layout » (objectif CCTP 51C-2) — modèle ISOLÉ (option B).
 *
 * Ce bundle embarque SON PROPRE React (build auto-contenu, cf. mode `embed` de vite.config)
 * et expose `mount`/`unmount` : le dashboard (React 19) réserve un <div> dans son layout et
 * appelle `mount(div)` ; explorer y fait son `createRoot` avec son React 18 → totalement isolé
 * du React de l'hôte (aucun conflit 18↔19), sans iframe. `unmount` nettoie à la navigation.
 *
 * En mode `embedded`, le module masque SON PROPRE chrome (<Layout>) : l'hôte fournit déjà
 * header/menu. Sinon (montage plein écran), il rend son Layout comme l'app d'origine.
 */
import { Layout, LoadingScreen, useEdificeClient } from '@open-ent/react';
import { createRoot, type Root } from 'react-dom/client';

import Explorer from './components/Explorer';
import { getExplorerConfig } from './config';
import { Providers } from './providers';
import './i18n';
import '@open-ent/bootstrap/dist/index.css';

export interface MountContext {
  /** rendu headless dans le layout de l'hôte (le module masque son propre chrome). */
  embedded?: boolean;
}

/**
 * Racine « embarquable » : même logique que app/root (gate `init` via le client
 * Edifice + passage de la config), mais le <Layout> du module n'est rendu que
 * hors mode embarqué.
 */
function EmbeddableRoot({ embedded }: { embedded: boolean }) {
  const { init } = useEdificeClient();
  const config = getExplorerConfig();

  if (!init) return <LoadingScreen position={false} />;

  const explorer = <Explorer config={config} />;
  return embedded ? explorer : <Layout>{explorer}</Layout>;
}

const roots = new WeakMap<HTMLElement, Root>();

/**
 * En mode embarqué, le fond « décor » plein-cadre de la skin 1D est peint par
 * bootstrap sur `<html data-product data-skin>` — attributs posés globalement par
 * le ThemeProvider du module. Dans le dashboard hôte, ce décor bave sur toute la
 * page : on le neutralise (l'hôte possède le fond). Idempotent.
 */
function injectEmbeddedReset(): void {
  const id = 'openent-embed-reset';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent =
    'html[data-product][data-skin]{background-image:none!important;background-color:transparent!important}';
  document.head.appendChild(style);
}

export function mount(el: HTMLElement, ctx: MountContext = {}): void {
  const embedded = ctx.embedded ?? true;
  if (embedded) injectEmbeddedReset();
  const prev = roots.get(el);
  if (prev) prev.unmount();
  const root = createRoot(el);
  roots.set(el, root);
  root.render(
    <Providers>
      <EmbeddableRoot embedded={embedded} />
    </Providers>,
  );
}

export function unmount(el: HTMLElement): void {
  roots.get(el)?.unmount();
  roots.delete(el);
}
