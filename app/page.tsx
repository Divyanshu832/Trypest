'use client';

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { Wallet, Users, FileText, BarChart4, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
    const params = useSearchParams();
    const error = params.get("error");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Don't render anything if already authenticated - let middleware handle redirects
  if(isAuthenticated()) {
    return null;

  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
     await signIn("credentials", {
      email: values.email,
      password: values.password,
      callbackUrl: "/dashboard",
      redirectTo: "/dashboard",   });
  }
 

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-white">Enterprise Imprest Management</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold tracking-tight">
                Streamline Your Enterprise Fund Management
              </h2>
              <p className="text-lg text-muted-foreground">
                A comprehensive solution for managing imprest funds, tracking expenses, and maintaining 
                transparent financial records across your organization.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-primary/5">
                  <CardHeader>
                    <Wallet className="h-6 w-6 text-primary mb-2" />
                    <CardTitle className="text-lg">Smart Tracking</CardTitle>
                    <CardDescription>
                      Real-time fund tracking and automated ledger updates
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="bg-primary/5">
                  <CardHeader>
                    <Users className="h-6 w-6 text-primary mb-2" />
                    <CardTitle className="text-lg">Team Management</CardTitle>
                    <CardDescription>
                      Efficient employee fund allocation and tracking
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="bg-primary/5">
                  <CardHeader>
                    <FileText className="h-6 w-6 text-primary mb-2" />
                    <CardTitle className="text-lg">Detailed Reports</CardTitle>
                    <CardDescription>
                      Comprehensive reporting and audit trails
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="bg-primary/5">
                  <CardHeader>
                    <BarChart4 className="h-6 w-6 text-primary mb-2" />
                    <CardTitle className="text-lg">Analytics</CardTitle>
                    <CardDescription>
                      Insightful spending patterns and trends
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            <div>
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
        
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                                {!!error && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive mb-6">
          <TriangleAlert className="size-4" />
          <p>Invalid email or password</p>
        </div>
      )}
                      <Button type="submit" className="w-full">
                        Sign In <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="text-sm text-muted-foreground text-center w-full">
                    Demo Credentials:
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2 w-full">
                    <div className="flex justify-between items-center p-2 rounded-lg border">
                      <div>
                        <div className="font-medium">Admin User</div>
                        <div className="text-xs">admin@example.com / admin123</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        form.setValue("email", "admin@example.com");
                        form.setValue("password", "admin123");
                      }}>
                        Use
                      </Button>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg border">
                      <div>
                        <div className="font-medium">Accountant</div>
                        <div className="text-xs">accountant@example.com / accountant123</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        form.setValue("email", "accountant@example.com");
                        form.setValue("password", "accountant123");
                      }}>
                        Use
                      </Button>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg border">
                      <div>
                        <div className="font-medium">Employee</div>
                        <div className="text-xs">employee@example.com / employee123</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        form.setValue("email", "employee@example.com");
                        form.setValue("password", "employee123");                      }}>
                        Use
                      </Button>
                    </div>
                  </div>
                </CardFooter>
                <div className="text-center mt-2 text-sm text-muted-foreground">
                  <a href="/login" className="underline">Employee Login</a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Enterprise Imprest Management System
        </div>
      </footer>
    </div>
  );
}