import { MatIconRegistry } from '@angular/material/icon';
import { of } from 'rxjs';

/** Icons are fetched over HTTP in the app; tests render them as empty SVGs. */
export const fakeIcons = {
  provide: MatIconRegistry,
  useValue: {
    getNamedSvgIcon: () => of(document.createElementNS('http://www.w3.org/2000/svg', 'svg')),
    getDefaultFontSetClass: () => [],
    getFontSetClassName: (name: string) => name,
  },
};
