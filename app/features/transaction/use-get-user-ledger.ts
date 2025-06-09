import { useQuery } from "@tanstack/react-query";
import { UserLedger, LedgerEntry } from "@/types";
import { useGetTransactions } from "./use-get-transactions";
import { useGetUsers } from "../user/use-get-employee";
import { useGetBankAccounts } from "../bankaccount/use-get-bankacc";

interface DatabaseTransaction {
  id: string;
  amount: number;
  type: 'IMPREST' | 'EXPENSE';
  senderId: string;
  receiverId: string;
  remark: string;
  paymentMethod: 'CASH' | 'BANK';
  bankAccountId?: string;
  orderId?: string;
  expenseCategoryId?: string;
  hasInvoice?: boolean;
  invoiceUrl?: string;
  entryDate: string;
  transactionDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // sender: { id: string; name: string };
  // creator: { id: string; name: string };
  bankAccount?: { id: string; bankName: string; accountNumber: string; branchName: string };
  order?: { id: string; orderNumber: string };
  expenseCategory?: { id: string; name: string };
}

export const useGetUserLedger = (userId: string) => {
  const { data: transactionsData, isLoading: transactionsLoading } = useGetTransactions();
  const { data: usersData, isLoading: usersLoading } = useGetUsers();
  const { data: bankAccountsData, isLoading: bankAccountsLoading } = useGetBankAccounts();

  return useQuery<UserLedger>({
    queryKey: ["userLedger", userId],
    queryFn: async () => {
      // Create a fallback empty ledger in case of errors
      const emptyLedger: UserLedger = {
        userId: userId || '',
        summary: {
          balance: 0,
          totalCredit: 0,
          totalDebit: 0
        },
        entries: []
      };

      if (!userId) {
        console.warn("No user ID provided to useGetUserLedger");
        return emptyLedger;
      }

      try {
        if (!transactionsData?.transactions || !usersData) {
          console.warn("Required data not available for user ledger", { 
            hasTransactions: !!transactionsData?.transactions, 
            hasUsers: !!usersData 
          });
          return emptyLedger;
        }

        const transactions = transactionsData?.transactions
        const users = usersData;
        const bankAccounts = bankAccountsData?.accounts || [];

      // Get user's transactions where they are directly involved
      const userTransactions = transactions.filter(t => 
        t.senderId === userId || t.receiverId === userId
      );

      // Calculate totals
      const summary = userTransactions.reduce(
        (acc, t) => {
          if (t.receiverId === userId) {
            acc.totalCredit += t.amount;
          }
          if (t.senderId === userId) {
            acc.totalDebit += t.amount;
          }
          return acc;
        },
        { totalCredit: 0, totalDebit: 0, balance: 0 }
      );

      // Calculate final balance
      summary.balance = summary.totalCredit - summary.totalDebit;

      // Helper function to get user name by ID
      const getUserName = (userId: string): string => {
        if (userId === 'EXPENSE') return 'Expense';
        const user = users.find(u => u.id === userId);
        return user?.name || userId;
      };

      // Map transactions to ledger entries
      const entries: LedgerEntry[] = userTransactions?.map(t => ({
        transactionId: t.id,
        type: t.type.toLowerCase() as 'imprest' | 'expense',
        from: getUserName(t.senderId),
        to: getUserName(t.receiverId),
        credit: t.receiverId === userId ? t.amount : 0,
        debit: t.senderId === userId ? t.amount : 0,
        remark: t.remark,
        paymentMethod: t.paymentMethod.toLowerCase() as 'cash' | 'bank',
        bankAccountId: t.bankAccountId || undefined,
        orderId: t.orderId || undefined,
        expenseCategoryId: t.expenseCategoryId || undefined,
        hasInvoice: t.hasInvoice === null ? undefined : t.hasInvoice,
        invoiceUrl: t.invoiceUrl || undefined,
        entryDate: new Date(t.entryDate),
        transactionDate: new Date(t.transactionDate),
        senderId: t.senderId,
        receiverId: t.receiverId,
      }));      // Sort entries by transaction date (most recent first)
      entries.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

      return {
        userId,
        summary,
        entries,
      };
      } catch (error) {
        console.error("Error processing user ledger data:", error);
        // Return empty ledger instead of throwing error
        return {
          userId: userId || '',
          summary: {
            balance: 0,
            totalCredit: 0,
            totalDebit: 0
          },
          entries: []
        };
      }
    },
    enabled: !!userId && !transactionsLoading && !usersLoading,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};
