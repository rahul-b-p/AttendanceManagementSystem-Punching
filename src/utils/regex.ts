export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const secretKeyRegex = /^(?=.*[A-Za-z])(?=.*\d).*$/;
export const otpRegex = /^\d{6}$/;
export const pageNumberRegex = /^\d+$/;
export const objectIdRegex = /^[a-fA-F0-9]{24}$/;