import { InferResponseType } from "hono";
import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export type UsersResponse = InferResponseType<typeof client.api.users.users["$get"], 200>;

export const useGetUsers = () => {
  const query = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await client.api.users.users.$get({});

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const {users} = await response.json();
       
      return users// 👈 Make sure to return the `users` array from the JSON response
    },
  });

  return query;
};
