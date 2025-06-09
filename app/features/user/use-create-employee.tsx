import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth"; // ✅ Ensure correct path
import { useCreateAuditLog } from "../auditlog/use-create-auditlog"; // ✅ Adjust path if needed

// Request type matching your createUserSchema
type CreateEmployeeInput = {
  name: string;
  email: string;
  password?: string; // Now optional
  role: "admin" | "accountant" | "employee";
  printName: string;
  position: string;
  phone: string;
  whatsapp: string;
  address: string;
  senderId: string;
  panNumber?: string;
  aadhaarNumber?: string;
  permissions: string[];
};

// Response type from backend
type CreateEmployeeResponse = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    printName: string | null;
    senderId: string | null;
    position: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    panNumber: string | null;
    aadhaarNumber: string | null;
  };
  generatedPassword?: string;
};

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createAuditLog = useCreateAuditLog();

  return useMutation<CreateEmployeeResponse, Error, CreateEmployeeInput>({
    mutationFn: async (data) => {
      const response = await client.api.users.users.$post({ json: data });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error('error' in errorData ? errorData.error as string : "Failed to create employee");
      }

      return response.json();
    },    onSuccess: (data) => {
      toast.success("Employee created successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });

      // ✅ Create audit log
      if (user?.id) {
        createAuditLog.mutate({
          userId: user.id,
          action: "CREATE",
          entityType: "Employee",
          entityId: data.user.id,
          details: data,
        });
      } else {
        console.warn("❌ Cannot create audit log — userId is missing");
      }
      
      // Refresh the page to ensure all data is up-to-date
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create employee");
    },
  });
}
