// types/FilterSortTypes.ts

export type SortOrder = "asc" | "desc";

export interface CommonFields { }

export type FilterFields = Partial<Record<keyof CommonFields, string>>;
export type SortFields = Partial<Record<keyof CommonFields, SortOrder>>;

// Only for swagger docs
export interface PaginationQueryForSwagger {
    pageNumber: number;
    pageSize: number;
    query?: string;
    search?: string;
    sortField?: string;
    sortOrder?: string;
    filterField?: string;
    filterValue?: string;
    isDownload?: boolean;
    downloadType?: string; // XLSX | CSV | PDF
    downloadTotalItems?: number | string; // if list
}


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
    isDownload?: boolean;
    downloadType?: string; // XLSX | CSV | PDF
    downloadTotalItems?: number | string; // if list
    [x: string]: any;
    // downloadOption?: {
    //     downloadType: string; // XLSX | CSV | PDF
    //     totalItems?: number | string; // if list
    // }
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

export const handlePagination = (pagination: any, includeFields?: any): PaginationQuery => {
    let tempPagination = pagination;

    tempPagination = {
        ...includeFields,
        ...tempPagination
    }

    if (pagination.pageNumber) {
        tempPagination['pageNumber'] = +pagination.pageNumber
    }
    if (pagination.pageSize) {
        tempPagination['pageSize'] = +pagination.pageSize
    }

    if(tempPagination.downloadTotalItems){
        tempPagination['downloadTotalItems'] = +pagination.downloadTotalItems;
    }

    return tempPagination
}