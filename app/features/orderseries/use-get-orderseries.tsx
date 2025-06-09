import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

// Adjust according to your API path
type ResponseType = InferResponseType<typeof client.api.orderseries["$get"], 200>;

export const useGetorderseries = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["orderseries"],
    queryFn: async () => {
      const response = await client.api.orderseries.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      return await response.json();
    },
  });

  return query;
};
