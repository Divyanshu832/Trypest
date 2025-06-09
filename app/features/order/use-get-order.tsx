import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.order["$get"], 200>;

export const useGetorder = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["order"],
    queryFn: async () => {
      const response = await client.api.order.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch bank accounts");
      }

      return await response.json();
    },
  });

  return query;
};
