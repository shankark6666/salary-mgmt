import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageHeader } from '../../../shared/ui/page-header';

@Component({
  selector: 'app-insights-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Insights" description="How ACME pays people. Active employees only." />
    <nav mat-tab-nav-bar [tabPanel]="panel" aria-label="Insights" class="tabs">
      @for (tab of tabs; track tab.path) {
        <a mat-tab-link [routerLink]="tab.path" routerLinkActive #rla="routerLinkActive"
           [routerLinkActiveOptions]="{ exact: tab.exact }" [active]="rla.isActive">{{ tab.label }}</a>
      }
    </nav>
    <mat-tab-nav-panel #panel>
      <router-outlet />
    </mat-tab-nav-panel>
  `,
  styles: `.tabs { margin-bottom: 20px; }`,
})
export class InsightsLayout {
  readonly tabs = [
    { path: '/insights', label: 'Overview', exact: true },
    { path: '/insights/countries', label: 'By country', exact: false },
    { path: '/insights/roles', label: 'Role comparison', exact: false },
    { path: '/insights/outliers', label: 'Outliers', exact: false },
  ];
}
