"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    async function performLogout() {
      try {
        // Call the logout API
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        // Regardless of the API response, clear local state
        logout();
        
        // Wait a moment before redirecting to ensure state is cleared
        setTimeout(() => {
          router.push("/login");
        }, 1000);
        
      } catch (error) {
        console.error("Logout error:", error);
        // Even if there's an error, still try to log out locally
        logout();
        router.push("/login");
      }
    }
    
    performLogout();
  }, [logout, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full px-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <LogOut className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Logging Out...</CardTitle>
            <CardDescription className="text-center">
              You are being securely logged out of your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Please wait while we complete the logout process.</p>
            <Button 
              onClick={() => router.push("/login")} 
              variant="outline"
              className="w-full"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
