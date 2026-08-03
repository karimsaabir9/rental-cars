"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserFormDialog, type ManagedUser } from "@/components/admin/user-form-dialog";

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const { data: users, isLoading } = trpc.users.listAll.useQuery();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<ManagedUser | null>(null);

  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted.");
      utils.users.listAll.invalidate();
      setPendingDeleteUser(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  function openCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEdit(u: ManagedUser) {
    setEditingUser(u);
    setFormOpen(true);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add user
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !users || users.length === 0 ? (
        <p className="text-muted-foreground">No users yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No users match &ldquo;{search}&rdquo;.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    {u.name}
                    {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${u.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEdit({ ...u, role: u.role as ManagedUser["role"] })}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={isSelf}
                          onClick={() =>
                            setPendingDeleteUser({ ...u, role: u.role as ManagedUser["role"] })
                          }
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />

      <Dialog
        open={!!pendingDeleteUser}
        onOpenChange={(open) => !open && setPendingDeleteUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-destructive" />
              Delete user
            </DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{pendingDeleteUser?.name}</span>{" "}
              and their bookings. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteUser.isPending}
              onClick={() => pendingDeleteUser && deleteUser.mutate({ id: pendingDeleteUser.id })}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
