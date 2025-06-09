import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetSubOrders = () => {
  const query = useQuery({
    queryKey: ["suborders"],
    queryFn: async () => {
      const response = await client.api.suborder.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch suborders");
      }
      return response.json();
    },
  });

  return query;
};

export const useGetSubOrdersByOrder = (orderId: string) => {
  const query = useQuery({
    queryKey: ["suborders", "order", orderId],
    queryFn: async () => {
      const response = await client.api.suborder.order[":orderId"].$get({
        param: { orderId },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch suborders for order");
      }
      return response.json();
    },
    enabled: !!orderId,
  });

  return query;
};

export const useGetSubOrder = (id: string) => {
  const query = useQuery({
    queryKey: ["suborder", id],
    queryFn: async () => {
      const response = await client.api.suborder[":id"].$get({
        param: { id },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch suborder");
      }
      return response.json();
    },
    enabled: !!id,
  });

  return query;
};
