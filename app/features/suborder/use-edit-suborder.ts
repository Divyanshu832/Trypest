import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.suborder[":id"]["$patch"]>;
type RequestType = InferRequestType<typeof client.api.suborder[":id"]["$patch"]>["json"];

export const useEditSubOrder = (id?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.suborder[":id"].$patch({
        param: { id: id! },
        json,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error('error' in error ? error.error : "Failed to update suborder");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("SubOrder updated successfully");
      queryClient.invalidateQueries({ queryKey: ["suborders"] });
      queryClient.invalidateQueries({ queryKey: ["suborder", id] });
      queryClient.invalidateQueries({ 
        queryKey: ["suborders", "order"] 
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
