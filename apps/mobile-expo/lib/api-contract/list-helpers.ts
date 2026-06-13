import { PAGE_SIZE, paginateArray } from '@/lib/pagination';
import type { Invoice, InvoicesByLocation, ServiceLocation, TaxNote } from './types';

export interface PaginatedGroupsResult<TGroup> {
  groups: TGroup[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

function sortInvoicesDesc(invoices: Invoice[]): Invoice[] {
  return [...invoices].sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth));
}

function sortTaxNotesDesc(notes: TaxNote[]): TaxNote[] {
  return [...notes].sort((a, b) => b.competence.localeCompare(a.competence));
}

export function paginateInvoiceGroups(
  groups: InvoicesByLocation[],
  page: number,
  pageSize = PAGE_SIZE,
): PaginatedGroupsResult<InvoicesByLocation> {
  const flat = groups.flatMap((group) =>
    group.invoices.map((invoice) => ({ group, invoice })),
  );

  flat.sort((a, b) => b.invoice.referenceMonth.localeCompare(a.invoice.referenceMonth));

  const totalItems = flat.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageSlice = paginateArray(flat, safePage, pageSize);

  const order: string[] = [];
  const byLocation = new Map<string, InvoicesByLocation>();

  for (const { group, invoice } of pageSlice) {
    if (!byLocation.has(group.location.id)) {
      byLocation.set(group.location.id, {
        location: group.location,
        invoices: [],
        openTotal: 0,
      });
      order.push(group.location.id);
    }
    const entry = byLocation.get(group.location.id)!;
    entry.invoices.push(invoice);
    if (invoice.status === 'open' || invoice.status === 'overdue') {
      entry.openTotal += invoice.amount;
    }
  }

  return {
    groups: order.map((id) => {
      const entry = byLocation.get(id)!;
      return { ...entry, invoices: sortInvoicesDesc(entry.invoices) };
    }),
    totalItems,
    totalPages,
    page: safePage,
    pageSize,
  };
}

export interface TaxNotesGroup {
  location: ServiceLocation;
  notes: TaxNote[];
}

export function paginateTaxNoteGroups(
  groups: TaxNotesGroup[],
  page: number,
  pageSize = PAGE_SIZE,
): PaginatedGroupsResult<TaxNotesGroup> {
  const flat = groups.flatMap((group) =>
    group.notes.map((note) => ({ group, note })),
  );

  flat.sort((a, b) => b.note.competence.localeCompare(a.note.competence));

  const totalItems = flat.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageSlice = paginateArray(flat, safePage, pageSize);

  const order: string[] = [];
  const byLocation = new Map<string, TaxNotesGroup>();

  for (const { group, note } of pageSlice) {
    if (!byLocation.has(group.location.id)) {
      byLocation.set(group.location.id, { location: group.location, notes: [] });
      order.push(group.location.id);
    }
    byLocation.get(group.location.id)!.notes.push(note);
  }

  return {
    groups: order.map((id) => {
      const entry = byLocation.get(id)!;
      return { ...entry, notes: sortTaxNotesDesc(entry.notes) };
    }),
    totalItems,
    totalPages,
    page: safePage,
    pageSize,
  };
}
