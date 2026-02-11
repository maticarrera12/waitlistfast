"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { AuthShell } from "../_components/auth-shell";
import PasswordInput from "@/app/(auth)/_components/password-input";
import SocialAuthButtons from "@/app/(auth)/_components/social-auth-buttons";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { type SignUpInput, signUpSchema } from "@/lib/schemas/auth.schema";
import { useRouter } from "next/navigation";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { signUp } from "@/actions/auth-actions";

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleSignUp = async (data: SignUpInput) => {
    setError("");

    try {
      const result = await signUp(data.email, data.password, data.name);

      if (!result.user) {
        setError("An error occurred");
      } else {
        queryClient.invalidateQueries({ queryKey: ["session"] });
        startTransition(() => {
        router.push("/dashboard");
        });
      }
    } catch (err) {
      setError(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const navigateToDashboard = useCallback(() => {
    startTransition(() => {
      router.push("/dashboard");
    });
  }, [router, startTransition]);

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data != null) {
        navigateToDashboard();
      }
    });
  }, [navigateToDashboard]);

  return (
    <AuthShell
      title="Welcome back! Please sign in to your WaitlistFast account"
      subtitle="Thank you for registering!"
      cardTitle="Please enter your login details"
      cardSubtitle="Stay connected with WaitlistFast. Subscribe now for the latest updates and news."
    >
      <div className=" flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Welcome! Please sign up to your WaitlistFast account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Thank you for registering!</p>
          </div>

          <div>
            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <SocialAuthButtons />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <PasswordInput form={form} />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <LoadingSwap isLoading={isSubmitting}>Submit</LoadingSwap>
                </Button>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/signin" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
