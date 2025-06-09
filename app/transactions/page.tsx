'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useGetUsers } from "@/app/features/user/use-get-employee";
import { useGetBankAccounts } from "@/app/features/bankaccount/use-get-bankacc";
import { useGEtExpence } from "@/app/features/expensecategory/use-get-expense";
import { useGetUserLedger } from "@/app/features/transaction/use-get-user-ledger";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { CurrencyFormatter } from "@/components/ui/currency-formatter";
import { DateFormatter } from "@/components/ui/date-formatter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Wallet, ArrowLeft, ExternalLink, Search, FileText, X } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { LedgerEntry } from "@/types";
import Link from "next/link";
import { toast } from "sonner";

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isAccountant } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>(
    searchParams.get("userId") || (user?.id || "")
  );
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerEntry | null>(null);
  const [activeTab, setActiveTab] = useState<string>("my-ledger");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "imprest" | "expense">("all");
  
  // Fetch data using API hooks
  const { data: usersData, isLoading: usersLoading } = useGetUsers();
  const { data: bankAccountsData, isLoading: bankAccountsLoading } = useGetBankAccounts();
  const { data: expenseCategoriesData, isLoading: expenseCategoriesLoading } = useGEtExpence();
  const { data: userLedger, isLoading: ledgerLoading } = useGetUserLedger(selectedUserId);
  
  // For accountants, we need to also load the admin's ledger
  const adminId = usersData?.find(u => u.role === "admin")?.id;
  const { data: adminLedger, isLoading: adminLedgerLoading } = useGetUserLedger(
    isAccountant() && adminId ? adminId : ""
  );
  
  if (!user) {
    return null;
  }

  // Handle loading states
  if (usersLoading || bankAccountsLoading || expenseCategoriesLoading || ledgerLoading || 
      (isAccountant() && adminLedgerLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  const users = usersData || [];
  const bankAccounts = bankAccountsData?.accounts || [];
  const expenseCategories = expenseCategoriesData?.categories || [];
  
  // Get list of viewable users based on role
  const viewableUsers = isAdmin() 
    ? users.filter(u => u.id !== user.id) // Admin can see all users
    : isAccountant()
    ? users.filter(u => u.role === "employee") // Accountant can see employees only
    : []; // Regular employees can only see their own ledger

  // Get viewing user
  const viewingUser = users.find(u => u.id === selectedUserId);

  // Helper functions
  const getUserById = (userId: string) => users.find(u => u.id === userId);
  const getBankAccountById = (accountId: string) => bankAccounts.find(a => a.id === accountId);
  
  // Filter function for searching across multiple columns
  const filterData = (data: LedgerEntry[]) => {
    if (!data) return [];
    
    let filteredData = data;

    // Apply type filter
    if (typeFilter !== "all") {
      filteredData = filteredData.filter(entry => entry.type === typeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredData = filteredData.filter(entry => {
        const searchableFields = [
          entry.transactionId,
          entry.from,
          entry.to,
          entry.type,
          entry.remark,
          entry.paymentMethod,
          new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'INR' 
          }).format(entry.credit || entry.debit),
        ];

        return searchableFields.some(field => 
          String(field).toLowerCase().includes(query)
        );
      });
    }

    return filteredData;
  };
  
  // Function to handle user click
  const handleUserClick = (userId: string) => {
    if (!isAdmin() && !isAccountant()) return;
    
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Accountants can only view employee ledgers and admin ledger
    if (isAccountant() && targetUser.role !== "employee" && targetUser.role !== "admin") return;

    setSelectedUserId(userId);
    router.push(`/transactions?userId=${userId}`);
  };
  
  const baseColumns: ColumnDef<LedgerEntry>[] = [
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => (
        <div className="font-medium">
          {(isAdmin() || isAccountant()) ? (
            <Button
              variant="link"
              className="p-0 h-auto font-medium"
              onClick={() => setSelectedTransaction(row.original)}
            >
              {row.original.transactionId}
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            row.original.transactionId
          )}
        </div>
      ),
    },
    {
      accessorKey: "from",
      header: "From",
      cell: ({ row }) => {
        const fromUserId = row.original.senderId;
        const canClick = (isAdmin() || isAccountant()) && fromUserId !== user.id;
        
        return (
          <div>
            {canClick ? (
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => handleUserClick(fromUserId)}
              >
                {row.original.from}
              </Button>
            ) : (
              row.original.from
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "to",
      header: "To",
      cell: ({ row }) => {
        const toUserId = row.original.receiverId;
        const canClick = (isAdmin() || isAccountant()) && 
                        toUserId !== "EXPENSE" && 
                        toUserId !== user.id;
        
        return (
          <div>
            {canClick ? (
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => handleUserClick(toUserId)}
              >
                {row.original.to}
              </Button>
            ) : (
              row.original.to
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.type === "imprest" ? "default" : "destructive"}>
          {row.original.type === "imprest" ? "Imprest" : "Expense"}
        </Badge>
      ),
    },
    {
      accessorKey: "hasInvoice",
      header: "Invoice",
      cell: ({ row }) => {
        if (row.original.type !== "expense") return null;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={row.original.hasInvoice ? "default" : "secondary"}>
              {row.original.hasInvoice ? "Yes" : "No"}
            </Badge>
            {row.original.hasInvoice && row.original.invoiceUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(row.original.invoiceUrl, '_blank')}
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) => (
        row.original.credit > 0 ? (
          <div className="text-green-600 dark:text-green-400 font-medium">
            <CurrencyFormatter amount={row.original.credit} />
          </div>
        ) : null
      ),
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) => (
        row.original.debit > 0 ? (
          <div className="text-red-600 dark:text-red-400 font-medium">
            <CurrencyFormatter amount={row.original.debit} />
          </div>
        ) : null
      ),
    },
    {
      accessorKey: "remark",
      header: "Remark",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.remark}>
          {row.original.remark}
        </div>
      ),
    },
    {
      accessorKey: "entryDate",
      header: "Entry Date",
      cell: ({ row }) => (
        <DateFormatter date={row.original.entryDate} />
      ),
    },
    {
      accessorKey: "transactionDate",
      header: "Transaction Date",
      cell: ({ row }) => (
        <DateFormatter date={row.original.transactionDate} />
      ),
    },
  ];
  
  // Add payment method column only for admin and accountant
  const columns: ColumnDef<LedgerEntry>[] = isAdmin() || isAccountant() 
    ? [
        ...baseColumns.slice(0, 4),
        {
          accessorKey: "paymentMethod",
          header: "Payment Method",
          cell: ({ row }: { row: any }) => {
            const bankAccount = row.original.bankAccountId 
              ? getBankAccountById(row.original.bankAccountId)
              : null;
            return (
              <div className="flex items-center gap-1.5">
                {row.original.paymentMethod === "bank" ? (
                  <>
                    <Building2 className="h-4 w-4" />
                    <span>
                      {bankAccount 
                        ? `${bankAccount.bankName} - ${bankAccount.branchName}`
                        : "Bank"}
                    </span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span>Cash</span>
                  </>
                )}
              </div>
            );
          },
        },
        ...baseColumns.slice(4),
      ]
    : baseColumns;
  
  const renderLedgerContent = (ledger: any, title: string) => {
    if (!ledger) return null;
    
    return (
      <>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyFormatter amount={ledger.summary.balance} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                <CurrencyFormatter amount={ledger.summary.totalCredit} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                <CurrencyFormatter amount={ledger.summary.totalDebit} />
              </div>
            </CardContent>
          </Card>
        </div>
      
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Complete record of all transactions
            </CardDescription>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(value: "all" | "imprest" | "expense") => setTypeFilter(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="imprest">Imprest Only</SelectItem>
                    <SelectItem value="expense">Expenses Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filterData(ledger.entries || [])}
            />
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button variant="outline" onClick={() => toast.info("PDF export functionality will be available soon")}>
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => toast.info("Excel export functionality will be available soon")}>
              Export Excel
            </Button>
          </CardFooter>
        </Card>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {searchParams.get("userId") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUserId(user.id);
                router.push("/transactions");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Ledger
            </Button>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {selectedUserId === user.id ? "My Ledger" : `${viewingUser?.name}'s Ledger`}
          </h1>
        </div>
        <Button asChild>
          <Link href="/transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>
      
      {isAccountant() ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="my-ledger" className="flex-1 sm:flex-none">My Ledger</TabsTrigger>
            <TabsTrigger value="admin-ledger" className="flex-1 sm:flex-none">Admin Ledger</TabsTrigger>
          </TabsList>
          <TabsContent value="my-ledger" className="space-y-6">
            {userLedger && renderLedgerContent(userLedger, "My Transaction History")}
          </TabsContent>
          <TabsContent value="admin-ledger" className="space-y-6">
            {adminLedger && renderLedgerContent(adminLedger, "Admin Transaction History")}
          </TabsContent>
        </Tabs>
      ) : (
        userLedger && renderLedgerContent(userLedger, "Transaction History")
      )}

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader className="sticky top-0 z-50 bg-background pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogDescription>
                  Complete information about this transaction
                </DialogDescription>
              </div>
              <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Transaction ID</div>
                <div className="col-span-3">{selectedTransaction.transactionId}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Type</div>
                <div className="col-span-3">
                  <Badge variant={selectedTransaction.type === "imprest" ? "default" : "destructive"}>
                    {selectedTransaction.type === "imprest" ? "Imprest" : "Expense"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">From</div>
                <div className="col-span-3">
                  {selectedTransaction.senderId !== user.id && (isAdmin() || isAccountant()) ? (
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => {
                        handleUserClick(selectedTransaction.senderId);
                        setSelectedTransaction(null);
                      }}
                    >
                      {selectedTransaction.from}
                    </Button>
                  ) : (
                    selectedTransaction.from
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">To</div>
                <div className="col-span-3">
                  {selectedTransaction.receiverId !== "EXPENSE" && 
                   selectedTransaction.receiverId !== user.id && 
                   (isAdmin() || isAccountant()) ? (
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => {
                        handleUserClick(selectedTransaction.receiverId);
                        setSelectedTransaction(null);
                      }}
                    >
                      {selectedTransaction.to}
                    </Button>
                  ) : (
                    selectedTransaction.to
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Amount</div>
                <div className="col-span-3">
                  <span className={selectedTransaction.credit > 0 ? "text-green-600" : "text-red-600"}>
                    {selectedTransaction.credit > 0 ? "+" : "-"}
                    <CurrencyFormatter amount={selectedTransaction.credit || selectedTransaction.debit} />
                  </span>
                </div>
              </div>

              {selectedTransaction.type === "expense" && selectedTransaction.expenseCategoryId && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="font-medium">Category</div>
                  <div className="col-span-3">
                    {expenseCategories.find(c => c.id === selectedTransaction.expenseCategoryId)?.name}
                  </div>
                </div>
              )}
              
              {(isAdmin() || isAccountant()) && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="font-medium">Payment Method</div>
                  <div className="col-span-3">
                    {selectedTransaction.paymentMethod === "bank" ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {(() => {
                          const bankAccount = selectedTransaction.bankAccountId 
                            ? getBankAccountById(selectedTransaction.bankAccountId)
                            : null;
                          return bankAccount ? (
                            <div className="grid gap-1">
                              <div>{bankAccount.bankName}</div>
                              <div className="text-sm text-muted-foreground">
                                Branch: {bankAccount.branchName}<br />
                                Account: {bankAccount.accountNumber}
                              </div>
                            </div>
                          ) : "Bank";
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Cash
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTransaction.type === "expense" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="font-medium">Invoice</div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedTransaction.hasInvoice ? "default" : "secondary"}>
                        {selectedTransaction.hasInvoice ? "Yes" : "No"}
                      </Badge>
                      {selectedTransaction.hasInvoice && selectedTransaction.invoiceUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedTransaction.invoiceUrl, '_blank')}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Remark</div>
                <div className="col-span-3">{selectedTransaction.remark}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Entry Date</div>
                <div className="col-span-3">
                  <DateFormatter date={selectedTransaction.entryDate} />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Transaction Date</div>
                <div className="col-span-3">
                  <DateFormatter date={selectedTransaction.transactionDate} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}