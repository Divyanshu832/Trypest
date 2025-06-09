import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { useAuth } from "@/lib/auth"; // ✅ adjust path if needed
import { useCreateAuditLog } from "../auditlog/use-create-auditlog"; // ✅ adjust path if needed

// Adjust according to your actual API path
type ResponseType = InferResponseType<typeof client.api.orderseries["$post"], 201>;
type RequestType = InferRequestType<typeof client.api.orderseries["$post"]>["json"];

export const useCreateoseries = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // ✅ get current user
  const createAuditLog = useCreateAuditLog(); // ✅ audit log hook

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.orderseries.$post({ json });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to create series");
      }

      return await response.json();
    },    onSuccess: (data) => {
      toast.success("Series created successfully");
      queryClient.invalidateQueries({ queryKey: ["series"] });

      // ✅ Create audit log
      if (user?.id) {
        createAuditLog.mutate({
          userId: user.id,
          action: "CREATE",
          entityType: "OrderSeries",
          entityId: data.series.id,
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
      toast.error(error.message || "Failed to create series");
    },
  });

  return mutation;
};
