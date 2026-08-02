import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { TRPCError } from "@trpc/server";
import { getServerCaller } from "@/trpc/server";
import { InvoiceDocument } from "@/components/payments/invoice-document";

export const runtime = "nodejs";

const HTTP_STATUS_BY_CODE: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  CONFLICT: 409,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;

  try {
    const caller = await getServerCaller();
    const booking = await caller.bookings.getById({ id: bookingId });
    const payment = await caller.payments.getByBooking({ bookingId });

    if (!payment) {
      return NextResponse.json(
        { error: "No payment exists for this booking yet." },
        { status: 404 },
      );
    }

    const days =
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
        (1000 * 60 * 60 * 24) +
      1;
    const pricePerDay = (Number(booking.totalPrice) / days).toFixed(2);
    const documentLabel = payment.status === "paid" ? "Receipt" : "Invoice";

    const buffer = await renderToBuffer(
      <InvoiceDocument
        documentLabel={documentLabel}
        invoiceNumber={`INV-${booking.id.slice(0, 8).toUpperCase()}`}
        issuedAt={payment.createdAt}
        customerName={booking.user.name}
        customerEmail={booking.user.email}
        car={{ make: booking.car.make, model: booking.car.model, year: booking.car.year }}
        startDate={booking.startDate}
        endDate={booking.endDate}
        days={days}
        pricePerDay={pricePerDay}
        totalPrice={booking.totalPrice}
        paymentStatus={payment.status}
        paymentMethod={payment.method}
        transactionRef={payment.transactionRef}
        paidAt={payment.paidAt}
      />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${documentLabel.toLowerCase()}-${booking.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof TRPCError) {
      const status = HTTP_STATUS_BY_CODE[err.code] ?? 500;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }
}
