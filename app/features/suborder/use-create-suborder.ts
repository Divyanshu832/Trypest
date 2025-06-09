import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.suborder.$post>;
type RequestType = InferRequestType<typeof client.api.suborder.$post>["json"];

export const useCreateSubOrder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.suborder.$post({ json });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create suborder");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("SubOrder created successfully");
      queryClient.invalidateQueries({ queryKey: ["suborders"] });
      if ('orderId' in data) {
        queryClient.invalidateQueries({ 
          queryKey: ["suborders", "order", data.orderId] 
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
