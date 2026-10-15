import { Button } from "@shared/components/ui/button";

/** Form-level error. A 409 means someone else saved first: offer a reload instead of a retry. */
export function FormAlert({ message, conflict, onReload }: { message: string | null; conflict?: boolean; onReload?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive-muted-foreground">
      <span>{message}</span>
      {conflict && onReload ? (
        <Button variant="secondary" size="sm" onClick={onReload}>
          Reload
        </Button>
      ) : null}
    </div>
  );
}
