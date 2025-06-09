import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

// Adjust according to your API path
type ResponseType = InferResponseType<typeof client.api.expensecat["$get"], 200>;

export const useGEtExpence = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["expensecat"],
    queryFn: async () => {
      const response = await client.api.expensecat.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      return await response.json();
    },
  });

  return query;
};
