---
# Billing and GST - Indian tax calculations, invoice formats
inclusion: fileMatch
fileMatchPattern: "**/billing/**/*.ts, **/invoice/**/*.ts, **/gst/**/*.ts"
---

# Billing & GST Guide

## Overview

This document covers billing patterns for Hospital-Ops including Indian GST calculations, invoice generation, payment processing, and insurance claims. All implementations comply with Indian GST regulations and healthcare billing standards.

---

## 1. GST Fundamentals

### GST Types

| Type        | Applicability                  | Rate Split |
| ----------- | ------------------------------ | ---------- |
| CGST + SGST | Intra-state (same state)       | 50% each   |
| IGST        | Inter-state (different states) | 100%       |

### Healthcare GST Rates

| Service/Item        | HSN/SAC Code | GST Rate             |
| ------------------- | ------------ | -------------------- |
| Healthcare services | 9993         | Exempt (0%)          |
| Medicines (branded) | 3004         | 12%                  |
| Medicines (generic) | 3004         | 5%                   |
| Medical equipment   | 9018         | 12%                  |
| Diagnostic services | 9993         | Exempt               |
| Room charges        | 9963         | 12% (if > ₹5000/day) |
| Cosmetic procedures | 9993         | 18%                  |

---

## 2. GST Calculation Logic

```typescript
// lib/billing/gst-calculator.ts

export interface GSTConfig {
  branchState: string;
  customerState: string;
  isGSTInclusive: boolean;
}
```

export interface GSTBreakdown {
baseAmount: number;
cgst: number;
sgst: number;
igst: number;
totalGST: number;
totalAmount: number;
gstType: 'intra' | 'inter';
}

export interface LineItem {
description: string;
hsnSacCode: string;
quantity: number;
unitPrice: number;
gstRate: number;
discountPercent?: number;
}

export function calculateGST(
lineItems: LineItem[],
config: GSTConfig
): GSTBreakdown {
const isInterState = config.branchState !== config.customerState;

let totalBase = 0;
let totalCGST = 0;
let totalSGST = 0;
let totalIGST = 0;

for (const item of lineItems) {
const lineTotal = item.quantity _ item.unitPrice;
const discount = lineTotal _ (item.discountPercent || 0) / 100;
const discountedAmount = lineTotal - discount;

    let baseAmount: number;
    let gstAmount: number;

    if (config.isGSTInclusive) {
      // Extract GST from inclusive price
      baseAmount = discountedAmount / (1 + item.gstRate / 100);
      gstAmount = discountedAmount - baseAmount;
    } else {
      // Add GST to exclusive price
      baseAmount = discountedAmount;
      gstAmount = baseAmount * item.gstRate / 100;
    }

    totalBase += baseAmount;

    if (isInterState) {
      totalIGST += gstAmount;
    } else {
      totalCGST += gstAmount / 2;
      totalSGST += gstAmount / 2;
    }

}

return {
baseAmount: roundToTwo(totalBase),
cgst: roundToTwo(totalCGST),
sgst: roundToTwo(totalSGST),
igst: roundToTwo(totalIGST),
totalGST: roundToTwo(totalCGST + totalSGST + totalIGST),
totalAmount: roundToTwo(totalBase + totalCGST + totalSGST + totalIGST),
gstType: isInterState ? 'inter' : 'intra',
};
}

function roundToTwo(num: number): number {
return Math.round(num \* 100) / 100;
}

// GST rate lookup by HSN/SAC code
export function getGSTRate(hsnSacCode: string): number {
const gstRates: Record<string, number> = {
// Healthcare services (exempt)
'9993': 0,
'999312': 0, // Medical services
'999313': 0, // Dental services

    // Medicines
    '3004': 12, // Default for medicines
    '30049099': 5, // Generic medicines

    // Medical equipment
    '9018': 12,
    '90189099': 12,

    // Room charges
    '9963': 12, // If > ₹5000/day

    // Cosmetic
    '999319': 18, // Cosmetic procedures

};

return gstRates[hsnSacCode] || 18; // Default 18%
}

````

---

## 3. Invoice Schema

