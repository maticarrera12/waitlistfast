"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthShell } from "../_components/auth-shell";
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
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema, ForgotPasswordInput } from "@/lib/schemas/auth.schema";
import { useRouter } from "next/navigation";
import { LoadingSwap } from "@/components/ui/loading-swap";

function ForgotPassword() {
  const router = useRouter();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function handleForgotPassword(data: ForgotPasswordInput) {
    await authClient.requestPasswordReset(
      {
        ...data,
        redirectTo: `/reset-password`,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "An error occurred");
        },
        onSuccess: () => {
          toast.success("You have been sent a password reset email");
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleForgotPassword)}>
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

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/signin")}>
            Back to Sign In
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <LoadingSwap isLoading={isSubmitting}>Submit</LoadingSwap>
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ForgotPasswordPage() {

  return (
    <AuthShell
      title="Don't worry it happens! Resetting your password is quick and easy."
      subtitle="Just enter your registered email address below, and we'll send you a secure link to reset your password. Follow the instructions in the email, and you'll be back in your account in no time!"
      cardTitle="Follow the instructions"
      cardSubtitle="If you don't see the email in your inbox, be sure to check your spam or junk folder."
    >
      <div className="flex items-center justify-center bg-background px-4">
        <div className=" w-full space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Forgot Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">Just enter your registered email address below, and we'll send you a secure link to reset your password. Follow the instructions in the email, and you'll be back in your account in no time!</p>
          </div>

          <div>
            <ForgotPassword />
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
