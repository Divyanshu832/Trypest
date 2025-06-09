import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { useAuth } from "@/lib/auth"; // ✅ import user
import { useCreateAuditLog } from "../auditlog/use-create-auditlog"; // ✅ adjust path as needed

type ResponseType = InferResponseType<typeof client.api.expensecat["$post"], 201>;
type RequestType = InferRequestType<typeof client.api.expensecat["$post"]>["json"];

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createAuditLog = useCreateAuditLog();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.expensecat.$post({ json });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to create category");
      }

      return await response.json();
    },    onSuccess: (data) => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["expensecat"] });

      if (user?.id) {
        createAuditLog.mutate({
          userId: user.id,
          action: "CREATE",
          entityType: "ExpenseCategory",
          entityId:  data.category.id, // adjust based on response
          details: data,
        });
      } else {
        console.warn("❌ Audit log skipped — user ID missing");
      }
      
      // Refresh the page to ensure all data is up-to-date
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  return mutation;
};
