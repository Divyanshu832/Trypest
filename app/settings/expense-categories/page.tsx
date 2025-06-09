"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { expenseCategories, addExpenseCategory, toggleExpenseCategory } from "@/lib/mock-data";
import { ColumnDef } from "@tanstack/react-table";
import { ExpenseCategory } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { DateFormatter } from "@/components/ui/date-formatter";
import { Plus, MoreHorizontal, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { useCreateCategory } from "@/app/features/expensecategory/use-create-expensecat";
 
import { useToggleExpenseCategory } from "@/app/features/expensecategory/use-deactivate";
import { useGEtExpence } from "@/app/features/expensecategory/use-get-expense";
const expenseCategoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
});

export default function ExpenseCategoriesPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof expenseCategoryFormSchema>>({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  if (!isAuthenticated() || !isAdmin()) {
    router.push("/dashboard");
    return null;
  }

  const { mutateAsync: addExpenseCategory } = useCreateCategory();
const { data:expensedata, isLoading, error } = useGEtExpence();

async function onSubmit(values: z.infer<typeof expenseCategoryFormSchema>) {
  try {
    await addExpenseCategory(values);
    toast.success("Expense category added successfully");
    setIsDialogOpen(false);
    form.reset();
  } catch (error: any) {
    toast.error(error.message || "Failed to add category");
  }
}


  const { mutate: toggleExpenseCategory } = useToggleExpenseCategory();

const handleToggle = (id: string) => {
  toggleExpenseCategory(id);
};


  const columns: ColumnDef<ExpenseCategory>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium flex items-center gap-2">
          {row.original.name}
          {!row.original.isActive && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <DateFormatter date={row.original.createdAt} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
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
            <DropdownMenuItem
              onClick={() => handleToggle(row.original.id)}
            >
              {row.original.isActive ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Expense Categories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Expense Category</DialogTitle>
              <DialogDescription>
                Create a new category for expense transactions
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter category description"
                          className="resize-none"
                          {...field}
                        />
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
                      setIsDialogOpen(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Category
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
          <CardDescription>
            Manage expense categories for transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={(expensedata?.categories || []).map(cat => ({
              ...cat,
              isActive: cat.isActive === null ? false : cat.isActive,
              createdAt: new Date(cat.createdAt),
              updatedAt: new Date(cat.updatedAt)
            }))}
            // isLoading={isLoading}
            searchColumn="name"
          />
        </CardContent>
      </Card>
    </div>
  );
}