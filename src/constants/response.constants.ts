import { ATTENDANCE, OFFICE, ROLE, USER } from "./collection.constants";
import { DATA_CREATED, DATA_DELETED, DATA_FETCHED, DATA_UPDATED, NEW_ } from "./common.constants";



export const {
    //auth
    DEFAULT_ADMIN_CREATED = "Default admin user created successfully with ID: ",
    OTP_SENT_FOR_EMAIL_VERIFICATION = "OTP has been sent successfully for email verification.",
    SUCCESS_LOGIN = "Logged in successfully.",
    TOKEN_REFRESHED = "Token has been refreshed successfully.",
    SUCCESS_LOGOUT = "Logged out successfully.",
    PASSWORD_UPDATED = "Password has been updated successfully.",
    EMAIL_VERIFICATION_REQUIRED = "Email verification is needed.",

    //Custom roles handling 
    ROLE_CREATED = NEW_ + ROLE + DATA_CREATED,
    ROLE_DATA_FETCHED = ROLE + DATA_FETCHED,
    ROLE_UPDATED = ROLE + DATA_UPDATED,
    ROLE_DELETED = ROLE + DATA_DELETED,

    // User Handling
    USER_CREATED = NEW_ + USER + DATA_CREATED,
    USER_DATA_FETCHED = USER + DATA_FETCHED,
    USER_UPDATED = USER + DATA_UPDATED,
    USER_DELETED = USER + DATA_DELETED,
    PROFILE_UPDATED = 'Your profile has been updated',

    //office handling
    OFFICE_CREATED = NEW_ + OFFICE + DATA_CREATED,
    OFFICE_DATA_FETCHED = OFFICE + DATA_FETCHED,
    OFFICE_UPDATED = OFFICE + DATA_UPDATED,
    OFFICE_DELETED = OFFICE + DATA_DELETED,
    USER_ASSIGNED_TO_OFFICE = "The given user has been successfully assigned to the office.",
    USER_REMOVED_FROM_OFFICE = "User has been successfully removed from the office.",
    OFFICE_TRASH_DATA_FETCHED = "Office trash data has been fetched successfully.",
    OFFICE_DATA_DELETED_FROM_TRASH = "Office data has been deleted successfully from the trash.",

    // Attendnace handling
    ATTENDANCE_PUNCHED_IN = "Attendance punch-in was successful.",
    ATTENDANCE_PUNCHED_OUT = "Attendance punch-out was successful.",
    ATTENDANCE_CREATED = NEW_ + ATTENDANCE + DATA_CREATED,
    ATTENDANCE_DATA_FETCHED = ATTENDANCE + DATA_FETCHED,
    ATTENDANCE_UPDATED = ATTENDANCE + DATA_UPDATED,
    ATTENDANCE_DELETED = ATTENDANCE + DATA_DELETED,
    ATTENDANCE_SUMMARY_FETCHED = "Attendance summary for the user has been fetched successfully."
} = {} as const;