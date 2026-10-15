import { AlertTriangle } from "lucide-react";
import { Button } from "@shared/components/ui/button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
      <p className="max-w-sm text-sm">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
