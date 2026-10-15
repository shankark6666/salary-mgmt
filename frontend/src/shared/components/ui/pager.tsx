import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@shared/lib/format";
import { Button } from "./button";

interface PagerProps {
  page: number; // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pager({ page, size, totalElements, totalPages, onPageChange }: PagerProps) {
  if (totalElements === 0) return null;
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4 text-sm">
      <p className="text-muted-foreground">
        {formatNumber(from)}–{formatNumber(to)} of {formatNumber(totalElements)}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </Button>
        <span className="tabular-nums text-muted-foreground">
          Page {formatNumber(page + 1)} of {formatNumber(totalPages)}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page + 1 >= totalPages}>
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
