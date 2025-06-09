import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.order["$get"], 200>;

export const useGetOrders = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        const response = await client.api.order.$get();

        if (!response.ok) {
          console.error("API error:", response.status, response.statusText);
          throw new Error("Failed to fetch orders");
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        // Return empty orders array to prevent UI errors
        return { success: true, orders: [] };
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  return query;
};
