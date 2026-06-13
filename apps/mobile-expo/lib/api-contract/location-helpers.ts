import type { Invoice, InvoicesByLocation, ServiceLocation, TaxNote } from './types';

export function groupInvoicesByLocation(
  locations: ServiceLocation[],
  invoices: Invoice[],
  options?: { openOnly?: boolean },
): InvoicesByLocation[] {
  const filtered = options?.openOnly
    ? invoices.filter((inv) => inv.status === 'open' || inv.status === 'overdue')
    : invoices;

  return locations
    .map((location) => {
      const locationInvoices = filtered
        .filter((inv) => inv.locationId === location.id)
        .sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth));

      const openTotal = locationInvoices
        .filter((inv) => inv.status === 'open' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.amount, 0);

      return { location, invoices: locationInvoices, openTotal };
    })
    .filter((group) => (options?.openOnly ? group.invoices.length > 0 : true));
}

export function findLocation(
  locations: ServiceLocation[],
  locationId: string,
): ServiceLocation | undefined {
  return locations.find((loc) => loc.id === locationId);
}

export function findTaxNoteForInvoice(
  invoiceId: string,
  notes: TaxNote[],
): TaxNote | undefined {
  return notes.find((note) => note.invoiceId === invoiceId);
}
