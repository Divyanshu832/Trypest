import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { useAuth } from "@/lib/auth"; // make sure this is the correct path
import { useCreateAuditLog } from "../auditlog/use-create-auditlog"; // adjust path if needed

type ResponseType = InferResponseType<typeof client.api.series["$post"], 201>;
type RequestType = InferRequestType<typeof client.api.series["$post"]>["json"];

export const useCreateseries = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // 👈 Get user from useAuth
  const createAuditLog = useCreateAuditLog();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.series.$post({ json });

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
          entityType: "Series",
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
