import { FormControl } from '@angular/forms';
import {
  email, firstError, money, notAfter, notBefore, notCurrentSalary, percentChange, minTrimmedLength, selected,
} from './validators';

const errorOf = (validator: (c: FormControl) => unknown, value: unknown) => {
  const control = new FormControl(value, validator as never);
  control.markAsTouched();
  return firstError(control);
};

describe('money', () => {
  it.each([
    ['', 'Enter an amount'],
    ['0', 'Must be greater than zero'],
    ['1000.555', 'up to 2 decimals'],
    ['12,000', 'up to 2 decimals'],
  ])('rejects %s', (value, message) => {
    expect(errorOf(money, value)).toContain(message);
  });

  it('accepts whole and two-decimal amounts', () => {
    expect(errorOf(money, '85000')).toBeNull();
    expect(errorOf(money, '85000.50')).toBeNull();
  });
});

describe('salary change rules', () => {
  it('rejects an unchanged salary', () => {
    expect(errorOf(notCurrentSalary(85000), '85000.00')).toBe('That is the current salary');
  });

  it('rejects future dates and backdating before the latest change', () => {
    expect(errorOf(notAfter('2026-10-15', 'Cannot be in the future'), '2026-10-16')).toBe('Cannot be in the future');
    expect(errorOf(notBefore('2025-03-01'), '2025-02-28')).toBe('Cannot be before the latest change (1 Mar 2025)');
  });

  it('allows a change on the same day as the latest one', () => {
    expect(errorOf(notBefore('2025-03-01'), '2025-03-01')).toBeNull();
  });

  it('requires a real reason', () => {
    expect(errorOf(minTrimmedLength(3, 'Say why the salary is changing'), '  ')).toBe('Say why the salary is changing');
  });
});

describe('details', () => {
  it('validates email and selections', () => {
    expect(errorOf(email, 'jane@')).toBe('Enter a valid email');
    expect(errorOf(email, 'jane@acme.com')).toBeNull();
    expect(errorOf(selected('department'), '')).toBe('Choose a department');
    expect(errorOf(selected('department'), 3)).toBeNull();
  });

  it('shows nothing until the user has touched the field', () => {
    expect(firstError(new FormControl('', money))).toBeNull();
  });
});

describe('percentChange', () => {
  it('previews the raise', () => {
    expect(percentChange(80000, '88000')).toBeCloseTo(10);
    expect(percentChange(80000, '72000')).toBeCloseTo(-10);
  });

  it('is null for incomplete input', () => {
    expect(percentChange(80000, '')).toBeNull();
    expect(percentChange(80000, 'abc')).toBeNull();
  });
});
