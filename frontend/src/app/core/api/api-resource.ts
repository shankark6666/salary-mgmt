import { httpResource, HttpResourceRequest } from '@angular/common/http';
import { computed, linkedSignal, Signal } from '@angular/core';
import { ApiError, toApiError } from './api-error';
import type { ApiEnvelope } from './api.types';

export interface ApiResource<T> {
  /** Latest value; keeps the previous one while a new request loads (no empty flash). */
  readonly value: Signal<T | undefined>;
  readonly loading: Signal<boolean>;
  /** True while showing a previous value during a reload or a changed request. */
  readonly refreshing: Signal<boolean>;
  readonly error: Signal<ApiError | null>;
  reload(): void;
}

/**
 * A reactive GET of an ApiResponse envelope: re-requests whenever the request signal changes,
 * unwraps `data`, and normalises errors to ApiError.
 */
export function apiResource<T>(request: () => HttpResourceRequest | string | undefined): ApiResource<T> {
  const ref = httpResource<T>(
    () => {
      const next = request();
      return typeof next === 'string' ? { url: next } : next;
    },
    { parse: (raw) => (raw as ApiEnvelope<T>).data as T },
  );
  const value = linkedSignal<T | undefined, T | undefined>({
    source: () => (ref.hasValue() ? ref.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });
  return {
    value,
    loading: ref.isLoading,
    refreshing: computed(() => ref.isLoading() && value() !== undefined),
    error: computed(() => (ref.error() ? toApiError(ref.error()) : null)),
    reload: () => ref.reload(),
  };
}
