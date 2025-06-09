"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetBankAccounts } from "@/app/features/bankaccount/use-get-bankacc";
import { useGEtExpence } from "@/app/features/expensecategory/use-get-expense";
import { useGetOrders } from "@/app/features/order/use-get-orders";
import { useGetUsers } from "@/app/features/user/use-get-employee";
import { useCreateTransaction } from "@/app/features/transaction/use-create-transaction";
import { useGetSubOrdersByOrder } from "@/app/features/suborder/use-get-suborders";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, Trash2, Upload, FileIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDropzone } from "react-dropzone";
import { UploadDropzone } from "@/lib/uploadthing";
import { SubOrder } from "@/types";

// SubOrder Selection Component
interface SubOrderSelectProps {
  orderId: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}

function SubOrderSelect({ orderId, value, onChange }: SubOrderSelectProps) {
  const { data: subOrdersData, isLoading: isLoadingSubOrders } = useGetSubOrdersByOrder(orderId);
  
  return (
    <FormItem>
      <FormLabel>SubOrder (Optional)</FormLabel>
      <Select
        onValueChange={onChange}
        defaultValue={value}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select suborder" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          //@ts-ignore
          {subOrdersData?.subOrders?.map((subOrder) => (
            <SelectItem key={subOrder.id} value={subOrder.id}>
              {subOrder.name}
              {subOrder.description && ` - ${subOrder.description}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoadingSubOrders && <FormDescription>Loading suborders...</FormDescription>}
      <FormDescription>
        Link this transaction to a specific suborder
      </FormDescription>
      <FormMessage />
    </FormItem>
  );
}

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const transactionSchema = z.object({
  type: z.enum(["IMPREST", "EXPENSE"], {
    required_error: "Please select a transaction type",
  }),
  amount: z.coerce
    .number({
      required_error: "Please enter an amount",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be positive"),
  receiver: z.string({
    required_error: "Please select a receiver",
  }),
  paymentMethod: z.enum(["CASH", "BANK"], {
    required_error: "Please select a payment method",
  }),  bankAccountId: z.string().optional(),
  orderId: z.string().optional(),
  subOrderId: z.string().optional(),
  expenseCategoryId: z.string().optional(),
  hasInvoice: z.enum(["YES", "NO"]).optional(),
  transactionDate: z.date({
    required_error: "Please select a transaction date",
  }),
  remark: z
    .string({
      required_error: "Please provide a remark",
    })
    .min(5, "Remark must be at least 5 characters"),
});

const formSchema = z
  .object({
    transactions: z.array(transactionSchema),
  })
  .refine(
    (data) => {
      return data.transactions.every((transaction) => {
        if (
          transaction.paymentMethod === "BANK" &&
          !transaction.bankAccountId
        ) {
          return false;
        }
        if (transaction.type === "EXPENSE" && !transaction.expenseCategoryId) {
          return false;
        }
        return true;
      });
    },
    {
      message: "Please fill all required fields for each transaction",
    }
  );

export default function NewTransactionPage() {
  const { user, hasPermission , isAdmin, isAccountant } = useAuth();  const router = useRouter();  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceUrls, setInvoiceUrls] = useState<{ [key: number]: string }>({});
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<{ [key: number]: string }>({});

  const { data: bankAccountsData, isLoading: isLoadingBankAccounts } = useGetBankAccounts();
  const { data: expenseCategoriesData, isLoading: isLoadingExpenseCategories } = useGEtExpence();
  const { data: ordersData, isLoading: isLoadingOrders } = useGetOrders();
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsers();
  const { mutateAsync: createTransaction } = useCreateTransaction();

  const bankAccounts = bankAccountsData?.accounts;
  const expenseCategories = expenseCategoriesData?.categories;
  const orders = ordersData?.orders;
  const users = usersData;

  const canUseCash = hasPermission("USE_CASH");
  const canUseBankAccounts = hasPermission("USE_BANK_ACCOUNTS");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),    defaultValues: {
      transactions: [
        {
          type: "IMPREST",
          amount: undefined,
          receiver: "",
          paymentMethod: canUseBankAccounts ? "BANK" : "CASH",
          bankAccountId: canUseBankAccounts
            ? bankAccounts?.find((acc) => acc.isDefault)?.id
            : undefined,
          orderId: undefined,
          subOrderId: undefined,
          expenseCategoryId: undefined,
          hasInvoice: "NO",
          transactionDate: new Date(),
          remark: "",
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "transactions",
  });

  if (!user) return null;

  // Get list of all users excluding current user
  const transferOptions = users?.filter(u => u.id !== user.id) || [];
  // Get active orders
  const activeOrders = orders?.filter(o => o.status === "ACTIVE") || [];

  // Get active expense categories
  const activeExpenseCategories =
    expenseCategories?.filter((c) => c.isActive) || [];

async function onSubmit(values: z.infer<typeof formSchema>) {
  setIsSubmitting(true);

  try {
    // Check if we need invoices but don't have them
    const hasInvoiceWithoutFile = values.transactions.some((transaction, index) => 
      transaction.type === "EXPENSE" && 
      transaction.hasInvoice === "YES" && 
      !invoiceUrls[index]
    );

    if (hasInvoiceWithoutFile) {
      toast.warning("Some transactions are missing invoice uploads");
      if (!confirm("Some expense transactions are missing invoice uploads. Continue anyway?")) {
        setIsSubmitting(false);
        return;
      }
    }

    // Using index-based iteration instead of entries()
    for (let index = 0; index < values.transactions.length; index++) {
      const transactionData = values.transactions[index];      const newTransaction = {
        amount: transactionData.amount,
       type: transactionData.type.toUpperCase() as "IMPREST" | "EXPENSE",
 senderId: user?.id || "",
        receiverId:
          transactionData.type === "EXPENSE"
            ? "EXPENSE"
            : transactionData.receiver,
        remark: transactionData.remark,
        paymentMethod: transactionData.paymentMethod.toUpperCase() as "CASH" | "BANK",
        bankAccountId:
          transactionData.paymentMethod === "BANK"
            ? transactionData.bankAccountId
            : undefined,        orderId: transactionData.orderId,
        subOrderId: transactionData.subOrderId,
        expenseCategoryId:
          transactionData.type === "EXPENSE"
            ? transactionData.expenseCategoryId
            : undefined,
        hasInvoice: transactionData.hasInvoice === "YES",
        invoiceUrl: invoiceUrls[index],
        entryDate: new Date(),
        transactionDate: transactionData.transactionDate,
       status: "APPROVED" as "PENDING" | "APPROVED" | "REJECTED" | undefined, createdBy: user?.id || "",
      };      const created = await createTransaction(newTransaction);      
      // Individual success message
      toast.success(`Transaction ${index + 1} created`, {
        description: `ID: ${created.transaction.id}`,
      });
    }

    // Success message and delay before redirect
    toast.success("All transactions created successfully!", {
      description: "Redirecting to transactions page..."
    });
    
    // Allow the toast messages to be visible before redirecting
    setTimeout(() => {
      // Force a hard refresh when navigating to ensure all data is fresh
      window.location.href = "/transactions";
    }, 2000);
  } catch (error: any) {
    console.error("Error creating transactions:", error);
    toast.error("Failed to create transactions");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // const showPaymentMethod = isAdmin() || isAccountant();
  
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">New Transactions</h1>
        </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create Multiple Transactions</CardTitle>
          <CardDescription>
            Create multiple imprest or expense transactions at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              id="new-transaction-form"
            >
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4 relative">
                  <div className="absolute right-2 top-2">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-medium">Transaction {index + 1}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Transaction Type */}
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transaction Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-row space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="IMPREST" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Imprest</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="EXPENSE" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Expense</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Amount */}
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter amount" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Payment Method */}
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.paymentMethod`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-row space-x-4"
                              >
                                {canUseCash && (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <RadioGroupItem value="CASH" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Cash</FormLabel>
                                  </FormItem>
                                )}
                                {canUseBankAccounts && (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <RadioGroupItem value="BANK" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Bank</FormLabel>
                                  </FormItem>
                                )}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Receiver */}
                      {form.watch(`transactions.${index}.type`) === "IMPREST" && (
                        <FormField
                          control={form.control}
                          name={`transactions.${index}.receiver`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Receiver</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select receiver" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {transferOptions.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Expense Category */}
                      {form.watch(`transactions.${index}.type`) === "EXPENSE" && (
                        <FormField
                          control={form.control}
                          name={`transactions.${index}.expenseCategoryId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expense Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {activeExpenseCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {form.watch(`transactions.${index}.paymentMethod`) === "BANK" && canUseBankAccounts && (
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.bankAccountId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Account</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bank account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {bankAccounts?.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.bankName} - {account.accountNumber}
                                    {account.isDefault && " (Default)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name={`transactions.${index}.orderId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Update selected order for fetching suborders
                              setSelectedOrderIds(prev => ({ ...prev, [index]: value || "" }));
                              // Clear suborder when order changes
                              form.setValue(`transactions.${index}.subOrderId`, undefined);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select order" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeOrders.map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                  {order.orderNumber} - {order.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isLoadingOrders && <FormDescription>Loading orders...</FormDescription>}
                          <FormDescription>
                            Link this transaction to an active order
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}                    />                    {/* SubOrder Selection - only show if an order is selected */}
                    {form.watch(`transactions.${index}.orderId`) && (
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.subOrderId`}
                        render={({ field }) => (
                          <SubOrderSelect 
                            orderId={selectedOrderIds[index] || ""}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Invoice Available */}
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.hasInvoice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Available?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-row space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="YES" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Yes</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="NO" />
                                  </FormControl>
                                  <FormLabel className="font-normal">No</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Transaction Date */}
                      <FormField
                        control={form.control}
                        name={`transactions.${index}.transactionDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transaction Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("2024-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              The date when the transaction actually occurred
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Upload Dropzone */}
                    {form.watch(`transactions.${index}.type`) === "EXPENSE" &&
                      form.watch(`transactions.${index}.hasInvoice`) === "YES" && (
                        <div className="space-y-4">
                          <FormLabel>Upload Invoice</FormLabel>
                          <div className="bg-background border-2 border-dashed border-primary/20 rounded-lg transition-colors hover:border-primary/50 hover:bg-accent overflow-hidden">
                            <UploadDropzone
                              endpoint="imageUploader"
                              className="ut-label:text-primary ut-allowed-content:text-muted-foreground ut-upload-icon:text-primary ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
                              onClientUploadComplete={(res) => {
                                if (res && res.length > 0) {
                                  setInvoiceUrls((prev) => ({
                                    ...prev,
                                    [index]: res[0].url,
                                  }));
                                  toast.success("Invoice uploaded successfully", {
                                    description:
                                      "Your file has been uploaded and will be attached to this transaction",
                                  });
                                }
                              }}
                              onUploadError={(error: Error) => {
                                toast.error(`Upload failed: ${error.message}`, {
                                  description:
                                    "Please try again or contact support if the issue persists",
                                });
                              }}
                            />
                          </div>
                          {invoiceUrls[index] && (
                            <div className="mt-2 p-3 border rounded-md bg-accent/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                  <FileIcon className="h-4 w-4" />
                                  <span>File uploaded successfully</span>
                                </div>
                                <a
                                  href={invoiceUrls[index]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  View file
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    <FormField
                      control={form.control}
                      name={`transactions.${index}.remark`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remark</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter details about this transaction"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Please provide a clear purpose for this transaction
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"                onClick={() => append({
                  type: "IMPREST",
                  amount: 0,
                  receiver: "",
                  paymentMethod: canUseBankAccounts ? "BANK" : "CASH",
                  bankAccountId: canUseBankAccounts ? bankAccounts?.find(acc => acc.isDefault)?.id : undefined,
                  orderId: undefined,
                  subOrderId: undefined,
                  expenseCategoryId: undefined,
                  hasInvoice: "NO",
                  transactionDate: new Date(),
                  remark: "",
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Transaction
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="new-transaction-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Transactions"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
