"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { ColumnDef } from "@tanstack/react-table";
import { Order, OrderSeries, SubOrder } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useGetTransactions } from "@/app/features/transaction/use-get-transactions";
import { useGetUsers } from "@/app/features/user/use-get-employee";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DateFormatter } from "@/components/ui/date-formatter";
import { CurrencyFormatter } from "@/components/ui/currency-formatter";
import { Plus, MoreHorizontal, CheckCircle, XCircle, ExternalLink, Settings, Star, Trash, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { useCreateorder } from "../features/order/use-create-order";
import { useCreateoseries } from "../features/orderseries/use-create-os";
import { useGetorderseries } from "../features/orderseries/use-get-orderseries";
import { useGetorder } from "../features/order/use-get-order";
import { useGetSubOrdersByOrder } from "../features/suborder/use-get-suborders";
import { useCreateSubOrder } from "../features/suborder/use-create-suborder";
const orderFormSchema = z.object({
  description: z.string()
    .min(5, "Description must be at least 5 characters")
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  amount: z.coerce
    .number({
      required_error: "Please enter an amount",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be positive"),
  orderSeriesId: z.string({
    required_error: "Please select an order series",
  }),
});

const seriesFormSchema = z.object({
  prefix: z.string()
    .min(2, "Prefix must be at least 2 characters")
    .regex(/^[A-Z0-9-]+$/, "Prefix must contain only uppercase letters, numbers, and hyphens"),  suffix: z.string()
    .min(1, "Suffix must be at least 1 character")
    .regex(/^[A-Z0-9-]+$/, "Suffix must contain only uppercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
  startNumber: z.coerce.number().min(1, "Start number must be at least 1").optional(),
});

const subOrderFormSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  description: z.string()
    .min(5, "Description must be at least 5 characters")
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAdmin, isAccountant } = useAuth();  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
  const [isSubOrderDialogOpen, setIsSubOrderDialogOpen] = useState(false);
  const [selectedOrderForSubOrder, setSelectedOrderForSubOrder] = useState<Order | null>(null);
  const [selectedSubOrder, setSelectedSubOrder] = useState<string>("all");const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedUserInDialog, setSelectedUserInDialog] = useState<string>("all");
  const [selectedTransactionType, setSelectedTransactionType] = useState<string | null>(null);  const { data: orderseriesdata, isLoading: isLoadingOrderseries } = useGetorderseries();
  const { data: ordersdata, isLoading: isLoadingOrders } = useGetorder();
  const { mutate } = useCreateorder();
  const { mutate: createSubOrder } = useCreateSubOrder();const orderForm = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      orderSeriesId: "",
    },
  });
  // Update form when order series data is loaded
  useEffect(() => {
    if (orderseriesdata?.series && orderseriesdata.series.length > 0) {
      const defaultSeries = orderseriesdata.series.find(s => s.isDefault);
      if (defaultSeries && !orderForm.getValues('orderSeriesId')) {
        orderForm.setValue('orderSeriesId', defaultSeries.id);
      }
    }
  }, [orderseriesdata, orderForm]);  const seriesForm = useForm<z.infer<typeof seriesFormSchema>>({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      prefix: "",
      suffix: "",
      description: "",
      startNumber: 1,
    },
  });

  const subOrderForm = useForm<z.infer<typeof subOrderFormSchema>>({
    resolver: zodResolver(subOrderFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  if (!user || (!isAdmin() && !isAccountant())) {
    router.push("/dashboard");
    return null;
  }

const onOrderSubmit = (formData: z.infer<typeof orderFormSchema>) => {
  // Add the missing fields to the data before submitting
  const enhancedData = {
    ...formData,
    orderNumber: "AUTO", // This will be generated on the server
    status: "ACTIVE" as const, // Default status
    // createdBy: user?.id || ""  // Current user
  };

  mutate(enhancedData, {
    onSuccess: () => {
      // Optional: do something after successful order creation, e.g., reset form or navigate
      console.log("Order created successfully");
      setIsDialogOpen(false);
      orderForm.reset();      // Reset to default order series
      const defaultSeries = orderseriesdata?.series?.find(s => s.isDefault);
      if (defaultSeries) {
        orderForm.setValue('orderSeriesId', defaultSeries.id);
      }
    },
    onError: (error) => {
      console.error("Error creating order:", error.message);
    },
  });
};



  const { mutateAsync: createSeries } = useCreateoseries();

async function onSeriesSubmit(values: z.infer<typeof seriesFormSchema>) {
  try {
    await createSeries({
      prefix: values.prefix,
      suffix: values.suffix,
      description: values.description,
      startNumber: values.startNumber,
    });

    toast.success("Order series added successfully");
    setIsSeriesDialogOpen(false);
    seriesForm.reset();
  } catch (error) {
    // Error is already handled inside useCreateoseries,
    // but you can optionally handle it here too.
  }
}

function onSubOrderSubmit(values: z.infer<typeof subOrderFormSchema>) {
  if (!selectedOrderForSubOrder) return;

  createSubOrder({
    name: values.name,
    description: values.description,
    orderId: selectedOrderForSubOrder.id,
  }, {
    onSuccess: () => {
      toast.success("SubOrder created successfully");
      setIsSubOrderDialogOpen(false);
      setSelectedOrderForSubOrder(null);
      subOrderForm.reset();
    },
    onError: (error) => {
      toast.error("Failed to create suborder");
      console.error("Error creating suborder:", error);
    },
  });
}

  const handleSetDefaultSeries = (id: string) => {
    // TODO: Implement API call to set default series
    toast.success("Default order series updated");
  };
  const handleDeleteSeries = (id: string) => {
    // TODO: Implement API call to delete series
    toast.success("Order series deleted");
  };  
  
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setSelectedUserInDialog("all");
    setSelectedTransactionType(null);
  };
  // Utility functions for order details dialog - real implementation  // These functions fetch and process actual data from the API instead of using mock data
  const { data: usersData } = useGetUsers();
  const { data: transactionsData, isLoading: isLoadingTransactions } = useGetTransactions();
  const { data: subOrdersData } = useGetSubOrdersByOrder(selectedOrder?.id || "");
  
  const getUserById = (userId?: string) => {
    if (!userId) return null;
    if (!usersData) return { id: userId, name: userId }; // Fallback if users not loaded
    
    const user = usersData.find(u => u.id === userId);
    return user ? { id: user.id, name: user.name } : { id: userId, name: userId };
  };
  const getTransactionsByOrderId = (orderId?: string) => {
    if (!orderId || !transactionsData?.transactions) return [];
    
    // Filter transactions by orderId
    return transactionsData.transactions.filter(t => t.orderId === orderId).map(t => ({
      id: t.id,
      orderId: t.orderId,
      subOrderId: t.subOrderId, // Add subOrderId mapping
      amount: t.amount,
      type: t.type.toLowerCase(),
      senderId: t.senderId,
      receiverId: t.receiverId,
      transactionDate: new Date(t.transactionDate),
      status: t.status.toUpperCase()
    }));
  };

  const getOrderSummary = (orderId?: string) => {
    if (!orderId) return { totalTransferred: 0, totalSpent: 0, transactionCount: 0 };
    
    const transactions = getTransactionsByOrderId(orderId);
    const totalTransferred = transactions
      .filter(t => t.type === "imprest")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalTransferred,
      totalSpent,
      transactionCount: transactions.length
    };
  };

  const getInvolvedUsersInOrder = (orderId?: string) => {
    if (!orderId) return [];
    
    const transactions = getTransactionsByOrderId(orderId);
    const userIds = new Set<string>();
    
    transactions.forEach(t => {
      if (t.senderId !== "ADMIN" && t.senderId !== "SYSTEM") userIds.add(t.senderId);
      if (t.receiverId !== "EXPENSE") userIds.add(t.receiverId);
    });
    
    return Array.from(userIds).map(id => getUserById(id)).filter(Boolean);
  };
  const filterTransactions = (transactions: any[], userId: string, type: string | null, subOrderId: string) => {
    let filtered = [...transactions];
    
    if (userId !== "all") {
      filtered = filtered.filter(t => 
        t.senderId === userId || t.receiverId === userId
      );
    }
    
    if (type) {
      filtered = filtered.filter(t => t.type === type);
    }

    if (subOrderId !== "all") {
      filtered = filtered.filter(t => t.subOrderId === subOrderId);
    }
    
    return filtered;
  };

  const getUserTransactionSummary = (transactions: any[], userId: string) => {
    const userTransactions = transactions.filter(t => 
      t.senderId === userId || t.receiverId === userId
    );
    
    const totalReceived = userTransactions
      .filter(t => t.receiverId === userId && t.type === "imprest")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = userTransactions
      .filter(t => t.senderId === userId && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalReceived,
      totalSpent,
      transactionCount: userTransactions.length
    };
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order Number",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium"
          onClick={() => handleViewDetails(row.original)}
        >
          {row.original.orderNumber}
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <CurrencyFormatter amount={row.original.amount} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;        return (
          <Badge
            variant={
              status === "COMPLETED" ? "default" : 
              status === "ACTIVE" ? "outline" :
              "destructive"
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <DateFormatter date={row.original.createdAt} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleViewDetails(order)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedOrderForSubOrder(order);
                  setIsSubOrderDialogOpen(true);
                }}
              >
                <Package className="mr-2 h-4 w-4" />
                Create SubOrder
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Implement order status update API call
                  toast.success("Order marked as completed");
                }}
                disabled={order.status !== "ACTIVE"}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Implement order status update API call
                  toast.success("Order cancelled");
                }}
                disabled={order.status !== "ACTIVE"}
                className="text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  const seriesColumns: ColumnDef<OrderSeries>[] = [
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
      accessorKey: "suffix",
      header: "Suffix",
      cell: ({ row }) => <div>{row.original.suffix || "-"}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.original.description}</div>,
    },
    {
      accessorKey: "startNumber",
      header: "Start Number",
      cell: ({ row }) => <div>{row.original.startNumber}</div>,
    },
    {
      accessorKey: "lastNumber",
      header: "Last Number",
      cell: ({ row }) => <div>{row.original.lastNumber}</div>,
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
            {!row.original.isDefault && (
              <>
                <DropdownMenuItem onClick={() => handleSetDefaultSeries(row.original.id)}>
                  <Star className="mr-2 h-4 w-4" />
                  Set as Default
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteSeries(row.original.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Series
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Orders</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Settings className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Manage Series</span>
                <span className="sm:hidden">Series</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Order Series</DialogTitle>
                <DialogDescription>
                  Create a new order number series prefix
                </DialogDescription>
              </DialogHeader>
              <Form {...seriesForm}>
                <form onSubmit={seriesForm.handleSubmit(onSeriesSubmit)} className="space-y-4">                  <FormField
                    control={seriesForm.control}
                    name="prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prefix</FormLabel>
                        <FormControl>
                          <Input placeholder="ORD-2024" {...field} />
                        </FormControl>
                        <FormDescription>
                          Use uppercase letters, numbers, and hyphens only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={seriesForm.control}
                    name="suffix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suffix (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="A" {...field} />
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
                          <Input placeholder="Orders for 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={seriesForm.control}
                    name="startNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Number</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            min="1"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Order numbers will start from this number
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create Order</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Create a new order to track related transactions
                </DialogDescription>
              </DialogHeader>              <Form {...orderForm}>
                <form onSubmit={orderForm.handleSubmit(onOrderSubmit)} className="space-y-4" id="order-form">
                  <FormField
                    control={orderForm.control}
                    name="orderSeriesId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Series</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select order series" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {orderseriesdata?.series.map((series) => (
                              <SelectItem key={series.id} value={series.id}>
                                {series.prefix} - {series.description} {series.isDefault && "(Default)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the numbering series for this order
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />                  <FormField
                    control={orderForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter order details"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a clear description of this order
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={orderForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    orderForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" form="order-form">
                  Create Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="orders" className="flex-1 sm:flex-none">Orders</TabsTrigger>
          <TabsTrigger value="series" className="flex-1 sm:flex-none">Order Series</TabsTrigger>
        </TabsList>

        <TabsContent value="series">
          <Card>
            <CardHeader>
              <CardTitle>Order Number Series</CardTitle>
              <CardDescription>
                Manage order number prefixes and formats
              </CardDescription>
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>            <CardContent>
              {isLoadingOrderseries ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading order series...</p>
                  </div>
                </div>
              ) : (
                <DataTable
                  columns={seriesColumns}
                  data={(orderseriesdata?.series || []).map(series => ({
                    ...series,
                    createdAt: new Date(series.createdAt),
                    updatedAt: new Date(series.updatedAt)
                  }))}
                  searchColumn="prefix"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Manage and track orders for transactions
              </CardDescription>
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>            <CardContent>
              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading orders...</p>
                  </div>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={(ordersdata?.orders || []).map(order => ({
                    ...order,
                    createdAt: new Date(order.createdAt),
                    updatedAt: new Date(order.updatedAt)
                  }))}
                  searchColumn="orderNumber"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="font-medium">Order Number</div>
                    <div className="col-span-3">{selectedOrder.orderNumber}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="font-medium">Description</div>
                    <div className="col-span-3">{selectedOrder.description}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="font-medium">Amount</div>
                    <div className="col-span-3">
                      <CurrencyFormatter amount={selectedOrder.amount} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="font-medium">Status</div>
                    <div className="col-span-3">
                      <Badge
                        variant={
                          selectedOrder.status === "COMPLETED" ? "default" : 
                          selectedOrder.status === "ACTIVE" ? "outline" :
                          "destructive"
                        }
                      >
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="font-medium">Created By</div>
                    <div className="col-span-3">
                      {getUserById(selectedOrder.createdBy)?.name || selectedOrder.createdBy}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="font-medium">Created At</div>
                    <div className="col-span-3">
                      <DateFormatter date={selectedOrder.createdAt} />
                    </div>
                  </div>                </div>

                {(() => {
                  const transactions = getTransactionsByOrderId(selectedOrder.id);
                  const summary = getOrderSummary(selectedOrder.id);
                  const involvedUsers = getInvolvedUsersInOrder(selectedOrder.id);                  const filteredTransactions = filterTransactions(
                    transactions,
                    selectedUserInDialog,
                    selectedTransactionType,
                    selectedSubOrder
                  );
                    // Handle loading state
                  if (isLoadingTransactions) {
                    return (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">Loading transaction data...</p>
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle error state if needed
                  if (transactionsData && 'error' in transactionsData) {
                    return (
                      <div className="py-8 text-center text-red-500">
                        Error loading transactions: {(transactionsData as any).error}
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Transaction Summary</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Total Transferred</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                <CurrencyFormatter amount={summary.totalTransferred} />
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Total Spent</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                <CurrencyFormatter amount={summary.totalSpent} />
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {summary.transactionCount}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {transactions.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground">
                          No transactions found for this order.
                        </div>
                      )}

                      {selectedUserInDialog !== "all" && (() => {
                        const userSummary = getUserTransactionSummary(transactions, selectedUserInDialog);
                        const selectedUser = getUserById(selectedUserInDialog);
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-medium">{selectedUser?.name}'s Summary</h5>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">Total Received</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    <CurrencyFormatter amount={userSummary.totalReceived} />
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">Total Spent</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    <CurrencyFormatter amount={userSummary.totalSpent} />
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">Transactions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">
                                    {userSummary.transactionCount}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        );
                      })()}                      {transactions.length > 0 && (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Related Transactions</h4>
                              {/* Filters - Responsive layout */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Filter Transactions</h4>
                                {(selectedUserInDialog !== "all" || selectedTransactionType || selectedSubOrder !== "all") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      setSelectedUserInDialog("all");
                                      setSelectedTransactionType(null);
                                      setSelectedSubOrder("all");
                                    }}
                                  >
                                    Clear All
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2">
                                <Select
                                  value={selectedUserInDialog}
                                  onValueChange={setSelectedUserInDialog}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Filter by user" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Users ({involvedUsers.length})</SelectItem>
                                    {involvedUsers.filter(user => user !== null).map((user) => (
                                      <SelectItem key={user!.id} value={user!.id}>
                                        {user!.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <div className="grid grid-cols-2 gap-2">
                                  <Select
                                    value={selectedTransactionType || "all"}
                                    onValueChange={(value) => setSelectedTransactionType(value === "all" ? null : value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Types</SelectItem>
                                      <SelectItem value="imprest">Imprest</SelectItem>
                                      <SelectItem value="expense">Expense</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Select
                                    value={selectedSubOrder}
                                    onValueChange={setSelectedSubOrder}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="SubOrder" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All SubOrders</SelectItem>
                                      {subOrdersData?.subOrders?.map((subOrder) => (
                                        <SelectItem key={subOrder.id} value={subOrder.id}>
                                          {subOrder.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
                              {filteredTransactions.length !== transactions.length && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    setSelectedUserInDialog("all");
                                    setSelectedTransactionType(null);
                                    setSelectedSubOrder("all");
                                  }}
                                >
                                  Clear Filters
                                </Button>
                              )}
                            </div>
                            
                            {filteredTransactions.length === 0 ? (
                              <div className="py-8 text-center text-muted-foreground">
                                <p className="text-sm">No transactions match the current filters.</p>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="mt-2 p-0 h-auto text-xs"
                                  onClick={() => {
                                    setSelectedUserInDialog("all");
                                    setSelectedTransactionType(null);
                                    setSelectedSubOrder("all");
                                  }}
                                >
                                  Clear all filters
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {filteredTransactions.map((transaction) => {
                                  const from = getUserById(transaction.senderId);
                                  const to = transaction.receiverId === "EXPENSE" 
                                    ? "Expense" 
                                    : getUserById(transaction.receiverId)?.name;
                                  
                                  return (
                                    <div
                                      key={transaction.id}
                                      className="flex items-center justify-between border-b pb-2 last:border-b-0"
                                    >
                                      <div className="space-y-1 flex-1">
                                        <p className="text-sm font-medium leading-none">
                                          {transaction.id}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {from?.name || transaction.senderId} → {to || transaction.receiverId}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <DateFormatter date={transaction.transactionDate} />
                                          {transaction.subOrderId && subOrdersData?.subOrders?.find(s => s.id === transaction.subOrderId) && (
                                            <>
                                              <span>•</span>
                                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                                                {subOrdersData.subOrders.find(s => s.id === transaction.subOrderId)?.name}
                                              </Badge>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className={transaction.type === "imprest" ? "text-green-600" : "text-red-600"}>
                                        <span className="text-sm font-medium">
                                          <CurrencyFormatter amount={transaction.amount} />
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SubOrder Creation Dialog */}
      <Dialog open={isSubOrderDialogOpen} onOpenChange={setIsSubOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SubOrder</DialogTitle>
            <DialogDescription>
              Create a new suborder for "{selectedOrderForSubOrder?.orderNumber}"
            </DialogDescription>
          </DialogHeader>
          <Form {...subOrderForm}>
            <form onSubmit={subOrderForm.handleSubmit(onSubOrderSubmit)} className="space-y-4" id="suborder-form">
              <FormField
                control={subOrderForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SubOrder Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter suborder name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this suborder
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subOrderForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter suborder description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional details about this suborder
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSubOrderDialogOpen(false);
                setSelectedOrderForSubOrder(null);
                subOrderForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="suborder-form">
              Create SubOrder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}