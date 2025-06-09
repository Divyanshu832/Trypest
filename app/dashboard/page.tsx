"use client";

import { useAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyFormatter } from "@/components/ui/currency-formatter";
import { DateFormatter } from "@/components/ui/date-formatter";
import { Wallet, ArrowUpCircle, ArrowDownCircle, BarChart4, Plus, Users, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetUserLedger } from "@/app/features/transaction/use-get-user-ledger";

export default function Dashboard() {  const { user, isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: userLedger, isLoading: ledgerLoading } = useGetUserLedger(user?.id || "");
  
  // Let middleware handle authentication redirects
  useEffect(() => {
    if(!isAuthenticated()
    ) {
      router.push("/");
      return;
    }
    
    if(user && user.isFirstLogin) {
      router.push("/change-password");
      return;
    }
    // No client-side auth redirects - middleware handles this
  }, []);
   
  if (!user||user.isFirstLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading dashboard...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    );
  }
  
  const recentTransactions = userLedger?.entries
    .sort((a, b) => (b.transactionDate?.getTime() || 0) - (a.transactionDate?.getTime() || 0))
    .slice(0, 5) || [];
  
  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
          <Link href="/transactions/new">
            <Plus className="mr-2 h-4 w-4" /> New Transaction
          </Link>
        </Button>
      </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ledgerLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  <CurrencyFormatter amount={userLedger?.summary.balance || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Available imprest funds
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Received
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ledgerLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  <CurrencyFormatter amount={userLedger?.summary.totalCredit || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total imprest received
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spent
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ledgerLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  <CurrencyFormatter amount={userLedger?.summary.totalDebit || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total imprest spent or transferred
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transactions
            </CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ledgerLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {userLedger?.entries.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total number of transactions
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
        <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your most recent transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ledgerLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.transactionId}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center gap-1">
                        {transaction.transactionId}
                        {transaction.type === 'expense' && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                            Expense
                          </span>
                        )}
                        {transaction.type === 'imprest' && (transaction.credit > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            Received
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Sent
                          </span>
                        ))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.type === 'imprest' ? 
                          (transaction.debit > 0 ? 
                            `To: ${transaction.to}` : 
                            `From: ${transaction.from}`) : 
                          'Expense: ' + transaction.remark.substring(0, 20) + (transaction.remark.length > 20 ? '...' : '')}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          <DateFormatter date={transaction.transactionDate} />
                        </p>
                        <span className="text-xs text-muted-foreground capitalize">
                          • {transaction.paymentMethod}
                        </span>
                      </div>
                    </div>
                    <div className={transaction.credit > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      <span className="text-sm font-medium">
                        {transaction.credit > 0 ? '+' : '-'}
                        <CurrencyFormatter amount={transaction.credit || transaction.debit} />
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/transactions">View all transactions</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            )}
          </CardContent>
        </Card>
          <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start hover:bg-primary/10 hover:text-primary" asChild>
                <Link href="/transactions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Transaction
                </Link>
              </Button>
              <Button variant="outline" className="justify-start hover:bg-primary/10 hover:text-primary" asChild>
                <Link href="/transactions">
                  <Wallet className="mr-2 h-4 w-4" />
                  View My Ledger
                </Link>
              </Button>
              {isAdmin() && (
                <>
                  <Button variant="outline" className="justify-start hover:bg-primary/10 hover:text-primary" asChild>
                    <Link href="/employees">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Employees
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start hover:bg-primary/10 hover:text-primary" asChild>
                    <Link href="/audit">
                      <FileText className="mr-2 h-4 w-4" />
                      View Audit Logs
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
}