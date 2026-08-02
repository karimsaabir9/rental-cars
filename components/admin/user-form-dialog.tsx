"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

const baseFields = {
  name: z.string().min(1, "Name is required"),
  email: z.email(),
};

const createSchema = z.object({
  ...baseFields,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const editSchema = z.object({
  ...baseFields,
  // Unused in edit mode, but kept as a required string so both schemas
  // share one inferred type for react-hook-form's dynamic resolver.
  password: z.string(),
});

type FormValues = z.infer<typeof createSchema>;

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: ManagedUser | null;
}) {
  const isEdit = !!user;
  const utils = trpc.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        password: "",
      });
    }
  }, [open, user, form]);

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created.");
      utils.users.listAll.invalidate();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated.");
      utils.users.listAll.invalidate();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const isPending = createUser.isPending || updateUser.isPending;

  function onSubmit(values: FormValues) {
    if (isEdit && user) {
      updateUser.mutate({ id: user.id, name: values.name, email: values.email });
    } else {
      createUser.mutate({
        name: values.name,
        email: values.email,
        password: values.password ?? "",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this person's account details."
              : "Create a new account. They can sign in immediately with this password. New accounts are always created with the User role."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
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
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEdit && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEdit && user && (
              <div className="space-y-1.5">
                <Label>Role</Label>
                <div>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Roles can&apos;t be changed. The seeded admin account is the only Admin.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
