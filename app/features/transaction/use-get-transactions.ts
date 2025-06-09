import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.transaction["$get"], 200>;

export const useGetTransactions = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["transactions"],
    queryFn: async () => {
      try {
        const response = await client.api.transaction.$get();

        if (!response.ok) {
          console.error("API error:", response.status, response.statusText);
          throw new Error("Failed to fetch transactions");
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  return query;
};