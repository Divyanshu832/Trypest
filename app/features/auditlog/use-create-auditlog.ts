import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";

// Match your Hono route structure
type ResponseType = InferResponseType<typeof client.api.auditlog["$post"], 201>;
type RequestType = InferRequestType<typeof client.api.auditlog["$post"]>["json"];

export const useCreateAuditLog = () => {
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const res = await client.api.auditlog.$post({ json });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to create audit log");
      }

      return await res.json();
    },    onSuccess: () => {
      toast.success("Audit log created");
      
      // Refresh the page to ensure all data is up-to-date
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Audit log creation failed");
    },
  });
};
