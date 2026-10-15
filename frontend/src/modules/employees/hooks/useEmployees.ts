import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "../api/employee.api";
import type {
  ChangeSalaryInput,
  CreateEmployeeInput,
  DirectoryQuery,
  UpdateEmployeeInput
} from "../types/employee.types";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (query: DirectoryQuery) => ["employees", "list", query] as const,
  detail: (id: number) => ["employees", "detail", id] as const,
  history: (id: number) => ["employees", "history", id] as const
};

export function useEmployeeDirectory(query: DirectoryQuery) {
  return useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: () => employeeApi.search(query),
    // Keep showing the current page while the next one loads: no flash of empty table.
    placeholderData: keepPreviousData
  });
}

export function useEmployee(id: number) {
  return useQuery({ queryKey: employeeKeys.detail(id), queryFn: () => employeeApi.get(id) });
}

export function useSalaryHistory(id: number) {
  return useQuery({ queryKey: employeeKeys.history(id), queryFn: () => employeeApi.history(id) });
}

/** Any change can move lists, the employee, their history and every insight figure. */
function useInvalidateAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["insights"] })
    ]);
}

export function useCreateEmployee() {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => employeeApi.create(input),
    onSuccess: invalidate
  });
}

export function useUpdateEmployee(id: number) {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => employeeApi.update(id, input),
    onSuccess: invalidate
  });
}

export function useChangeSalary(id: number) {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: (input: ChangeSalaryInput) => employeeApi.changeSalary(id, input),
    onSuccess: invalidate
  });
}

export function useDeactivateEmployee(id: number) {
  const invalidate = useInvalidateAfterChange();
  return useMutation({ mutationFn: () => employeeApi.deactivate(id), onSuccess: invalidate });
}
