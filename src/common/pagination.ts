export interface IPagination {
  pagination?: {
    currentPage?: number;
    totalItems?: number;
    totalPages?: number;
  };
}

export function getPaginated(options: any): IPagination & { data: [any] } {
  const { data, count, skip, limit, all } = options;

  return {
    pagination: {
      totalPages: all !== 'true' ? Math.ceil(count / limit) : 1,
      currentPage:
        all !== 'true' ? Math.ceil(Math.min(skip, count) / limit) + 1 : 1,
      totalItems: count,
    },
    data,
  };
}
