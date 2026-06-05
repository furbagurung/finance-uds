import { NextResponse } from "next/server";
import {
  ExpenseScope,
  PaymentMethod,
  PayrollStatus,
  Prisma,
  RetainerBillingStatus,
  TransactionType,
} from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { recalculateRetainerBilling } from "@/lib/retainer-billing";

const branchSelect = {
  id: true,
  name: true,
  code: true,
  country: true,
  currency: true,
  calendarSystem: true,
  fiscalYearType: true,
} satisfies Prisma.BranchSelect;

function parseOptionalString(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsedValue = String(value).trim();

  return parsedValue || null;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const selectedType =
      typeParam && typeParam !== "ALL" ? (typeParam as TransactionType) : null;
    const branchIdParam = parseOptionalString(searchParams.get("branchId"));
    const clientIdParam = parseOptionalString(searchParams.get("clientId"));
    const projectIdParam = parseOptionalString(searchParams.get("projectId"));
    const branchId = branchIdParam && branchIdParam !== "ALL" ? branchIdParam : null;
    const clientId = clientIdParam && clientIdParam !== "ALL" ? clientIdParam : null;
    const projectId =
      projectIdParam && projectIdParam !== "ALL" ? projectIdParam : null;
    const searchQuery = (
      searchParams.get("q") ||
      searchParams.get("search") ||
      ""
    ).trim();
    const fromDate =
      searchParams.get("startDate") || searchParams.get("from") || "";
    const toDate = searchParams.get("endDate") || searchParams.get("to") || "";

    const where: Prisma.TransactionWhereInput = {
      ...(selectedType && Object.values(TransactionType).includes(selectedType)
        ? { type: selectedType }
        : {}),
      ...(branchId ? { branchId } : {}),
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(searchQuery
        ? {
            OR: [
              { title: { contains: searchQuery } },
              { doneFor: { contains: searchQuery } },
              { paidBy: { contains: searchQuery } },
              { client: { name: { contains: searchQuery } } },
              { client: { companyName: { contains: searchQuery } } },
              { project: { name: { contains: searchQuery } } },
              { category: { name: { contains: searchQuery } } },
            ],
          }
        : {}),
      ...(fromDate || toDate
        ? {
            date: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate) } : {}),
            },
          }
        : {}),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      include: {
        category: true,
        client: true,
        project: true,
        retainerBilling: {
          include: {
            project: true,
          },
        },
        branch: {
          select: branchSelect,
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
      },
      take: 100,
    });

    return NextResponse.json({
      transactions,
    });
  } catch (error) {
    console.error("Transactions GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch transactions." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const type = String(body.type || "") as TransactionType;
    const title = String(body.title || "").trim();
    const amount = Number(body.amount || 0);
    const date = body.date ? new Date(body.date) : new Date();
    const paymentMethod =
      (body.paymentMethod as PaymentMethod) || PaymentMethod.BANK_TRANSFER;

    const expenseScope = body.expenseScope
      ? (body.expenseScope as ExpenseScope)
      : null;

    const paidBy = body.paidBy ? String(body.paidBy).trim() : null;
    const doneFor = body.doneFor ? String(body.doneFor).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    const categoryId = body.categoryId ? String(body.categoryId) : null;
    const clientId = body.clientId ? String(body.clientId) : null;
    const projectId = body.projectId ? String(body.projectId) : null;
    const retainerBillingId = parseOptionalString(body.retainerBillingId);
    const branchId = parseOptionalString(body.branchId);
    const branchIdTouched = Boolean(body.branchIdTouched);
    const requestedCurrency = parseOptionalString(body.currency)?.toUpperCase();

    const isBillable = Boolean(body.isBillable);
    const isReimbursed = Boolean(body.isReimbursed);
    const attachment = body.attachment;

    const isSalaryExpense = Boolean(body.isSalaryExpense);
    const salaryEmployeeId = body.salaryEmployeeId
      ? String(body.salaryEmployeeId).trim()
      : null;
    const salaryMonth = body.salaryMonth ? Number(body.salaryMonth) : null;
    const salaryYear = body.salaryYear ? Number(body.salaryYear) : null;
    const salaryBasicSalary = body.salaryBasicSalary
      ? Number(body.salaryBasicSalary)
      : amount;
    const salaryBonus = body.salaryBonus ? Number(body.salaryBonus) : 0;
    const salaryDeduction = body.salaryDeduction ? Number(body.salaryDeduction) : 0;

    if (!Object.values(TransactionType).includes(type)) {
      return NextResponse.json(
        { message: "Invalid transaction type." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { message: "Transaction title is required." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Amount must be greater than 0." },
        { status: 400 }
      );
    }

    if (type === TransactionType.EXPENSE && !expenseScope) {
      return NextResponse.json(
        { message: "Expense scope is required for expenses." },
        { status: 400 }
      );
    }

    let retainerBilling: {
      id: string;
      projectId: string;
      clientId: string | null;
      branchId: string | null;
      expectedAmount: Prisma.Decimal;
      receivedAmount: Prisma.Decimal;
      status: RetainerBillingStatus;
    } | null = null;

    if (retainerBillingId) {
      if (type !== TransactionType.INCOME) {
        return NextResponse.json(
          { message: "Only income transactions can be linked to monthly payments." },
          { status: 400 }
        );
      }

      retainerBilling = await prisma.retainerBilling.findUnique({
        where: {
          id: retainerBillingId,
        },
        select: {
          id: true,
          projectId: true,
          clientId: true,
          branchId: true,
          expectedAmount: true,
          receivedAmount: true,
          status: true,
        },
      });

      if (!retainerBilling) {
        return NextResponse.json(
          { message: "Monthly payment not found." },
          { status: 404 }
        );
      }

      if (retainerBilling.status === RetainerBillingStatus.WAIVED) {
        return NextResponse.json(
          { message: "Waived monthly payments cannot receive linked payments." },
          { status: 400 }
        );
      }
    }

    let selectedBranch: { id: string; currency: string } | null = null;

    if (branchId) {
      selectedBranch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          isActive: true,
        },
        select: {
          id: true,
          currency: true,
        },
      });

      if (!selectedBranch) {
        return NextResponse.json(
          { message: "Selected branch was not found or is inactive." },
          { status: 400 }
        );
      }
    }

    let salaryEmployee: {
      id: string;
      fullName: string;
      branchId: string | null;
      branch: { id: string; currency: string; isActive: boolean } | null;
    } | null = null;
    let salaryNetPay: number | null = null;

    if (isSalaryExpense) {
      if (type !== TransactionType.EXPENSE || expenseScope !== ExpenseScope.COMPANY) {
        return NextResponse.json(
          { message: "Salary expense must be a company expense." },
          { status: 400 }
        );
      }

      if (!salaryEmployeeId) {
        return NextResponse.json(
          { message: "Employee is required for salary expense." },
          { status: 400 }
        );
      }

      if (!salaryMonth || salaryMonth < 1 || salaryMonth > 12) {
        return NextResponse.json(
          { message: "Valid salary month is required." },
          { status: 400 }
        );
      }

      if (!salaryYear || salaryYear < 2000) {
        return NextResponse.json(
          { message: "Valid salary year is required." },
          { status: 400 }
        );
      }

      if (
        Number.isNaN(salaryBasicSalary) ||
        salaryBasicSalary < 0 ||
        Number.isNaN(salaryBonus) ||
        salaryBonus < 0 ||
        Number.isNaN(salaryDeduction) ||
        salaryDeduction < 0
      ) {
        return NextResponse.json(
          { message: "Salary amounts must be valid positive numbers." },
          { status: 400 }
        );
      }

      salaryNetPay = salaryBasicSalary + salaryBonus - salaryDeduction;

      if (salaryNetPay !== amount) {
        return NextResponse.json(
          {
            message:
              "Transaction amount must match salary net pay. Basic salary + bonus - deduction should equal transaction amount.",
          },
          { status: 400 }
        );
      }

      salaryEmployee = await prisma.employee.findUnique({
        where: {
          id: salaryEmployeeId,
        },
        select: {
          id: true,
          fullName: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              currency: true,
              isActive: true,
            },
          },
        },
      });

      if (!salaryEmployee) {
        return NextResponse.json(
          { message: "Employee not found for salary expense." },
          { status: 404 }
        );
      }

      const existingPayroll = await prisma.payrollRecord.findFirst({
        where: {
          employeeId: salaryEmployeeId,
          month: salaryMonth,
          year: salaryYear,
        },
        select: {
          id: true,
        },
      });

      if (existingPayroll) {
        return NextResponse.json(
          {
            message:
              "Payroll already exists for this employee, month, and year.",
          },
          { status: 400 }
        );
      }
    }

    if (!selectedBranch && !branchIdTouched) {
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: {
            id: projectId,
          },
          select: {
            branchId: true,
            branch: {
              select: {
                id: true,
                currency: true,
                isActive: true,
              },
            },
          },
        });

        if (project?.branch?.isActive) {
          selectedBranch = {
            id: project.branch.id,
            currency: project.branch.currency,
          };
        }
      }

      if (!selectedBranch && clientId) {
        const client = await prisma.client.findUnique({
          where: {
            id: clientId,
          },
          select: {
            branchId: true,
            branch: {
              select: {
                id: true,
                currency: true,
                isActive: true,
              },
            },
          },
        });

        if (client?.branch?.isActive) {
          selectedBranch = {
            id: client.branch.id,
            currency: client.branch.currency,
          };
        }
      }

      if (!selectedBranch && salaryEmployee?.branch?.isActive) {
        selectedBranch = {
          id: salaryEmployee.branch.id,
          currency: salaryEmployee.branch.currency,
        };
      }
    }

    const resolvedBranchId = selectedBranch?.id ?? null;
    const resolvedCurrency = requestedCurrency ?? selectedBranch?.currency ?? null;

    const transaction = await prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.transaction.create({
        data: {
          type,
          title:
            title ||
            (isSalaryExpense && salaryEmployee
              ? `Salary Payment - ${salaryEmployee.fullName} - ${salaryMonth}/${salaryYear}`
              : doneFor || "Untitled Transaction"),
          amount,
          date,
          paymentMethod,
          expenseScope,
          paidBy,
          doneFor:
            doneFor ||
            (isSalaryExpense && salaryEmployee ? salaryEmployee.fullName : null),
          notes,
          isBillable,
          isReimbursed,
          categoryId,
          clientId,
          projectId,
          retainerBillingId: retainerBilling?.id ?? null,
          branchId: resolvedBranchId,
          currency: resolvedCurrency,
          createdById: user.id,
          attachments: attachment
            ? {
              create: {
                fileName: attachment.fileName,
                fileUrl: attachment.fileUrl,
                fileType: attachment.fileType,
                fileSize: attachment.fileSize,
                attachmentType: "RECEIPT",
              },
            }
            : undefined,
        },
        include: {
          category: true,
          client: true,
          project: true,
          retainerBilling: true,
          branch: {
            select: branchSelect,
          },
          attachments: true,
        },
      });

      if (
        isSalaryExpense &&
        salaryEmployeeId &&
        salaryMonth &&
        salaryYear &&
        salaryNetPay !== null
      ) {
        await tx.payrollRecord.create({
          data: {
            employeeId: salaryEmployeeId,
            month: salaryMonth,
            year: salaryYear,
            basicSalary: salaryBasicSalary,
            bonus: salaryBonus,
            deduction: salaryDeduction,
            netPay: salaryNetPay,
            paymentDate: date,
            paymentMethod,
            status: PayrollStatus.PAID,
            notes:
              notes ||
              `Created from salary expense transaction: ${createdTransaction.title}`,
            branchId: resolvedBranchId,
            currency: resolvedCurrency,
            transactionId: createdTransaction.id,
          },
        });
      }

      if (retainerBilling) {
        await recalculateRetainerBilling(tx, retainerBilling.id);
      }

      return createdTransaction;
    });

    await createActivityLog({
      action: "CREATE",
      entity: "TRANSACTION",
      entityId: transaction.id,
      userId: user.id,
      message: `Created transaction: ${transaction.title}`,
      metadata: {
        type: transaction.type,
        amount: Number(transaction.amount),
        date: transaction.date,
      },
    });

    return NextResponse.json(
      {
        message: "Transaction created successfully.",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transactions POST error:", error);

    return NextResponse.json(
      { message: "Failed to create transaction." },
      { status: 500 }
    );
  }
}
