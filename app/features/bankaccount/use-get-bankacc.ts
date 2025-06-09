import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.bank["$get"], 200>;

export const useGetBankAccounts = () => {
  const query = useQuery<ResponseType>({
    queryKey: ["bank"],
    queryFn: async () => {
      const response = await client.api.bank.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch bank accounts");
      }

      return await response.json();
    },
  });

  return query;
};
