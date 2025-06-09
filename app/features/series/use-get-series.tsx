import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

// Adjust according to your API path
type ResponseType = InferResponseType<typeof client.api.series["$get"], 200>;

export const useGetseries = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["series"],
    queryFn: async () => {
      const response = await client.api.series.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      return await response.json();
    },
  });

  return query;
};
