export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const secretKeyRegex = /^(?=.*[A-Za-z])(?=.*\d).*$/;
export const otpRegex = /^\d{6}$/;
export const pageNumberRegex = /^\d+$/;
export const objectIdRegex = /^[a-fA-F0-9]{24}$/;
export const YYYYMMDDregex = /^2[01]\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const HHMMregex = /^([01]\d|2[0-3]):([0-5]\d)$/;