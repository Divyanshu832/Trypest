import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.suborder[":id"]["$delete"]>;

export const useDeleteSubOrder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, string>({
    mutationFn: async (id) => {
      const response = await client.api.suborder[":id"].$delete({
        param: { id },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error('error' in error ? error.error : error.message || "Failed to delete suborder");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("SubOrder deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["suborders"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
