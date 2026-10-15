"use client";

import { useState } from "react";
import { toApiError } from "@shared/api/errors";
import { Button } from "@shared/components/ui/button";
import { Dialog } from "@shared/components/ui/dialog";
import { useDeactivateEmployee } from "../hooks/useEmployees";
import type { Employee } from "../types/employee.types";
import { FormAlert } from "./FormAlert";

export function DeactivateDialog({ employee, open, onClose }: { employee: Employee; open: boolean; onClose: () => void }) {
  const deactivate = useDeactivateEmployee(employee.id);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onClose={onClose} title={`Deactivate ${employee.fullName}?`}>
      <div className="space-y-4 text-sm">
        <p>
          They will leave the directory and every insight figure, and their record becomes read-only. Their salary
          history is kept.
        </p>
        <FormAlert message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={deactivate.isPending}
            onClick={() =>
              deactivate.mutate(undefined, { onSuccess: onClose, onError: (e) => setError(toApiError(e).message) })
            }
          >
            {deactivate.isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
