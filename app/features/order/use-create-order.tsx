import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { useAuth } from "@/lib/auth"; // ✅ adjust if needed
import { useCreateAuditLog } from "../auditlog/use-create-auditlog"; // ✅ adjust if needed

type ResponseType = InferResponseType<typeof client.api.order["$post"], 201>;
type RequestType = InferRequestType<typeof client.api.order["$post"]>["json"];

export const useCreateorder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createAuditLog = useCreateAuditLog();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.order.$post({ json });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to create order");
      }

      return await response.json();
    },    onSuccess: (data) => {
      toast.success("Order created successfully");
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // ✅ Audit log
      if (user?.id) {
        createAuditLog.mutate({
          userId: user.id,
          action: "CREATE",
          entityType: "Order",
          entityId: data.order.id, // adjust if needed
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
      toast.error(error.message || "Failed to create order");
    },
  });

  return mutation;
};
