import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { useAuth } from "@/lib/auth"; // ✅ Make sure the path is correct
import { useCreateAuditLog } from "../auditlog/use-create-auditlog"; // ✅ Adjust if needed

type ResponseType = InferResponseType<typeof client.api.transaction["$post"], 201>;
export type RequestType = InferRequestType<typeof client.api.transaction["$post"]>["json"];

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createAuditLog = useCreateAuditLog();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transaction.$post({ json });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to create transaction");
      }

      return await response.json();
    },    onSuccess: (data) => {
      toast.success("Transaction created successfully");
      
      // Invalidate and refetch transaction data
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.refetchQueries({ queryKey: ["transactions"] });
      
      // Also refresh related queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // ✅ Create audit log
      if (user?.id) {
        createAuditLog.mutate({
          userId: user.id,
          action: "CREATE",
          entityType: "Transaction",
          entityId: data.transaction.id, // adjust if your API returns differently
          details: data,
        });
      } else {
        console.warn("❌ Cannot create audit log — userId is missing");
      }
      
      // Refresh the page to ensure all data is up-to-date
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transaction");
    },
  });

  return mutation;
};
