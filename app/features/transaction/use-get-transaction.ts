import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetTransaction = (id: string | undefined) => {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      if (!id) throw new Error("Transaction ID is required");

      const res = await client.api.transaction[":id"].$get({ param: { id } });

      if (!res.ok) {
        const data = await res.json();
        throw new Error('error' in data ? data.error : "Failed to fetch transaction");
      }

      const data = await res.json();
      return data.transaction;
    },
    enabled: !!id, // Only run query if id is provided
  });
};