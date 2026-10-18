import { InjectionToken } from '@angular/core';
import { todayIso } from '../../shared/format/dates';

/**
 * "Today" as yyyy-mm-dd, injectable so date rules (no future hire dates, no future-dated salary
 * changes) are testable without the wall clock — the same idea as the backend's Clock bean.
 */
export const TODAY = new InjectionToken<() => string>('TODAY', { providedIn: 'root', factory: () => todayIso });