```typescript
// types/billing.ts

export interface Invoice {
  id: string;
  tenantId: string;
  branchId: string;

  // Invoice details
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;

  // Patient/Customer
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAddress?: string;
  patientGSTIN?: string;
  patientState: string;

  // Branch/Seller
  branchName: string;
  branchAddress: string;
  branchGSTIN: string;
  branchState: string;

  // Line items
  items: InvoiceItem[];

  // Amounts
  subtotal: number;
  discountAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  totalAmount: number;
  roundOff: number;
  grandTotal: number;

  // Payment
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paidAmount: number;
  balanceAmount: number;
  payments: Payment[];

  // Insurance
  insuranceClaim?: InsuranceClaim;

  // Metadata
  notes?: string;
  termsAndConditions?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
````

export interface InvoiceItem {
id: string;
description: string;
hsnSacCode: string;
quantity: number;
unit: string;
unitPrice: number;
discountPercent: number;
discountAmount: number;
taxableAmount: number;
gstRate: number;
cgst: number;
sgst: number;
igst: number;
totalAmount: number;

// Reference
referenceType?: 'consultation' | 'procedure' | 'lab_test' | 'medicine' | 'room';
referenceId?: string;
}

export interface Payment {
id: string;
invoiceId: string;
amount: number;
paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'insurance' | 'wallet';
paymentDate: Date;
transactionId?: string;
status: 'pending' | 'completed' | 'failed' | 'refunded';
metadata?: Record<string, unknown>;
}

export interface InsuranceClaim {
id: string;
invoiceId: string;
insuranceCompany: string;
policyNumber: string;
tpaName?: string;
claimNumber?: string;
preAuthNumber?: string;
claimAmount: number;
approvedAmount?: number;
status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'settled';
submittedAt: Date;
settledAt?: Date;
}

````

---

## 4. Invoice Number Generation

```typescript
// lib/billing/invoice-number.ts
import { prisma } from '@/lib/prisma';

export async function generateInvoiceNumber(
  tenantId: string,
  branchId: string,
  type: 'invoice' | 'credit_note' = 'invoice'
): Promise<string> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });

  const prefix = type === 'invoice' ? 'INV' : 'CN';
  const financialYear = getFinancialYear();

  // Get next sequence number
  const sequence = await prisma.$transaction(async (tx) => {
    const counter = await tx.invoiceCounter.upsert({
      where: {
        tenantId_branchId_financialYear_type: {
          tenantId,
          branchId,
          financialYear,
          type,
        },
      },
      update: { lastNumber: { increment: 1 } },
      create: {
        tenantId,
        branchId,
        financialYear,
        type,
        lastNumber: 1,
      },
    });
    return counter.lastNumber;
  });
````

// Format: INV/JAI/2526/000001
const paddedSequence = String(sequence).padStart(6, '0');
return `${prefix}/${branch?.code}/${financialYear}/${paddedSequence}`;
}

function getFinancialYear(): string {
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

// Indian FY: April to March
if (month >= 3) { // April onwards
return `${year % 100}${(year + 1) % 100}`; // e.g., "2526" for 2025-26
} else {
return `${(year - 1) % 100}${year % 100}`; // e.g., "2425" for 2024-25
}
}

````

---

## 5. Billing Service

