"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function LoginSuccessPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [countdown, setCountdown] = useState(3);
  useEffect(() => {
    // Let middleware handle authentication redirects
    // This page should only be accessed after successful authentication
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }

    // Auto-redirect after countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full px-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Login Successful!</CardTitle>
            <CardDescription className="text-center">
              You have successfully logged in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Redirecting to dashboard in {countdown} seconds...</p>
            <Button 
              onClick={() => router.push("/dashboard")} 
              className="w-full"
            >
              Go to Dashboard Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
