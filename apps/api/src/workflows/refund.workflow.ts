// import { sleep, FatalError } from "workflow";
import prisma from "../lib/db";
class FatalError extends Error { }

export async function processRefundWorkflow(transactionId: string, amount: number) {
    // "use workflow";

    const transaction = await validateTransaction(transactionId);

    await executeRefund(transaction.id, amount);

    // await sleep("2s");
    await new Promise(resolve => setTimeout(resolve, 2000));

    await sendRefundNotification(transaction.userId, amount);

    return { status: "completed", transactionId };
}

async function validateTransaction(transactionId: string) {
    "use step";
    console.log(`[Workflow] Validating transaction: ${transactionId}`);

    const payment = await prisma.payment.findFirst({
        where: { transactionId }
    });

    if (!payment) {
        throw new FatalError(`Transaction ${transactionId} not found`);
    }

    if (payment.status === 'refunded') {
        throw new FatalError(`Transaction ${transactionId} already refunded`);
    }

    return payment;
}

async function executeRefund(paymentId: string, amount: number) {
    "use step";
    console.log(`[Workflow] Executing refund for payment: ${paymentId}`);

    await prisma.payment.update({
        where: { id: paymentId },
        data: {
            status: 'refunded',
            refundStatus: 'completed'
        }
    });
}

async function sendRefundNotification(userId: string, amount: number) {
    "use step";
    console.log(`[Workflow] Sending refund notification to user: ${userId}`);
}
