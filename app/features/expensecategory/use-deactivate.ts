import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useToggleExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.api.expensecat[":id"]["toggle"].$patch({
        param: { id },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error('error' in data ? data.error : "Toggle failed");
      }

      return await response.json();
    },    onSuccess: (data) => {
      const status = data?.category?.isActive ? "activated" : "deactivated";
      toast.success(`Category ${status} successfully`);
      queryClient.invalidateQueries({ queryKey: ["expensecat"] });
      
      // Refresh the page to ensure all data is up-to-date
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: () => {
      toast.error("Failed to toggle category status");
    },
  });
};
