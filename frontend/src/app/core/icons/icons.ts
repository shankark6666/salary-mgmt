import { inject, provideAppInitializer } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Lucide icons, copied from `lucide-static` into /icons at build time (angular.json) and served
 * from our own origin. Only names on this list resolve, so the one sanitizer bypass below can
 * only ever produce a URL to a file we ship.
 */
export const ICONS = [
  'chart-column', 'users', 'log-out', 'search', 'x', 'plus', 'download', 'pencil', 'wallet',
  'user-x', 'arrow-left', 'chevron-left', 'chevron-right', 'arrow-up', 'arrow-down',
  'arrow-up-down', 'triangle-alert',
] as const;

export type IconName = (typeof ICONS)[number];

export function provideIcons() {
  return provideAppInitializer(() => {
    const registry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    const known = new Set<string>(ICONS);
    registry.addSvgIconResolver((name) =>
      known.has(name)
        // eslint-disable-next-line no-restricted-syntax -- allow-listed static asset path
        ? sanitizer.bypassSecurityTrustResourceUrl(`icons/${name}.svg`)
        : null,
    );
  });
}
