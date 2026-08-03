import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { getServerCaller } from "@/trpc/server";
import { CarForm } from "@/components/admin/car-form";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caller = await getServerCaller();
  const car = await caller.cars.getById({ id }).catch((error) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit Car</h1>
      <CarForm
        carId={car.id}
        defaultValues={{
          ...car,
          pricePerDay: Number(car.pricePerDay),
          imageUrl: car.imageUrl ?? undefined,
          description: car.description ?? undefined,
        }}
      />
    </div>
  );
}
