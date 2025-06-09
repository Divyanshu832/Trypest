"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { bankAccounts, addBankAccount, setDefaultBankAccount, deleteBankAccount } from "@/lib/mock-data";
import { ColumnDef } from "@tanstack/react-table";
import { BankAccount } from "@/types";

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
import { Plus, MoreHorizontal, Star, Trash } from "lucide-react";
import { toast } from "sonner";
import { useGetBankAccounts } from "@/app/features/bankaccount/use-get-bankacc";
import { useCreateBankAccount } from "@/app/features/bankaccount/use-create-bankacc";
const bankAccountFormSchema = z.object({
  bankName: z.string().min(2, "Bank name must be at least 2 characters"),
  accountNumber: z.string().min(5, "Account number must be at least 5 characters"),
  ifsccode: z.string().min(8, "IFSC code must be at least 8 characters"),
  branchName: z.string().min(2, "Branch name must be at least 2 characters"),
  notes: z.string().optional(),
});

export default function BankAccountsPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof bankAccountFormSchema>>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      ifsccode: "",
      branchName: "",
      notes: "",
    },
  });

  if (!isAuthenticated() || !isAdmin()) {
    router.push("/dashboard");
    return null;
  }

const { mutate: addBankAccount } = useCreateBankAccount();
const { data: bankAccountsData = { success: false, accounts: [] }, isLoading } = useGetBankAccounts();
const accounts = bankAccountsData?.accounts.map(account => ({
  ...account,
  accountName: account.bankName, // Fix for type error
  createdAt: new Date(account.createdAt),
  updatedAt: new Date(account.updatedAt)
})) || [];
function onSubmit(values: z.infer<typeof bankAccountFormSchema>) {
  addBankAccount({
    ...values,

    isDefault: bankAccounts.length === 0,
  });
console.log( "Bank account added:", values);
  setIsDialogOpen(false);
  form.reset();
}
  const handleSetDefault = (id: string) => {
    setDefaultBankAccount(id);
    toast.success("Default bank account updated");
  };

  const handleDelete = (id: string) => {
    try {
      deleteBankAccount(id);
      toast.success("Bank account deleted");
    } catch (error) {
      toast.error("Cannot delete default bank account");
    }
  };

  const columns: ColumnDef<BankAccount>[] = [
    {
      accessorKey: "bankName",
      header: "Bank Name",
      cell: ({ row }) => (
        <div className="font-medium flex items-center gap-2">
          {row.original.bankName}
          {row.original.isDefault && (
            <Badge variant="secondary">Default</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
    },
    {
      accessorKey: "ifsccode",
      header: "IFSC Code",
    },
    {
      accessorKey: "branchName",
      header: "Branch",
    },
    {
      accessorKey: "createdAt",
      header: "Added On",
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
            {!row.original.isDefault && (
              <DropdownMenuItem onClick={() => handleSetDefault(row.original.id)}>
                <Star className="mr-2 h-4 w-4" />
                Set as Default
              </DropdownMenuItem>
            )}
            {!row.original.isDefault && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Account
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>
                Add a new bank account for transactions
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ifsccode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter IFSC code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter branch name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes about this account
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
                      setIsDialogOpen(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Account
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bank Account Management</CardTitle>
          <CardDescription>
            Manage bank accounts for transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
         <DataTable
  columns={columns}
  data={accounts}
  searchColumn="bankName"
/>

        </CardContent>
      </Card>
    </div>
  );
}