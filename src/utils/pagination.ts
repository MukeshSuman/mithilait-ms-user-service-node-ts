export interface PaginationOptions {
    pageNumber: number;
    pageSize: number;
    query?: string;
}

export interface PaginationResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}