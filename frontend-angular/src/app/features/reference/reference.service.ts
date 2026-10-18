import { Injectable } from '@angular/core';
import { apiResource } from '../../core/api/api-resource';
import type { ReferenceData } from './reference.types';

/** Countries, departments and titles change rarely: loaded once per session, shared by all pages. */
@Injectable({ providedIn: 'root' })
export class ReferenceService {
  private readonly resource = apiResource<ReferenceData>(() => '/api/v1/reference-data');
  readonly data = this.resource.value;
}
