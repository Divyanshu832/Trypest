"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, FileText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
 // Assuming you have this
import { User } from "@/types"; // Replace with correct path to your User type
import { Badge } from "@/components/ui/badge";
import { DateFormatter } from "@/components/ui/date-formatter";

export const employeeColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "printName",
    header: "Print Name",
    cell: ({ row }) => <div>{row.getValue("printName")}</div>,
  },
  {
    accessorKey: "senderId",
    header: "Sender ID",
    cell: ({ row }) => <div>{row.getValue("senderId")}</div>,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as String;
      return (
        <Badge
          variant={role === "admin" ? "secondary" : role === "accountant" ? "secondary" : "default"}
        >
          {role?.charAt(0).toUpperCase() + role?.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "position",
    header: "Position",
    cell: ({ row }) => <div>{row.getValue("position")}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <DateFormatter date={row.getValue("createdAt")} formatStr="PP" />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
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
            <DropdownMenuItem asChild>
              <Link href={`/transactions?userId=${user.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                View Ledger
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {} 
              // handleEdit(user)
              }>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Employee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];