"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
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

const schema = z.object({ email: z.email() });

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setIsSubmitting(true);
    await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    setIsSubmitting(false);
    // Always show the same confirmation, whether or not the email exists,
    // so this form can't be used to enumerate registered accounts.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
        <p className="text-sm text-muted-foreground">
          If that email is registered, a reset link is on its way. Check your inbox.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </Form>
  );
}
