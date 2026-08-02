"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { NumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import { CAR_CATEGORIES, CAR_CATEGORY_VALUES } from "@/lib/car-categories";

const carFormSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  category: z.enum(CAR_CATEGORY_VALUES),
  pricePerDay: z.number().positive(),
  seats: z.number().int().min(1).max(15),
  transmission: z.enum(["automatic", "manual"]),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid"]),
  licensePlate: z.string().min(1),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});

type CarFormValues = z.infer<typeof carFormSchema>;

export function CarForm({
  carId,
  defaultValues,
}: {
  carId?: string;
  defaultValues?: Partial<CarFormValues>;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      category: "sedan",
      pricePerDay: 50,
      seats: 5,
      transmission: "automatic",
      fuelType: "petrol",
      licensePlate: "",
      imageUrl: undefined,
      description: "",
      ...defaultValues,
    },
  });

  const createCar = trpc.cars.create.useMutation({
    onSuccess: () => {
      toast.success("Car created.");
      utils.cars.adminList.invalidate();
      router.push("/admin/cars");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateCar = trpc.cars.update.useMutation({
    onSuccess: () => {
      toast.success("Car updated.");
      utils.cars.adminList.invalidate();
      router.push("/admin/cars");
    },
    onError: (error) => toast.error(error.message),
  });

  const isPending = createCar.isPending || updateCar.isPending;

  function onSubmit(values: CarFormValues) {
    if (carId) {
      updateCar.mutate({ id: carId, ...values });
    } else {
      createCar.mutate(values);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pricePerDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price / day ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CAR_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License plate</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transmission</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seats</FormLabel>
                <FormControl>
                  <NumberField.Root
                    min={1}
                    max={15}
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? 1)}
                  >
                    <NumberField.Group className="flex items-center gap-1">
                      <NumberField.Decrement className="flex size-9 items-center justify-center rounded-md border hover:bg-accent">
                        <Minus className="size-4" />
                      </NumberField.Decrement>
                      <NumberField.Input className="h-9 w-14 rounded-md border text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                      <NumberField.Increment className="flex size-9 items-center justify-center rounded-md border hover:bg-accent">
                        <Plus className="size-4" />
                      </NumberField.Increment>
                    </NumberField.Group>
                  </NumberField.Root>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo</FormLabel>
              <FormControl>
                <ImageUpload value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : carId ? "Save changes" : "Create car"}
        </Button>
      </form>
    </Form>
  );
}
