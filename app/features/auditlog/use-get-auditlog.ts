import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

// Adjust route according to your Hono API structure
type ResponseType = InferResponseType<typeof client.api.auditlog["$get"], 200>;

export const useGetAuditLogs = () => {
  return useQuery<ResponseType>({
    queryKey: ["auditlog"],
    queryFn: async () => {
      const response = await client.api.auditlog.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      return await response.json();
    },
  });
};