```typescript
// modules/billing/billing.service.ts
import { prisma } from '@/lib/prisma';
import { calculateGST, GSTConfig } from '@/lib/billing/gst-calculator';
import { generateInvoiceNumber } from '@/lib/billing/invoice-number';
import { AppError } from '@/common/errors';

export class BillingService {
  async createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
    const { tenantId, branchId, patientId, items, createdBy } = data;

    // Get branch and patient details
    const [branch, patient] = await Promise.all([
      prisma.branch.findUnique({ where: { id: branchId } }),
      prisma.patient.findUnique({ where: { id: patientId } }),
    ]);

    if (!branch || !patient) {
      throw AppError.notFound('Branch or Patient');
    }

    // Calculate GST
    const gstConfig: GSTConfig = {
      branchState: branch.state,
      customerState: patient.state || branch.state,
      isGSTInclusive: branch.settings?.gstInclusive || false,
    };

    const gstBreakdown = calculateGST(items, gstConfig);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId, branchId);
````

    // Calculate round-off
    const roundOff = Math.round(gstBreakdown.totalAmount) - gstBreakdown.totalAmount;
    const grandTotal = gstBreakdown.totalAmount + roundOff;

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        branchId,
        patientId,
        invoiceNumber,
        invoiceDate: new Date(),

        // Patient details (snapshot)
        patientName: patient.name,
        patientPhone: patient.phone,
        patientAddress: patient.address,
        patientState: patient.state || branch.state,

        // Branch details (snapshot)
        branchName: branch.name,
        branchAddress: branch.address!,
        branchGSTIN: branch.gstin!,
        branchState: branch.state,

        // Amounts
        subtotal: gstBreakdown.baseAmount,
        discountAmount: 0, // Calculate from items
        cgst: gstBreakdown.cgst,
        sgst: gstBreakdown.sgst,
        igst: gstBreakdown.igst,
        totalGST: gstBreakdown.totalGST,
        totalAmount: gstBreakdown.totalAmount,
        roundOff,
        grandTotal,

        // Status
        paymentStatus: 'pending',
        paidAmount: 0,
        balanceAmount: grandTotal,

        createdBy,

        // Items
        items: {
          create: items.map((item, index) => this.buildInvoiceItem(item, gstConfig, index)),
        },
      },
      include: { items: true },
    });

    // Audit log
    await auditLog({
      tenantId,
      branchId,
      userId: createdBy,
      action: 'create',
      entityType: 'invoice',
      entityId: invoice.id,
      newValues: { invoiceNumber, grandTotal },
    });

    return invoice;

}

private buildInvoiceItem(item: LineItem, config: GSTConfig, index: number) {
const lineTotal = item.quantity _ item.unitPrice;
const discountAmount = lineTotal _ (item.discountPercent || 0) / 100;
const taxableAmount = lineTotal - discountAmount;

    const isInterState = config.branchState !== config.customerState;
    let baseAmount: number;
    let gstAmount: number;

    if (config.isGSTInclusive) {
      baseAmount = taxableAmount / (1 + item.gstRate / 100);
      gstAmount = taxableAmount - baseAmount;
    } else {
      baseAmount = taxableAmount;
      gstAmount = baseAmount * item.gstRate / 100;
    }

    return {
      sortOrder: index,
      description: item.description,
      hsnSacCode: item.hsnSacCode,
      quantity: item.quantity,
      unit: 'nos',
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent || 0,
      discountAmount,
      taxableAmount: baseAmount,
      gstRate: item.gstRate,
      cgst: isInterState ? 0 : gstAmount / 2,
      sgst: isInterState ? 0 : gstAmount / 2,
      igst: isInterState ? gstAmount : 0,
      totalAmount: baseAmount + gstAmount,
    };

}

async recordPayment(data: RecordPaymentDto): Promise<Payment> {
const { invoiceId, amount, paymentMethod, transactionId, userId } = data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw AppError.notFound('Invoice');
    }

    if (amount > invoice.balanceAmount) {
      throw AppError.badRequest('EXCESS_PAYMENT', 'Payment amount exceeds balance');
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          paymentMethod,
          transactionId,
          paymentDate: new Date(),
          status: 'completed',
        },
      });

      // Update invoice
      const newPaidAmount = invoice.paidAmount + amount;
      const newBalance = invoice.grandTotal - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          paymentStatus: newStatus,
        },
      });

      return payment;
    });

    // Audit log
    await auditLog({
      tenantId: invoice.tenantId,
      branchId: invoice.branchId,
      userId,
      action: 'payment_received',
      entityType: 'invoice',
      entityId: invoiceId,
      newValues: { amount, paymentMethod, transactionId },
    });

    return payment;

}
}

````

---

## 6. Credit Note (Refund)

```typescript
// modules/billing/credit-note.service.ts

export class CreditNoteService {
  async createCreditNote(data: CreateCreditNoteDto): Promise<CreditNote> {
    const { invoiceId, items, reason, createdBy } = data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      throw AppError.notFound('Invoice');
    }

    // Validate items exist in original invoice
    for (const item of items) {
      const originalItem = invoice.items.find(i => i.id === item.invoiceItemId);
      if (!originalItem) {
        throw AppError.badRequest('INVALID_ITEM', `Item ${item.invoiceItemId} not in invoice`);
      }
      if (item.quantity > originalItem.quantity) {
        throw AppError.badRequest('EXCESS_QUANTITY', 'Refund quantity exceeds original');
      }
    }

    // Generate credit note number
    const creditNoteNumber = await generateInvoiceNumber(
      invoice.tenantId,
      invoice.branchId,
      'credit_note'
    );

    // Calculate credit amounts (same GST logic as original)
    const gstConfig: GSTConfig = {
      branchState: invoice.branchState,
      customerState: invoice.patientState,
      isGSTInclusive: false, // Credit notes always exclusive
    };
````

