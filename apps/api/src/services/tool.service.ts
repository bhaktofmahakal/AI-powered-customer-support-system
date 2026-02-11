import { AppError } from '../middleware/error.middleware';
import prisma from '../lib/db';

export class ToolService {

  static async queryConversationHistory(conversationId: string, userId: string, limit: number = 10) {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          conversation: { userId }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return messages.reverse().map((msg) => ({
        role: msg.role,
        content: msg.content,
        agentType: msg.agentType,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      console.error('[ToolService] queryConversationHistory error:', error);
      return [];
    }
  }

  static async verifyTransactionOwnership(transactionId: string, userId: string): Promise<boolean> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { transactionId },
        select: { userId: true },
      });
      return payment?.userId === userId;
    } catch {
      return false;
    }
  }


  static async searchFAQ(query: string, userId?: string) {
    try {
      const lowerQuery = query.toLowerCase();

      const faqs = await prisma.fAQArticle.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [lowerQuery] } },
          ],
        },
        take: 3,
      });

      if (faqs.length === 0) {
        return {
          found: false,
          message: 'No FAQ articles found matching your query.',
        };
      }

      return {
        found: true,
        articles: faqs.map((faq) => ({
          title: faq.title,
          content: faq.content,
          tags: faq.tags,
        })),
      };
    } catch (error) {
      console.error('[ToolService] searchFAQ error:', error);
      return {
        found: false,
        message: 'Error searching FAQ database.',
      };
    }
  }


  static async getOrderDetails(orderNumber: string, userId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          userId,
        },
        include: {
          payments: true,
          invoices: true,
        },
      });

      if (!order) {
        return {
          found: false,
          message: `Order ${orderNumber} not found or does not belong to you.`,
        };
      }

      return {
        found: true,
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          items: order.items,
          trackingNumber: order.trackingNumber,
          estimatedDelivery: order.estimatedDelivery,
          createdAt: order.createdAt,
        },
      };
    } catch (error) {
      console.error('[ToolService] getOrderDetails error:', error);
      return {
        found: false,
        message: `Error retrieving order ${orderNumber}.`,
      };
    }
  }

  static async checkDeliveryStatus(orderNumber: string, userId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          userId,
        },
      });

      if (!order) {
        return {
          found: false,
          message: `Order ${orderNumber} not found.`,
        };
      }

      return {
        found: true,
        status: order.status,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        message: `Your order is currently ${order.status}.${order.trackingNumber
          ? ` Tracking number: ${order.trackingNumber}.`
          : ''
          }${order.estimatedDelivery
            ? ` Estimated delivery: ${order.estimatedDelivery.toLocaleDateString()}.`
            : ''
          }`,
      };
    } catch (error) {
      console.error('[ToolService] checkDeliveryStatus error:', error);
      return {
        found: false,
        message: `Error checking delivery status for ${orderNumber}.`,
      };
    }
  }

  static async cancelOrder(orderNumber: string, userId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          userId,
        },
      });

      if (!order) {
        return {
          success: false,
          message: `Order ${orderNumber} not found.`,
        };
      }

      if (order.status === 'cancelled') {
        return {
          success: false,
          message: 'This order is already cancelled.',
        };
      }

      if (order.status === 'delivered') {
        return {
          success: false,
          message: 'Cannot cancel a delivered order. Please request a return instead.',
        };
      }

      if (order.status === 'shipped') {
        return {
          success: false,
          message:
            'Order has already shipped. Cancellation is no longer possible. Contact support for assistance.',
        };
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'cancelled' },
      });

      return {
        success: true,
        message: `Order ${orderNumber} has been successfully cancelled. Refund will be processed within 5-7 business days.`,
      };
    } catch (error) {
      console.error('[ToolService] cancelOrder error:', error);
      return {
        success: false,
        message: `Error cancelling order ${orderNumber}.`,
      };
    }
  }


  static async getInvoiceDetails(invoiceNumber: string, userId: string) {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber,
          userId,
        },
        include: {
          order: true,
        },
      });

      if (!invoice) {
        return {
          found: false,
          message: `Invoice ${invoiceNumber} not found.`,
        };
      }

      return {
        found: true,
        invoice: {
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          status: invoice.status,
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
          pdfUrl: invoice.pdfUrl,
          orderNumber: invoice.order?.orderNumber,
        },
      };
    } catch (error) {
      console.error('[ToolService] getInvoiceDetails error:', error);
      return {
        found: false,
        message: `Error retrieving invoice ${invoiceNumber}.`,
      };
    }
  }

  static async checkRefundStatus(transactionId: string, userId: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          transactionId,
          userId,
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        return {
          found: false,
          message: `Transaction ${transactionId} not found.`,
        };
      }

      return {
        found: true,
        transaction: {
          transactionId: payment.transactionId,
          amount: payment.amount,
          status: payment.status,
          refundStatus: payment.refundStatus,
          orderNumber: payment.order?.orderNumber,
          message:
            payment.status === 'refunded'
              ? `Your refund of $${payment.amount} has been processed. Status: ${payment.refundStatus}`
              : payment.refundStatus
                ? `Refund in progress. Status: ${payment.refundStatus}`
                : 'No refund has been initiated for this transaction.',
        },
      };
    } catch (error) {
      console.error('[ToolService] checkRefundStatus error:', error);
      return {
        found: false,
        message: `Error checking refund status for ${transactionId}.`,
      };
    }
  }

  static async getPaymentHistory(userId: string, limit: number = 10) {
    try {
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
      });

      return {
        found: payments.length > 0,
        payments: payments.map((p) => ({
          transactionId: p.transactionId,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          refundStatus: p.refundStatus,
          method: p.method,
          orderNumber: p.order?.orderNumber,
          createdAt: p.createdAt,
        })),
      };
    } catch (error) {
      console.error('[ToolService] getPaymentHistory error:', error);
      return {
        found: false,
        payments: [],
      };
    }
  }
}
