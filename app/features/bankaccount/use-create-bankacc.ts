import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { useAuth } from "@/lib/auth"; // ✅ get user
import { useCreateAuditLog } from "../auditlog/use-create-auditlog"; // ✅ adjust path if needed

type ResponseType = InferResponseType<typeof client.api.bank["$post"], 201>;
type RequestType = InferRequestType<typeof client.api.bank["$post"]>["json"];

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createAuditLog = useCreateAuditLog();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.bank.$post({ json });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to create bank account");
      }

      return await response.json();
    },    onSuccess: (data) => {
      toast.success("Bank account created successfully");
      queryClient.invalidateQueries({ queryKey: ["bankaccount"] });

      // ✅ Log audit only if user is available
      if (user?.id) {
        createAuditLog.mutate({
          userId: user.id,
          action: "CREATE",
          entityType: "BankAccount",
          entityId:  data.account.id, // adjust to match response
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
      toast.error(error.message || "Failed to create bank account");
    },
  });

  return mutation;
};