    const creditItems = items.map(item => {
      const originalItem = invoice.items.find(i => i.id === item.invoiceItemId)!;
      const ratio = item.quantity / originalItem.quantity;

      return {
        description: originalItem.description,
        hsnSacCode: originalItem.hsnSacCode,
        quantity: item.quantity,
        unitPrice: originalItem.unitPrice,
        gstRate: originalItem.gstRate,
        taxableAmount: originalItem.taxableAmount * ratio,
        cgst: originalItem.cgst * ratio,
        sgst: originalItem.sgst * ratio,
        igst: originalItem.igst * ratio,
        totalAmount: originalItem.totalAmount * ratio,
      };
    });

    const totals = creditItems.reduce(
      (acc, item) => ({
        taxable: acc.taxable + item.taxableAmount,
        cgst: acc.cgst + item.cgst,
        sgst: acc.sgst + item.sgst,
        igst: acc.igst + item.igst,
        total: acc.total + item.totalAmount,
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );

    const creditNote = await prisma.creditNote.create({
      data: {
        tenantId: invoice.tenantId,
        branchId: invoice.branchId,
        invoiceId,
        creditNoteNumber,
        creditNoteDate: new Date(),
        reason,

        // Copy from invoice
        patientId: invoice.patientId,
        patientName: invoice.patientName,
        branchGSTIN: invoice.branchGSTIN,

        // Amounts
        taxableAmount: totals.taxable,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalAmount: totals.total,

        createdBy,

        items: { create: creditItems },
      },
    });

    // Audit log
    await auditLog({
      tenantId: invoice.tenantId,
      action: 'credit_note_created',
      entityType: 'credit_note',
      entityId: creditNote.id,
      newValues: { creditNoteNumber, amount: totals.total, reason },
    });

    return creditNote;

}
}

````

---

## 7. GST Reports

```typescript
// modules/reports/gst-reports.service.ts

export class GSTReportsService {
  // GSTR-1: Outward supplies
  async generateGSTR1(tenantId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        invoiceDate: { gte: startDate, lte: endDate },
        paymentStatus: { not: 'refunded' },
      },
      include: { items: true },
    });
````

    // B2B: Business to Business (with GSTIN)
    const b2b = invoices
      .filter(inv => inv.patientGSTIN)
      .map(inv => ({
        gstin: inv.patientGSTIN,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: formatDate(inv.invoiceDate),
        invoiceValue: inv.grandTotal,
        placeOfSupply: inv.patientState,
        reverseCharge: 'N',
        invoiceType: 'Regular',
        items: inv.items.map(item => ({
          hsnCode: item.hsnSacCode,
          taxableValue: item.taxableAmount,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          rate: item.gstRate,
        })),
      }));

    // B2C Large: > ₹2.5 lakh inter-state
    const b2cLarge = invoices
      .filter(inv => !inv.patientGSTIN && inv.igst > 0 && inv.grandTotal > 250000)
      .map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: formatDate(inv.invoiceDate),
        invoiceValue: inv.grandTotal,
        placeOfSupply: inv.patientState,
        taxableValue: inv.subtotal,
        igst: inv.igst,
      }));

    // B2C Small: All other B2C
    const b2cSmall = invoices
      .filter(inv => !inv.patientGSTIN && !(inv.igst > 0 && inv.grandTotal > 250000))
      .reduce((acc, inv) => {
        const key = `${inv.patientState}_${inv.items[0]?.gstRate || 0}`;
        if (!acc[key]) {
          acc[key] = { placeOfSupply: inv.patientState, rate: inv.items[0]?.gstRate || 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        acc[key].taxableValue += inv.subtotal;
        acc[key].cgst += inv.cgst;
        acc[key].sgst += inv.sgst;
        acc[key].igst += inv.igst;
        return acc;
      }, {} as Record<string, any>);

    // Credit/Debit Notes
    const creditNotes = await prisma.creditNote.findMany({
      where: {
        tenantId,
        creditNoteDate: { gte: startDate, lte: endDate },
      },
    });

    return {
      period: `${month.toString().padStart(2, '0')}${year}`,
      b2b,
      b2cLarge,
      b2cSmall: Object.values(b2cSmall),
      creditNotes: creditNotes.map(cn => ({
        noteNumber: cn.creditNoteNumber,
        noteDate: formatDate(cn.creditNoteDate),
        originalInvoice: cn.invoiceId,
        taxableValue: cn.taxableAmount,
        cgst: cn.cgst,
        sgst: cn.sgst,
        igst: cn.igst,
      })),
    };

}

// GSTR-3B: Summary return
async generateGSTR3B(tenantId: string, month: number, year: number) {
const startDate = new Date(year, month - 1, 1);
const endDate = new Date(year, month, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        invoiceDate: { gte: startDate, lte: endDate },
      },
    });

    const creditNotes = await prisma.creditNote.findMany({
      where: {
        tenantId,
        creditNoteDate: { gte: startDate, lte: endDate },
      },
    });

    // Outward supplies
    const outward = invoices.reduce(
      (acc, inv) => ({
        taxableValue: acc.taxableValue + inv.subtotal,
        igst: acc.igst + inv.igst,
        cgst: acc.cgst + inv.cgst,
        sgst: acc.sgst + inv.sgst,
      }),
      { taxableValue: 0, igst: 0, cgst: 0, sgst: 0 }
    );

    // Credit notes (reduce liability)
    const credits = creditNotes.reduce(
      (acc, cn) => ({
        taxableValue: acc.taxableValue + cn.taxableAmount,
        igst: acc.igst + cn.igst,
        cgst: acc.cgst + cn.cgst,
        sgst: acc.sgst + cn.sgst,
      }),
      { taxableValue: 0, igst: 0, cgst: 0, sgst: 0 }
    );

    return {
      period: `${month.toString().padStart(2, '0')}${year}`,
      outwardSupplies: {
        taxableValue: outward.taxableValue - credits.taxableValue,
        igst: outward.igst - credits.igst,
        cgst: outward.cgst - credits.cgst,
        sgst: outward.sgst - credits.sgst,
      },
      // Input tax credit would come from purchase invoices
      inputTaxCredit: { igst: 0, cgst: 0, sgst: 0 },
      taxPayable: {
        igst: outward.igst - credits.igst,
        cgst: outward.cgst - credits.cgst,
        sgst: outward.sgst - credits.sgst,
      },
    };

}
}

````

---

## 8. Invoice PDF Generation

```typescript
// lib/billing/invoice-pdf.ts
import PDFDocument from 'pdfkit';
import { Invoice } from '@/types/billing';
import { formatCurrency, formatDate } from '@/lib/utils';

export async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
````

