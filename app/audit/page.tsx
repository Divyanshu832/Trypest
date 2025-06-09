"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useGetAuditLogs } from "@/app/features/auditlog/use-get-auditlog";
import { useGetUsers } from "@/app/features/user/use-get-employee";
import { ColumnDef } from "@tanstack/react-table";
import { AuditLog } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateFormatter } from "@/components/ui/date-formatter";
import { CurrencyFormatter } from "@/components/ui/currency-formatter";
import { FileDown, ExternalLink, X } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function AuditPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Fetch audit logs and users from database
  const { data: auditLogsData, isLoading: auditLogsLoading, error: auditLogsError } = useGetAuditLogs();
  const { data: usersData, isLoading: usersLoading } = useGetUsers();
  // Extract audit logs from the response and normalize them
  const auditLogs = auditLogsData?.logs?.map((log: any) => ({
    ...log,
    action: log.action.toLowerCase(), // Convert CREATE -> create
    timestamp: new Date(log.timestamp), // Convert string to Date
  })) || [];
  const users = usersData || [];

  // Helper function to get user by ID
  const getUserById = (userId: string) => {
    return users.find((user: any) => user.id === userId);
  };

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (auditLogsError) {
      console.error("Error loading audit logs:", auditLogsError);
    }
  }, [auditLogsError]);
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "id",
      header: "Log ID",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium"
          onClick={() => setSelectedLog(row.original)}
        >
          {row.original.id}
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      ),
    },
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => {
        const user = getUserById(row.original.userId);
        return <div>{user?.name || row.original.userId}</div>;
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.original.action.toLowerCase();
        return (
          <Badge
            variant={
              action === "create"
                ? "default"
                : action === "update"
                ? "outline"
                : "destructive"
            }
          >
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "entityType",
      header: "Entity Type",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.entityType}</div>
      ),
    },
    {
      accessorKey: "entityId",
      header: "Entity ID",
      cell: ({ row }) => <div>{row.original.entityId}</div>,
    },    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => {
        const details = row.original.details;
        if (typeof details === 'object' && details) {
          // Try to get a meaningful summary from the object, filtering out system fields
          const detailsObj = details as any;
          
          // Filter out success and message fields
          const filteredEntries = Object.entries(detailsObj)
            .filter(([key]) => !['success', 'message'].includes(key.toLowerCase()));
          
          if (filteredEntries.length === 0) {
            return <div className="max-w-[200px] truncate text-muted-foreground">No details</div>;
          }
          
          // Show first few key-value pairs from filtered entries with proper formatting
          const entries = filteredEntries.slice(0, 2);
          const summary = entries.map(([key, value]) => {
            let formattedValue;
            if (typeof value === 'object' && value !== null) {
              // For nested objects, show a summary
              formattedValue = `{${Object.keys(value).length} fields}`;
            } else if (typeof value === 'boolean') {
              formattedValue = value ? 'Yes' : 'No';
            } else if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
              formattedValue = `$${value.toLocaleString()}`;
            } else {
              formattedValue = String(value);
            }
            return `${key}: ${formattedValue}`;
          }).join(', ');
          return <div className="max-w-[200px] truncate">{summary}</div>;
        }
        return <div className="max-w-[200px] truncate">{String(details)}</div>;
      },
    },{
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => <DateFormatter date={row.original.timestamp} />,
    },
  ];
  const exportToPDF = () => {
    if (!auditLogs.length) {
      console.warn("No audit logs to export");
      return;
    }

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Audit Logs Report', 14, 20);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 30);    // Prepare data for table
    const tableData = auditLogs.map(log => {
      const user = getUserById(log.userId);
      let detailsText = '';
      if (typeof log.details === 'object' && log.details) {
        const detailsObj = log.details as any;
        // Filter out system fields
        const filteredEntries = Object.entries(detailsObj)
          .filter(([key]) => !['success', 'message'].includes(key.toLowerCase()));
        
        if (filteredEntries.length > 0) {
          // Create a readable summary of the filtered object
          const entries = filteredEntries.slice(0, 3);
          detailsText = entries.map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return `${key}: {${Object.keys(value).length} fields}`;
            }
            return `${key}: ${value}`;
          }).join(', ');
        } else {
          detailsText = 'No details';
        }
      } else {
        detailsText = String(log.details);
      }
      
      return [
        log.id,
        user?.name || log.userId,
        log.action.charAt(0).toUpperCase() + log.action.slice(1),
        log.entityType,
        log.entityId,
        detailsText.substring(0, 50) + (detailsText.length > 50 ? '...' : ''),
        format(log.timestamp, 'PPpp'),
      ];
    });
    
    // Add table
    autoTable(doc, {
      head: [['Log ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'Timestamp']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    
    // Save the PDF
    doc.save('audit-logs.pdf');
  };

  const exportToExcel = () => {
    if (!auditLogs.length) {
      console.warn("No audit logs to export");
      return;
    }    // Prepare data for Excel
    const excelData = auditLogs.map(log => {
      const user = getUserById(log.userId);
      let detailsText = '';
      if (typeof log.details === 'object' && log.details) {
        const detailsObj = log.details as any;
        // Filter out system fields
        const filteredEntries = Object.entries(detailsObj)
          .filter(([key]) => !['success', 'message'].includes(key.toLowerCase()));
        
        if (filteredEntries.length > 0) {
          detailsText = JSON.stringify(Object.fromEntries(filteredEntries));
        } else {
          detailsText = 'No details';
        }
      } else {
        detailsText = String(log.details);
      }
      
      return {
        'Log ID': log.id,
        'User': user?.name || log.userId,
        'Action': log.action.charAt(0).toUpperCase() + log.action.slice(1),
        'Entity Type': log.entityType,
        'Entity ID': log.entityId,
        'Details': detailsText,
        'Timestamp': format(log.timestamp, 'PPpp'),
      };
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    
    // Save the file
    XLSX.writeFile(wb, 'audit-logs.xlsx');
  };
  const renderLogDetails = (log: AuditLog) => {
    const user = getUserById(log.userId);

    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <div className="font-medium">Log ID</div>
          <div className="col-span-3">{log.id}</div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <div className="font-medium">User</div>
          <div className="col-span-3">
            {user?.name || log.userId}
            {user?.role && (
              <span className="text-sm text-muted-foreground ml-2">
                ({user.role})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <div className="font-medium">Action</div>
          <div className="col-span-3">
            <Badge
              variant={
                log.action.toLowerCase() === "create"
                  ? "default"
                  : log.action.toLowerCase() === "update"
                  ? "outline"
                  : "destructive"
              }
            >
              {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <div className="font-medium">Entity Type</div>
          <div className="col-span-3 capitalize">{log.entityType}</div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <div className="font-medium">Entity ID</div>
          <div className="col-span-3">{log.entityId}</div>
        </div>        <div className="grid grid-cols-4 items-center gap-4">
          <div className="font-medium">Timestamp</div>
          <div className="col-span-3">
            <DateFormatter date={log.timestamp} formatStr="PPpp" />
          </div>
        </div>        <div className="border-t pt-4 mt-2">
          <h4 className="font-medium mb-4">Action Details</h4>
          <div className="grid gap-3 text-sm">
            {typeof log.details === 'object' && log.details ? (
              Object.entries(log.details)
                .filter(([key]) => !['success', 'message'].includes(key.toLowerCase()))
                .map(([key, value]) => (
                <div key={key} className="grid grid-cols-4 items-start gap-4">
                  <div className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="col-span-3">
                    {typeof value === 'number' && key.toLowerCase().includes('amount') ? (
                      <CurrencyFormatter amount={value} />
                    ) : typeof value === 'object' && value !== null ? (
                      <div className="space-y-1">
                        {Object.entries(value)
                          .filter(([nestedKey]) => !['success', 'message'].includes(nestedKey.toLowerCase()))
                          .map(([nestedKey, nestedValue]) => (
                          <div key={nestedKey} className="text-xs">
                            <span className="font-medium">{nestedKey}:</span> {String(nestedValue)}
                          </div>
                        ))}
                      </div>
                    ) : typeof value === 'boolean' ? (
                      <Badge variant={value ? "default" : "secondary"}>
                        {value ? "Yes" : "No"}
                      </Badge>
                    ) : (
                      <span className="break-words">{String(value)}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">
                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Audit Logs</CardTitle>
          <CardDescription>
            Complete record of all administrative actions in the system
          </CardDescription>
        </CardHeader>        <CardContent>
          {auditLogsLoading || usersLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-muted-foreground">Loading audit logs...</div>
            </div>
          ) : auditLogsError ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-destructive">Failed to load audit logs. Please try again later.</div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={auditLogs}
              searchColumn="entityId"
            />
          )}
        </CardContent>        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button 
            variant="outline" 
            onClick={exportToPDF}
            disabled={auditLogsLoading || !auditLogs.length}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            disabled={auditLogsLoading || !auditLogs.length}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader className="sticky top-0 z-50 bg-background pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Audit Log Details</DialogTitle>
                <DialogDescription>
                  Complete information about this audit log entry
                </DialogDescription>
              </div>
              <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </DialogHeader>
          
          {selectedLog && renderLogDetails(selectedLog)}
        </DialogContent>
      </Dialog>
    </div>
  );
}