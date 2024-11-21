// types/FilterSortTypes.ts

export type SortOrder = "asc" | "desc";

export interface CommonFields {}

export type FilterFields = Partial<Record<keyof CommonFields, string>>;
export type SortFields = Partial<Record<keyof CommonFields, SortOrder>>;


export interface PaginationQuery<F = {}, S = {}> {
    pageNumber: number;
    pageSize: number;
    query?: string;
    sortField?: keyof S;
    sortOrder?: SortOrder;
    search?: string;
    filters?: F;
    sort?: S;
    filterField?: string;
    filterValue?: string;
    downloadOption?: {
        downloadType: string; // XLSX | CSV | PDF
        totalItems?: number | string; // if list
    }
  }
  


export interface PaginationQuery1 {
    pageNumber: number;
    pageSize: number;
    query?: string;
    filters?: Record<string, any>;
    sort?: Record<string, 1 | -1 | 'asc' | 'desc'>;
    filterField?: string;
    filterValue?: string;
    sortField?: string;
    sortOrder?: 1 | -1;
}

export interface PaginationResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export const handlePagination = (pagination:any) => {
    let tempPagination = pagination;
    if(pagination.pageNumber) {
        tempPagination['pageNumber'] = +pagination.pageNumber
    }
    if(pagination.pageSize) {
        tempPagination['pageSize'] = +pagination.pageSize
    }
  return tempPagination
}