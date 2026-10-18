import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="header">
      <div>
        <h1 class="page-title">{{ title() }}</h1>
        @if (description()) {
          <p class="page-description">{{ description() }}</p>
        }
      </div>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styles: `
    .header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
    .page-description { margin-bottom: 0; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input<string>();
}