    // Header
    doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();

    // Branch details (left)
    doc.fontSize(10);
    doc.text(invoice.branchName, 50, 100);
    doc.text(invoice.branchAddress);
    doc.text(`GSTIN: ${invoice.branchGSTIN}`);
    doc.text(`State: ${invoice.branchState}`);

    // Invoice details (right)
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 350, 100);
    doc.text(`Date: ${formatDate(invoice.invoiceDate)}`);
    doc.text(`Place of Supply: ${invoice.patientState}`);

    // Patient details
    doc.moveDown(2);
    doc.text('Bill To:', 50);
    doc.text(invoice.patientName);
    doc.text(invoice.patientPhone);
    if (invoice.patientAddress) doc.text(invoice.patientAddress);
    if (invoice.patientGSTIN) doc.text(`GSTIN: ${invoice.patientGSTIN}`);

    // Items table
    const tableTop = 250;
    const tableHeaders = ['#', 'Description', 'HSN/SAC', 'Qty', 'Rate', 'Taxable', 'GST%', 'GST', 'Total'];
    const colWidths = [25, 150, 60, 35, 60, 60, 40, 50, 60];

    // Draw header
    let x = 50;
    doc.font('Helvetica-Bold').fontSize(8);
    tableHeaders.forEach((header, i) => {
      doc.text(header, x, tableTop, { width: colWidths[i], align: 'center' });
      x += colWidths[i];
    });

    // Draw items
    doc.font('Helvetica').fontSize(8);
    let y = tableTop + 20;
    invoice.items.forEach((item, index) => {
      x = 50;
      const gst = item.cgst + item.sgst + item.igst;
      const values = [
        String(index + 1),
        item.description,
        item.hsnSacCode,
        String(item.quantity),
        formatCurrency(item.unitPrice),
        formatCurrency(item.taxableAmount),
        `${item.gstRate}%`,
        formatCurrency(gst),
        formatCurrency(item.totalAmount),
      ];
      values.forEach((val, i) => {
        doc.text(val, x, y, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
        x += colWidths[i];
      });
      y += 15;
    });

    // Totals
    y += 20;
    const totalsX = 400;
    doc.text('Subtotal:', totalsX, y);
    doc.text(formatCurrency(invoice.subtotal), totalsX + 80, y, { align: 'right' });
    y += 15;

    if (invoice.cgst > 0) {
      doc.text('CGST:', totalsX, y);
      doc.text(formatCurrency(invoice.cgst), totalsX + 80, y, { align: 'right' });
      y += 15;
      doc.text('SGST:', totalsX, y);
      doc.text(formatCurrency(invoice.sgst), totalsX + 80, y, { align: 'right' });
      y += 15;
    }

    if (invoice.igst > 0) {
      doc.text('IGST:', totalsX, y);
      doc.text(formatCurrency(invoice.igst), totalsX + 80, y, { align: 'right' });
      y += 15;
    }

    if (invoice.roundOff !== 0) {
      doc.text('Round Off:', totalsX, y);
      doc.text(formatCurrency(invoice.roundOff), totalsX + 80, y, { align: 'right' });
      y += 15;
    }

    doc.font('Helvetica-Bold');
    doc.text('Grand Total:', totalsX, y);
    doc.text(formatCurrency(invoice.grandTotal), totalsX + 80, y, { align: 'right' });

    // Amount in words
    y += 30;
    doc.font('Helvetica').fontSize(9);
    doc.text(`Amount in Words: ${numberToWords(invoice.grandTotal)} Rupees Only`, 50, y);

    // Footer
    doc.fontSize(8);
    doc.text('This is a computer generated invoice.', 50, 750, { align: 'center' });

    doc.end();

});
}

