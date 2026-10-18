import { ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import type { Page } from '../../../core/api/api.types';
import { apiResource } from '../../../core/api/api-resource';
import { AuthService } from '../../../core/auth/auth.service';
import { IsoDatePipe, MoneyPipe } from '../../../shared/format/money.pipe';
import { PageHeader } from '../../../shared/ui/page-header';
import { EmptyState, ErrorState } from '../../../shared/ui/state';
import { ReferenceService } from '../../reference/reference.service';
import { directoryParams } from '../data/employee.api';
import type { DirectoryQuery, Employee, EmployeeStatus, SortField } from '../data/employee.types';
import { DEFAULT_QUERY, exportHref, parseDirectoryQuery, toSearchParams } from '../data/directory-query';
import { CreateEmployeeDialog } from '../dialogs/create-employee.dialog';

@Component({
  selector: 'app-employee-directory',
  imports: [
    RouterLink, MatTableModule, MatSortModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressBarModule, PageHeader, EmptyState, ErrorState,
    MoneyPipe, IsoDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './employee-directory.scss',
  templateUrl: './employee-directory.html',
})
export class EmployeeDirectory {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly auth = inject(AuthService);
  readonly reference = inject(ReferenceService).data;

  /** All directory state lives in the URL: shareable, bookmarkable, survives refresh and back. */
  readonly query = toSignal(
    inject(ActivatedRoute).queryParamMap,
    { requireSync: true },
  );
  readonly criteria = computed(() => parseDirectoryQuery(this.query()));

  readonly employees = apiResource<Page<Employee>>(() => ({
    url: '/api/v1/employees',
    params: directoryParams(this.criteria()),
  }));

  /** The search box follows the URL (back button, clear filters) but can be typed into freely. */
  readonly searchText = linkedSignal(() => this.criteria().q);

  readonly columns = computed(() => {
    const base = ['name', 'country', 'department', 'jobTitle', 'salaryUsd', 'hireDate'];
    return this.criteria().status === 'ACTIVE' ? base : [...base, 'status'];
  });
  readonly filtered = computed(() => {
    const c = this.criteria();
    return c.q !== '' || c.country !== null || c.departmentId !== null || c.jobTitleId !== null
      || c.status !== DEFAULT_QUERY.status;
  });
  readonly exportLink = computed(() => exportHref(this.criteria()));

  constructor() {
    // Search hits the server once typing pauses, not on every keystroke.
    toObservable(this.searchText)
      .pipe(skip(1), debounceTime(300), distinctUntilChanged())
      .subscribe((q) => {
        if (q !== this.criteria().q) this.update({ q, page: 0 });
      });
    // Keep the page index honest if the result set shrinks under it.
    effect(() => {
      const page = this.employees.value();
      if (page && page.totalPages > 0 && this.criteria().page >= page.totalPages) {
        this.update({ page: page.totalPages - 1 });
      }
    });
  }

  update(patch: Partial<DirectoryQuery>): void {
    const params = toSearchParams({ ...this.criteria(), ...patch });
    void this.router.navigate([], { queryParams: Object.fromEntries(params), replaceUrl: true });
  }

  onSort(sort: Sort): void {
    this.update({ sort: sort.active as SortField, direction: sort.direction === 'desc' ? 'DESC' : 'ASC', page: 0 });
  }

  onPage(event: PageEvent): void {
    this.update({ page: event.pageIndex, size: event.pageSize });
  }

  setStatus(status: EmployeeStatus): void {
    this.update({ status, page: 0 });
  }

  setId(key: 'departmentId' | 'jobTitleId', value: number | null): void {
    this.update({ [key]: value, page: 0 });
  }

  clearFilters(): void {
    this.update({ ...DEFAULT_QUERY, size: this.criteria().size });
  }

  addEmployee(): void {
    this.dialog.open(CreateEmployeeDialog, { width: '640px', maxWidth: '95vw', autoFocus: 'first-tabbable' });
  }
}
