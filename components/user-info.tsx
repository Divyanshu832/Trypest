"use client";

import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export function UserInfo() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Get initials from name or printName, fallback to "U" for "User"
  const initials = user?.printName?.substring(0, 2) || 
                  user?.name?.substring(0, 2) || 
                  "U";
  
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="hidden md:flex flex-col">
        <span className="text-sm font-medium">{user.name || 'User'}</span>
        <span className="text-xs text-muted-foreground">
          {user?.role === 'admin' ? 'Admin' : 'Employee'}
        </span>
      </div>
      <Separator orientation="vertical" className="h-8 mx-2 hidden md:block" />
    </div>
  );
}