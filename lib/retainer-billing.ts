import {
  Prisma,
  RetainerBillingStatus,
  TransactionType,
} from "@prisma/client";

function calculateStatus(expectedAmount: number, receivedAmount: number) {
  if (receivedAmount <= 0) {
    return RetainerBillingStatus.PENDING;
  }

  if (receivedAmount < expectedAmount) {
    return RetainerBillingStatus.PARTIALLY_PAID;
  }

  return RetainerBillingStatus.PAID;
}

export async function recalculateRetainerBilling(
  tx: Prisma.TransactionClient,
  retainerBillingId: string,
) {
  const billing = await tx.retainerBilling.findUnique({
    where: {
      id: retainerBillingId,
    },
    select: {
      id: true,
      expectedAmount: true,
      status: true,
    },
  });

  if (!billing) {
    return null;
  }

  const totals = await tx.transaction.aggregate({
    where: {
      retainerBillingId,
      type: TransactionType.INCOME,
    },
    _sum: {
      amount: true,
    },
    _max: {
      date: true,
    },
  });

  const expectedAmount = Number(billing.expectedAmount);
  const receivedAmount = Number(totals._sum.amount ?? 0);
  const pendingAmount = Math.max(expectedAmount - receivedAmount, 0);
  const nextStatus =
    billing.status === RetainerBillingStatus.WAIVED
      ? RetainerBillingStatus.WAIVED
      : calculateStatus(expectedAmount, receivedAmount);

  return tx.retainerBilling.update({
    where: {
      id: retainerBillingId,
    },
    data: {
      receivedAmount,
      pendingAmount,
      status: nextStatus,
      paidDate:
        nextStatus === RetainerBillingStatus.PAID ? totals._max.date : null,
    },
  });
}
