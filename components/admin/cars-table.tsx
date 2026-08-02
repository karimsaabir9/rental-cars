"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { carCategoryLabel } from "@/lib/car-categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_BADGE_VARIANT = {
  available: "success",
  rented: "warning",
  maintenance: "secondary",
} as const;

export function CarsTable() {
  const { data: cars, isLoading } = trpc.cars.adminList.useQuery();
  const utils = trpc.useUtils();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const setStatus = trpc.cars.setStatus.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(`Car marked ${variables.status}.`);
      utils.cars.adminList.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteCar = trpc.cars.delete.useMutation({
    onSuccess: () => {
      toast.success("Car deleted.");
      utils.cars.adminList.invalidate();
      setPendingDeleteId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!cars || cars.length === 0) {
    return <p className="text-muted-foreground">No cars in the fleet yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price/day</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => (
            <TableRow key={car.id}>
              <TableCell>
                {car.make} {car.model} ({car.year})
              </TableCell>
              <TableCell>{carCategoryLabel(car.category)}</TableCell>
              <TableCell className="font-mono tabular-nums">${car.pricePerDay}</TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE_VARIANT[car.displayStatus]}>
                  {car.displayStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/cars/${car.id}/edit`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setStatus.mutate({
                          id: car.id,
                          status: car.status === "maintenance" ? "available" : "maintenance",
                        })
                      }
                    >
                      {car.status === "maintenance" ? "Mark available" : "Mark for maintenance"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setPendingDeleteId(car.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete car</DialogTitle>
            <DialogDescription>
              This will permanently remove the car and its booking history. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteCar.isPending}
              onClick={() => pendingDeleteId && deleteCar.mutate({ id: pendingDeleteId })}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
