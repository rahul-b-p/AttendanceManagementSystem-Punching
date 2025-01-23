import { PageInfo, PageNationFeilds } from "../types";



export const pagenate = (pageInfo: PageInfo, url: string): PageNationFeilds => {
    const { page, totalPages } = pageInfo;

    const Pageurl = (pageNo: number) => {
        return url.replace('?pageNo=1', `?pageNo=${pageNo}`)
    }

    const pageNationFeilds: PageNationFeilds = {
        nextPage: null,
        prevPage: null,
        firstPage: null,
        lastPage: null
    };

    if (page > 1) {
        pageNationFeilds.prevPage = Pageurl(page - 1);
        pageNationFeilds.firstPage = Pageurl(1);
    }
    if (page < totalPages) {
        pageNationFeilds.lastPage = Pageurl(totalPages);
        pageNationFeilds.nextPage = Pageurl(page + 1);
    }

    return pageNationFeilds;
}

/**
 * Calculate the number of documents to skip for pagination.
 */
export const calculatePageSkip = (page: number, limit: number): number => {
    return (page - 1) * limit;
};