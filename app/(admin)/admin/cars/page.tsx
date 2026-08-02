import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarsTable } from "@/components/admin/cars-table";

export default function AdminCarsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Fleet</h1>
        <Button asChild>
          <Link href="/admin/cars/new">
            <Plus className="size-4" />
            Add car
          </Link>
        </Button>
      </div>
      <CarsTable />
    </div>
  );
}