````

---

## 9. Day-End Reconciliation

```typescript
// modules/billing/day-end.service.ts

export class DayEndService {
  async generateDayEndReport(branchId: string, date: Date) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Get all payments for the day
    const payments = await prisma.payment.findMany({
      where: {
        invoice: { branchId },
        paymentDate: { gte: startOfDay, lte: endOfDay },
        status: 'completed',
      },
      include: { invoice: true },
    });

    // Group by payment method
    const byMethod = payments.reduce((acc, p) => {
      if (!acc[p.paymentMethod]) {
        acc[p.paymentMethod] = { count: 0, amount: 0 };
      }
      acc[p.paymentMethod].count++;
      acc[p.paymentMethod].amount += p.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
````

    // Get invoices created today
    const invoices = await prisma.invoice.findMany({
      where: {
        branchId,
        invoiceDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    // Get credit notes
    const creditNotes = await prisma.creditNote.findMany({
      where: {
        branchId,
        creditNoteDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    return {
      date: formatDate(date),
      branchId,

      invoices: {
        count: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
      },

      creditNotes: {
        count: creditNotes.length,
        totalAmount: creditNotes.reduce((sum, cn) => sum + cn.totalAmount, 0),
      },

      collections: {
        byMethod,
        total: payments.reduce((sum, p) => sum + p.amount, 0),
      },

      gst: {
        cgst: invoices.reduce((sum, inv) => sum + inv.cgst, 0),
        sgst: invoices.reduce((sum, inv) => sum + inv.sgst, 0),
        igst: invoices.reduce((sum, inv) => sum + inv.igst, 0),
      },

      cashReconciliation: {
        expected: byMethod['cash']?.amount || 0,
        // Actual would be entered by user
      },
    };

}

async closeDayEnd(branchId: string, date: Date, actualCash: number, userId: string) {
const report = await this.generateDayEndReport(branchId, date);
const variance = actualCash - report.cashReconciliation.expected;

    const dayEnd = await prisma.dayEndReport.create({
      data: {
        branchId,
        date,
        invoiceCount: report.invoices.count,
        invoiceTotal: report.invoices.totalAmount,
        creditNoteCount: report.creditNotes.count,
        creditNoteTotal: report.creditNotes.totalAmount,
        collectionTotal: report.collections.total,
        collectionsByMethod: report.collections.byMethod,
        expectedCash: report.cashReconciliation.expected,
        actualCash,
        variance,
        closedBy: userId,
        closedAt: new Date(),
      },
    });

    // Audit log for variance
    if (variance !== 0) {
      await auditLog({
        branchId,
        userId,
        action: 'day_end_variance',
        entityType: 'day_end',
        entityId: dayEnd.id,
        newValues: { expected: report.cashReconciliation.expected, actual: actualCash, variance },
      });
    }

    return dayEnd;

}
}

```

---

## 10. Best Practices

- Always snapshot prices at billing time
- Use transactions for payment recording
- Maintain 7-year audit trail for GST compliance
- Generate credit notes for refunds (never delete invoices)
- Validate GSTIN format before saving
- Round amounts to 2 decimal places
- Use Indian numbering format (lakhs, crores)
```
