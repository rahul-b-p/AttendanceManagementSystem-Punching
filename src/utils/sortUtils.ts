import { AttendanceSortArgs, AttendanceSortKeys, OfficeSortArgs, OfficeSortKeys, UserSortArgs, UserSortKeys } from '../enums';




export const getUserSortArgs = (sortKey?: UserSortKeys): UserSortArgs => {
    const sortMapping: Record<UserSortKeys, UserSortArgs> = {
        [UserSortKeys.username]: UserSortArgs.username,
        [UserSortKeys.createAt]: UserSortArgs.createAt,
    };

    return sortMapping[sortKey as UserSortKeys] || UserSortArgs.createAt;
};


export const getOfficeSortArgs = (sortKey?: OfficeSortKeys): OfficeSortArgs => {
    const sortMapping: Record<OfficeSortKeys, OfficeSortArgs> = {
        [OfficeSortKeys.officeName]: OfficeSortArgs.officeName,
        [OfficeSortKeys.createAt]: OfficeSortArgs.createAt
    };

    return sortMapping[sortKey as OfficeSortKeys] || OfficeSortArgs.createAt;
}



export const getAttendanceSortArgs = (sortKey?: AttendanceSortKeys): AttendanceSortArgs => {
    const sortMapping: Record<AttendanceSortKeys, AttendanceSortArgs> = {
        [AttendanceSortKeys.punchIn]: AttendanceSortArgs.punchIn,
        [AttendanceSortKeys.username]: AttendanceSortArgs.username
    };

    return sortMapping[sortKey as AttendanceSortKeys] || AttendanceSortArgs.punchIn;
}