"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { resetPasswordSchema } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/auth/auth-layout";
import { Loader2 } from "lucide-react";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (!code) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setOobCode(code);

    verifyPasswordResetCode(auth, code)
      .then(() => {
        setIsVerified(true);
      })
      .catch(() => {
        setError("Invalid or expired reset link. Please request a new one.");
      });
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!oobCode) return;
    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      toast({
        title: "Success",
        description: "Your password has been reset. You can now log in.",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (error) {
    return (
        <AuthLayout>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/forgot-password" className="w-full">
              <Button variant="outline" className="w-full">
                Request new link
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  if (!isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Reset Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reset Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    )
}
