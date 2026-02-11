import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const user1 = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      id: 'demo-user-id',
      email: 'demo@example.com',
      name: 'Alice Johnson',
      image: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      image: 'https://i.pravatar.cc/150?img=12',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: {
      email: 'carol@example.com',
      name: 'Carol Williams',
      image: 'https://i.pravatar.cc/150?img=25',
    },
  });

  console.log(`✅ Created 3 users`);

  const faqs = [
    {
      slug: 'return-policy',
      title: 'What is your return policy?',
      content: 'You can return any item within 30 days of purchase. Items must be in original condition with tags attached. Refunds are processed within 5-7 business days.',
      tags: ['returns', 'policy', 'support'],
    },
    {
      slug: 'shipping-times',
      title: 'How long does shipping take?',
      content: 'Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business day delivery. International orders may take 7-14 days.',
      tags: ['shipping', 'delivery', 'support'],
    },
    {
      slug: 'track-order',
      title: 'How do I track my order?',
      content: 'Once your order ships, you will receive a tracking number via email. You can also view tracking information in your order history.',
      tags: ['tracking', 'orders', 'support'],
    },
    {
      slug: 'cancel-order',
      title: 'Can I cancel my order?',
      content: 'Orders can be cancelled within 1 hour of placement. After that, the order enters processing and cannot be cancelled. Contact support for assistance.',
      tags: ['cancel', 'orders', 'support'],
    },
    {
      slug: 'payment-methods',
      title: 'What payment methods do you accept?',
      content: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay. All transactions are secure and encrypted.',
      tags: ['payment', 'billing', 'support'],
    },
    {
      slug: 'refund-time',
      title: 'How long do refunds take?',
      content: 'Refunds are processed within 5-7 business days after we receive your return. The funds will appear in your account within 3-5 business days depending on your bank.',
      tags: ['refund', 'billing', 'support'],
    },
    {
      slug: 'invoice-download',
      title: 'Where can I download my invoice?',
      content: 'Invoices are available in your account under Order History. Click on any order to view and download the PDF invoice.',
      tags: ['invoice', 'billing', 'support'],
    },
    {
      slug: 'product-warranty',
      title: 'Do your products come with a warranty?',
      content: 'All products come with a 1-year manufacturer warranty. Extended warranties are available for purchase at checkout.',
      tags: ['warranty', 'products', 'support'],
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQArticle.upsert({
      where: { slug: faq.slug },
      update: faq,
      create: faq,
    });
  }

  console.log(`✅ Created ${faqs.length} FAQ articles`);

  const orders = [
    {
      orderNumber: 'ORD-1001',
      userId: user1.id,
      status: 'delivered',
      total: 125.50,
      trackingNumber: 'TRK99283741',
      estimatedDelivery: new Date('2024-02-01'),
      items: [
        { name: 'Wireless Headphones', quantity: 1, price: 99.00 },
        { name: 'USB-C Cable', quantity: 2, price: 13.25 },
      ],
    },
    {
      orderNumber: 'ORD-1002',
      userId: user1.id,
      status: 'shipped',
      total: 54.99,
      trackingNumber: 'TRK11223344',
      estimatedDelivery: new Date('2026-02-15'),
      items: [
        { name: 'Ergonomic Mouse', quantity: 1, price: 54.99 },
      ],
    },
    {
      orderNumber: 'ORD-1003',
      userId: user1.id,
      status: 'pending',
      total: 299.99,
      trackingNumber: null,
      estimatedDelivery: new Date('2026-02-20'),
      items: [
        { name: 'Mechanical Keyboard', quantity: 1, price: 149.99 },
        { name: 'Mouse Pad', quantity: 1, price: 24.99 },
        { name: 'Wrist Rest', quantity: 1, price: 125.01 },
      ],
    },
    {
      orderNumber: 'ORD-1004',
      userId: user1.id,
      status: 'cancelled',
      total: 79.99,
      trackingNumber: null,
      estimatedDelivery: null,
      items: [
        { name: 'Webcam HD', quantity: 1, price: 79.99 },
      ],
    },
    {
      orderNumber: 'ORD-2001',
      userId: user2.id,
      status: 'delivered',
      total: 499.99,
      trackingNumber: 'TRK55667788',
      estimatedDelivery: new Date('2024-01-20'),
      items: [
        { name: 'Gaming Monitor 27"', quantity: 1, price: 499.99 },
      ],
    },
    {
      orderNumber: 'ORD-2002',
      userId: user2.id,
      status: 'shipped',
      total: 189.99,
      trackingNumber: 'TRK99887766',
      estimatedDelivery: new Date('2026-02-14'),
      items: [
        { name: 'Noise Cancelling Headphones', quantity: 1, price: 189.99 },
      ],
    },
    {
      orderNumber: 'ORD-2003',
      userId: user2.id,
      status: 'pending',
      total: 89.99,
      trackingNumber: null,
      estimatedDelivery: new Date('2026-02-18'),
      items: [
        { name: 'USB Hub', quantity: 1, price: 89.99 },
      ],
    },
    {
      orderNumber: 'ORD-2004',
      userId: user2.id,
      status: 'delivered',
      total: 349.99,
      trackingNumber: 'TRK44556677',
      estimatedDelivery: new Date('2024-01-10'),
      items: [
        { name: 'Office Chair', quantity: 1, price: 349.99 },
      ],
    },
    {
      orderNumber: 'ORD-3001',
      userId: user3.id,
      status: 'shipped',
      total: 129.99,
      trackingNumber: 'TRK33445566',
      estimatedDelivery: new Date('2026-02-16'),
      items: [
        { name: 'Standing Desk Converter', quantity: 1, price: 129.99 },
      ],
    },
    {
      orderNumber: 'ORD-3002',
      userId: user3.id,
      status: 'delivered',
      total: 79.99,
      trackingNumber: 'TRK22334455',
      estimatedDelivery: new Date('2024-01-25'),
      items: [
        { name: 'Laptop Stand', quantity: 1, price: 79.99 },
      ],
    },
    {
      orderNumber: 'ORD-3003',
      userId: user3.id,
      status: 'cancelled',
      total: 199.99,
      trackingNumber: null,
      estimatedDelivery: null,
      items: [
        { name: 'External SSD 1TB', quantity: 1, price: 199.99 },
      ],
    },
    {
      orderNumber: 'ORD-3004',
      userId: user3.id,
      status: 'pending',
      total: 449.99,
      trackingNumber: null,
      estimatedDelivery: new Date('2026-02-22'),
      items: [
        { name: 'Ultrawide Monitor', quantity: 1, price: 449.99 },
      ],
    },
  ];

  const createdOrders = [];
  for (const order of orders) {
    const created = await prisma.order.upsert({
      where: { orderNumber: order.orderNumber },
      update: {},
      create: order,
    });
    createdOrders.push(created);
  }

  console.log(`✅ Created ${orders.length} orders`);

  const payments = [
    {
      transactionId: 'TXN_772211',
      userId: user1.id,
      orderId: createdOrders[0].id,
      amount: 125.50,
      status: 'completed',
      refundStatus: null,
      method: 'credit_card',
    },
    {
      transactionId: 'TXN_882233',
      userId: user2.id,
      orderId: createdOrders[4].id,
      amount: 499.99,
      status: 'completed',
      refundStatus: null,
      method: 'credit_card',
    },
    {
      transactionId: 'TXN_993344',
      userId: user2.id,
      orderId: createdOrders[7].id,
      amount: 349.99,
      status: 'completed',
      refundStatus: null,
      method: 'paypal',
    },
    {
      transactionId: 'TXN_114455',
      userId: user3.id,
      orderId: createdOrders[9].id,
      amount: 79.99,
      status: 'completed',
      refundStatus: null,
      method: 'credit_card',
    },
    {
      transactionId: 'TXN_225566',
      userId: user1.id,
      orderId: createdOrders[2].id,
      amount: 299.99,
      status: 'pending',
      refundStatus: null,
      method: 'credit_card',
    },
    {
      transactionId: 'TXN_336677',
      userId: user2.id,
      orderId: createdOrders[6].id,
      amount: 89.99,
      status: 'pending',
      refundStatus: null,
      method: 'stripe',
    },
    {
      transactionId: 'TXN_447788',
      userId: user1.id,
      orderId: createdOrders[3].id,
      amount: 79.99,
      status: 'refunded',
      refundStatus: 'refunded',
      method: 'credit_card',
    },
    {
      transactionId: 'TXN_558899',
      userId: user3.id,
      orderId: createdOrders[10].id,
      amount: 199.99,
      status: 'refunded',
      refundStatus: 'processing',
      method: 'paypal',
    },
  ];

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { transactionId: payment.transactionId },
      update: {},
      create: payment,
    });
  }

  console.log(`✅ Created ${payments.length} payments`);

  const invoices = [
    {
      invoiceNumber: 'INV-2024-001',
      userId: user1.id,
      orderId: createdOrders[0].id,
      amount: 125.50,
      status: 'paid',
      dueDate: new Date('2024-02-01'),
      paidAt: new Date('2024-01-28'),
      pdfUrl: 'https://example.com/invoices/INV-2024-001.pdf',
    },
    {
      invoiceNumber: 'INV-2024-002',
      userId: user2.id,
      orderId: createdOrders[4].id,
      amount: 499.99,
      status: 'paid',
      dueDate: new Date('2024-01-20'),
      paidAt: new Date('2024-01-18'),
      pdfUrl: 'https://example.com/invoices/INV-2024-002.pdf',
    },
    {
      invoiceNumber: 'INV-2026-003',
      userId: user1.id,
      orderId: createdOrders[2].id,
      amount: 299.99,
      status: 'pending',
      dueDate: new Date('2026-02-20'),
      paidAt: null,
      pdfUrl: 'https://example.com/invoices/INV-2026-003.pdf',
    },
    {
      invoiceNumber: 'INV-2026-004',
      userId: user3.id,
      orderId: createdOrders[9].id,
      amount: 79.99,
      status: 'paid',
      dueDate: new Date('2024-01-25'),
      paidAt: new Date('2024-01-24'),
      pdfUrl: 'https://example.com/invoices/INV-2026-004.pdf',
    },
    {
      invoiceNumber: 'INV-2026-005',
      userId: user2.id,
      orderId: createdOrders[6].id,
      amount: 89.99,
      status: 'pending',
      dueDate: new Date('2026-02-18'),
      paidAt: null,
      pdfUrl: 'https://example.com/invoices/INV-2026-005.pdf',
    },
    {
      invoiceNumber: 'INV-2023-006',
      userId: user3.id,
      orderId: createdOrders[11].id,
      amount: 449.99,
      status: 'overdue',
      dueDate: new Date('2023-12-15'),
      paidAt: null,
      pdfUrl: 'https://example.com/invoices/INV-2023-006.pdf',
    },
  ];

  for (const invoice of invoices) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: invoice.invoiceNumber },
      update: {},
      create: invoice,
    });
  }

  console.log(`✅ Created ${invoices.length} invoices`);

  const agents = [
    {
      type: 'support',
      name: 'Support Agent',
      description: 'Handles general support inquiries, FAQs, and troubleshooting',
      tools: [
        {
          name: 'searchFAQ',
          description: 'Search FAQ database for relevant articles',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query' },
            },
            required: ['query'],
          },
        },
        {
          name: 'queryConversationHistory',
          description: 'Retrieve conversation history',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of messages to retrieve' },
            },
          },
        },
      ],
    },
    {
      type: 'order',
      name: 'Order Agent',
      description: 'Handles order status, tracking, modifications, and cancellations',
      tools: [
        {
          name: 'getOrderDetails',
          description: 'Get detailed information about an order',
          parameters: {
            type: 'object',
            properties: {
              orderNumber: { type: 'string', description: 'The order number' },
            },
            required: ['orderNumber'],
          },
        },
        {
          name: 'checkDeliveryStatus',
          description: 'Check delivery status and tracking',
          parameters: {
            type: 'object',
            properties: {
              orderNumber: { type: 'string', description: 'The order number' },
            },
            required: ['orderNumber'],
          },
        },
        {
          name: 'cancelOrder',
          description: 'Cancel a pending order',
          parameters: {
            type: 'object',
            properties: {
              orderNumber: { type: 'string', description: 'The order number' },
            },
            required: ['orderNumber'],
          },
        },
        {
          name: 'queryConversationHistory',
          description: 'Retrieve conversation history',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of messages to retrieve' },
            },
          },
        },
      ],
    },
    {
      type: 'billing',
      name: 'Billing Agent',
      description: 'Handles payment issues, refunds, invoices, and subscription queries',
      tools: [
        {
          name: 'getInvoiceDetails',
          description: 'Get invoice details',
          parameters: {
            type: 'object',
            properties: {
              invoiceNumber: { type: 'string', description: 'The invoice number' },
            },
            required: ['invoiceNumber'],
          },
        },
        {
          name: 'checkRefundStatus',
          description: 'Check refund status for a transaction',
          parameters: {
            type: 'object',
            properties: {
              transactionId: { type: 'string', description: 'The transaction ID' },
            },
            required: ['transactionId'],
          },
        },
        {
          name: 'getPaymentHistory',
          description: 'Get payment history',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of records to retrieve' },
            },
          },
        },
        {
          name: 'queryConversationHistory',
          description: 'Retrieve conversation history',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of messages to retrieve' },
            },
          },
        },
      ],
    },
    {
      type: 'router',
      name: 'Intelligence Router',
      description: 'The central brain that classifies requests and routes them to specialized agents.',
      tools: [
        {
          name: 'classifyIntent',
          description: 'Determine the intent and appropriate agent for a user message',
          parameters: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'The user message to classify' },
            },
            required: ['message'],
          },
        },
      ],
    },
  ];

  for (const agentData of agents) {
    const { tools, ...agent } = agentData;
    const createdAgent = await prisma.agent.upsert({
      where: { type: agent.type },
      update: agent,
      create: agent,
    });

    for (const tool of tools) {
      await prisma.tool.upsert({
        where: {
          agentId_name: {
            agentId: createdAgent.id,
            name: tool.name
          }
        },
        update: { ...tool, agentId: createdAgent.id },
        create: { ...tool, agentId: createdAgent.id },
      });
    }
  }

  console.log(`✅ Created ${agents.length} agents and their tools`);

  const conv1 = await prisma.conversation.create({
    data: {
      userId: user1.id,
      title: 'Order delivery question',
      messages: {
        create: [
          {
            role: 'user',
            content: 'Where is my order ORD-1002? I need it urgently.',
          },
          {
            role: 'assistant',
            content: 'Let me check the status of your order ORD-1002 for you. According to our records, your order containing an Ergonomic Mouse has been shipped with tracking number TRK11223344. It is currently in transit and is estimated to be delivered by February 15, 2026.',
            agentType: 'order',
            toolCalls: JSON.stringify([{ tool: 'getOrderDetails', args: { orderNumber: 'ORD-1002' } }]),
            debugTrace: JSON.stringify({ selectedAgent: 'order', rationale: 'Tracking request', toolsCalled: ['getOrderDetails'] }),
          },
        ],
      },
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      userId: user2.id,
      title: 'Refund inquiry',
      messages: {
        create: [
          {
            role: 'user',
            content: 'I requested a refund for order ORD-2001.',
          },
          {
            role: 'assistant',
            content: 'I see Transaction TXN_882233 is completed with no refund initiated. I can escalate this if you like.',
            agentType: 'billing',
            toolCalls: JSON.stringify([{ tool: 'checkRefundStatus', args: { transactionId: 'TXN_882233' } }]),
            debugTrace: JSON.stringify({ selectedAgent: 'billing', rationale: 'Refund inquiry', toolsCalled: ['checkRefundStatus'] }),
          },
        ],
      },
    },
  });

  console.log(`✅ Created conversations`);
  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
