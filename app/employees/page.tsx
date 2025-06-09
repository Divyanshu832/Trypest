"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { ColumnDef } from "@tanstack/react-table";
import { User, SenderIdSeries } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateFormatter } from "@/components/ui/date-formatter";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, FileText, Pencil, Settings } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateseries } from "../features/series/use-create-series";
import { useGetseries } from "../features/series/use-get-series";
import { useCreateEmployee } from "../features/user/use-create-employee";
import { useGetUsers } from "../features/user/use-get-employee";
import { employeeColumns } from "./employeedisplay";
const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  printName: z.string()
    .refine(val => /^[A-Z-]+$/.test(val), {
      message: "Print name must contain only uppercase letters and hyphens"
    }),
  role: z.enum(["admin", "accountant", "employee"]),
  position: z.string().min(2, "Position must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  whatsapp: z.string().min(10, "WhatsApp must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  senderIdPrefix: z.string().min(2, "Sender ID prefix is required"),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  permissions: z.array(z.string()),
});

const seriesFormSchema = z.object({  prefix: z.string()
    .min(2, "Prefix must be at least 2 characters")
    .regex(/^[A-Z0-9-]+$/, "Prefix must contain only uppercase letters, numbers, and hyphens"),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
});

const employeePermissions = ['USE_CASH', 'USE_BANK_ACCOUNTS'];

export default function EmployeesPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();  const [users, setUsers] = useState<User[]>([]);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{ email: string; password: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [seriesList, setSeriesList] = useState<SenderIdSeries[]>([]);

 const { data: usersData, isLoading: usersLoading, error: usersError } = useGetUsers();
const { data: seriesData, error: seriesError } = useGetseries();
console.log(seriesData)
useEffect(() => {
  if (seriesError) {
    toast.error(seriesError.message || "Failed to load sender ID series");
  }
}, [seriesError]);

useEffect(() => {
  if (seriesData?.series) {
    // Convert string dates to Date objects
    const formattedSeries = seriesData.series.map(series => ({
      ...series,
      createdAt: new Date(series.createdAt),
      updatedAt: new Date(series.updatedAt)
    }));
    setSeriesList(formattedSeries);
  }
}, [seriesData]);

    // Initial loading of data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);
  const employeeForm = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),    defaultValues: {
      name: "",
      email: "",
      printName: "",
      role: "employee",
      position: "",
      phone: "",
      whatsapp: "",
      address: "",
      senderIdPrefix: "", // Will be updated when series are loaded
      panNumber: "",
      aadhaarNumber: "",
      permissions: employeePermissions,
    },
  });

  const seriesForm = useForm<z.infer<typeof seriesFormSchema>>({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      prefix: "",
      description: "",
    },
  });
  // Update form when series are loaded
  useEffect(() => {
    if (seriesList.length > 0 && !editingUser) {
      const defaultSeries = seriesList.find(s => s.isDefault);
      if (defaultSeries) {
        employeeForm.setValue('senderIdPrefix', defaultSeries.prefix);
      }
    }
  }, [seriesList, employeeForm, editingUser]);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);
  useEffect(() => {
    if (editingUser) {
      const prefix = editingUser.senderId.split('-')[0];      employeeForm.reset({
        name: editingUser.name,
        email: editingUser.email,
        printName: editingUser.printName,
        role: editingUser.role.toUpperCase() as "admin" | "accountant" | "employee",
        position: editingUser.position || "",
        phone: editingUser.phone || "",
        whatsapp: editingUser.whatsapp || "",
        address: editingUser.address || "",
        senderIdPrefix: prefix,
        panNumber: editingUser.panNumber || "",
        aadhaarNumber: editingUser.aadhaarNumber || "",
        permissions: editingUser.permissions || employeePermissions,
      });
    }
  }, [editingUser, employeeForm]);
  const { mutate: createEmployee } = useCreateEmployee();


