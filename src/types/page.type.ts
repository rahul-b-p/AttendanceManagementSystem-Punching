export type PageInfo = {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}

export type PageNationFeilds = {
    nextPage: string | null,
    prevPage: string | null,
    firstPage: string | null,
    lastPage: string | null,
}