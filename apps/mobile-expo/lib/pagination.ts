export const PAGE_SIZE = 12;

export interface PaginationMeta {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
}

export function getPaginationMeta(
  totalItems: number,
  page: number,
  pageSize = PAGE_SIZE,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    page: safePage,
    totalPages,
    totalItems,
    pageSize,
    startIndex,
    endIndex,
  };
}

export function paginateArray<T>(items: T[], page: number, pageSize = PAGE_SIZE): T[] {
  const { startIndex, endIndex } = getPaginationMeta(items.length, page, pageSize);
  return items.slice(startIndex, endIndex);
}