async function onEmployeeSubmit(values: z.infer<typeof employeeFormSchema>) {
  const isUnique = !users.some(
    (u) => u.printName === values.printName && (!editingUser || u.id !== editingUser.id)
  );

  if (!isUnique) {
    toast.error("An employee with this print name already exists");
    return;
  }
  const employeeData = {
    ...values,
    senderId: values.senderIdPrefix, // converting to match backend
    panNumber: values.panNumber || "",
    aadhaarNumber: values.aadhaarNumber || "",
    // No password, will be generated on the server
  };
  createEmployee(employeeData, {
    onSuccess: (data) => {
      // ✅ Accessing CreateEmployeeResponse type here      console.log("Created user ID:", data.user.id);
      console.log("Created user name:", data.user.name);
      console.log("Created senderId:", data.user.senderId);      setCreatedUserCredentials({
        email: data.user.email,
        password:   data.generatedPassword || "", // Use plainPassword from user object if available
      });

      toast.success("Employee added successfully");
      setIsEmployeeDialogOpen(false);
      employeeForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create employee");
    },
  });
}

  const { mutate: createSeries } = useCreateseries();
async function onSeriesSubmit(values: z.infer<typeof seriesFormSchema>) {
  createSeries(
    {
      prefix: values.prefix,
      description: values.description,
      isDefault: seriesList.length === 0, // optional flag
    },
    {
      onSuccess: () => {
        toast.success("Sender ID series added successfully");
        setIsSeriesDialogOpen(false);
        seriesForm.reset();
 // refetch the updated list
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create series");
      },
    }
  );
}
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEmployeeDialogOpen(true);
  };
  const handleSetDefaultSeries = async (id: string) => {
    try {
      setIsLoading(true);      const response = await fetch(`/api/series/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default series');
      }
      
      toast.success("Default sender ID series updated");
      
      // Refresh the series list after update
      // await fetchSeries();
    } catch (error) {
      console.error('Error setting default series:', error);
      toast.error(error instanceof Error ? error.message : "Failed to set default series");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteSeries = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/series/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete series');
      }
      
      toast.success("Sender ID series deleted");
      
      // Refresh the series list
      // await fetchSeries();
    } catch (error) {
      console.error('Error deleting series:', error);
      
      // Handle specific error cases
      if (error instanceof Error && error.message.includes('Cannot delete the default series')) {
        toast.error("Cannot delete the default series");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to delete series");
      }
    } finally {
      setIsLoading(false);
    }
  };
 
  

  const seriesColumns: ColumnDef<SenderIdSeries>[] = [
    {
      accessorKey: "prefix",
      header: "Prefix",
      cell: ({ row }) => (
        <div className="font-medium flex items-center gap-2">
          {row.original.prefix}
          {row.original.isDefault && (
            <Badge variant="secondary">Default</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.original.description}</div>,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <DateFormatter date={row.original.createdAt} formatStr="PP" />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!row.original.isDefault && (
                <DropdownMenuItem onClick={() => handleSetDefaultSeries(row.original.id)}>
                  Set as Default
                </DropdownMenuItem>
              )}
              {!row.original.isDefault && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteSeries(row.original.id)}
                >
                  Delete Series
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  // Filter to show only employees
  const employeeUsers = usersData;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <div className="flex gap-4">
          <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" /> Manage Series
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Sender ID Series</DialogTitle>
                <DialogDescription>
                  Create a new sender ID series prefix for transactions.
                </DialogDescription>
              </DialogHeader>
              <Form {...seriesForm}>
                <form onSubmit={seriesForm.handleSubmit(onSeriesSubmit)} className="space-y-4">
                  <FormField
                    control={seriesForm.control}
                    name="prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prefix</FormLabel>
                        <FormControl>
                          <Input placeholder="RBC-2025" {...field} />
                        </FormControl>
                        <FormDescription>
                          Use uppercase letters, numbers, and hyphens only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />                  <FormField
                    control={seriesForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Royal Business Corp 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsSeriesDialogOpen(false);
                        seriesForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Add Series
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog 
            open={isEmployeeDialogOpen} 
            onOpenChange={(open) => {
              setIsEmployeeDialogOpen(open);
              if (!open) {
                setCreatedUserCredentials(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 z-10 bg-background pt-4 pb-2">
                <DialogTitle>{editingUser ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update employee profile' : 'Create a new employee profile'}. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>              {createdUserCredentials ? (
                <div className="space-y-4">                  <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/20">                    <h4 className="font-medium mb-2">Employee Created Successfully</h4>
                    <div className="space-y-2 text-sm">
                      <p>Email: {createdUserCredentials.email}</p>
                      <p>Password: <span className="font-mono bg-muted p-1 rounded">{createdUserCredentials.password}</span> <span className="text-xs text-muted-foreground">(auto-generated)</span></p>
                    </div>
                    <p className="text-xs mt-4 text-muted-foreground">
                      Please share these credentials with the employee. They can now login at the <a href="/login" className="underline" target="_blank">login page</a>.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => {
                        setCreatedUserCredentials(null);
                        setIsEmployeeDialogOpen(false);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...employeeForm}>
                  <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="space-y-4">
                    <FormField
                      control={employeeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />                    <FormField
                      control={employeeForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="john@example.com" 
                              {...field} 
                              disabled={!!editingUser}
                            />
                          </FormControl>
                          <FormMessage />                        </FormItem>
                      )}
                    />                    <FormField
                      control={employeeForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={!!editingUser}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="accountant">Accountant</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={employeeForm.control}
                        name="printName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Print Name *</FormLabel>
                            <FormControl>
                              <Input  className="uppercase" placeholder="JD" {...field} />
                            </FormControl>
                            <FormDescription>
                              2-3 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employeeForm.control}
                        name="senderIdPrefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender ID Series *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select prefix" />
                                </SelectTrigger>
                              </FormControl>                              <SelectContent>
                                {seriesList.map((series) => (
                                  <SelectItem key={series.id} value={series.prefix}>
                                    {series.prefix} {series.isDefault && "(Default)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={employeeForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position *</FormLabel>
                          <FormControl>
                            <Input placeholder="Finance Manager" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={employeeForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone *</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employeeForm.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp *</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={employeeForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Business Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={employeeForm.control}
                        name="panNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN Number</FormLabel>
                            <FormControl>
                              <Input placeholder="ABCDE1234F" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employeeForm.control}
                        name="aadhaarNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aadhaar Number</FormLabel>
                            <FormControl>
                              <Input placeholder="1234-5678-9012" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={employeeForm.control}
                      name="permissions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Permissions</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <FormLabel className="text-sm font-medium">Transaction Methods</FormLabel>
                              <div className="space-y-2">
                                <Checkbox
                                  checked={field.value.includes('USE_CASH')}
                                  onCheckedChange={(checked) => {
                                    const newPermissions = checked
                                      ? [...field.value, 'USE_CASH']
                                      : field.value.filter(p => p !== 'USE_CASH');
                                    field.onChange(newPermissions);
                                  }}
                                />
                                <span className="ml-2">Allow Cash Transactions</span>
                              </div>
                              <div className="space-y-2">
                                <Checkbox
                                  checked={field.value.includes('USE_BANK_ACCOUNTS')}
                                  onCheckedChange={(checked) => {
                                    const newPermissions = checked
                                      ? [...field.value, 'USE_BANK_ACCOUNTS']
                                      : field.value.filter(p => p !== 'USE_BANK_ACCOUNTS');
                                    field.onChange(newPermissions);
                                  }}
                                />
                                <span className="ml-2">Allow Bank Transactions</span>
                              </div>
                            </div>
                          </div>
                          <FormDescription>
                            Select which payment methods this employee can use
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-4 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsEmployeeDialogOpen(false);
                          setEditingUser(null);
                          employeeForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingUser ? 'Update Employee' : 'Add Employee'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sender ID Series</CardTitle>
            <CardDescription>
              Manage transaction ID prefixes for the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <p>Loading series...</p>
              </div>
            ) : (
              <DataTable
                columns={seriesColumns}
                data={seriesList}
                searchColumn="prefix"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Management</CardTitle>
            <CardDescription>
              Manage employee profiles and access their transaction ledgers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <p>Loading employees...</p>
              </div>
            ) : (
              <DataTable
                columns={employeeColumns}
                //@ts-ignore
                data={employeeUsers || []}
                searchColumn="name"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}