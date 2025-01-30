

export const getUserUpdationNotification = (username: string, previousEmail: string, Updatedemail: string) => {
    return `
Hi ${username},

Your email has been changed from ${previousEmail} to ${Updatedemail}!

Please verify your account by following the link below:
[Verification Link]

Once you’ve completed the verification, you’ll have full access to the system. If you need any assistance, don’t hesitate to contact our support team.

We’re excited to have you with us. Welcome aboard!

Best regards,
[Your Company Name]
[Support Contact Information]

    `
}


export const getUserCreationNotification = (username: string, role: string, email: string, phone: string) => {
    return `
Hi ${username},

Welcome to [Your Company Name]!

Your ${role} account has been successfully created in our Attendance Management System. Here are your account details:
- Email: ${email}
- Phone: ${phone}

To activate your account, please verify your email and set your password using the link below:
[Activation Link]

Once you’ve completed the verification, you’ll have full access to the system. If you need any assistance, don’t hesitate to contact our support team.

We’re excited to have you with us. Welcome aboard!

Best regards,
[Your Company Name]
[Support Contact Information]

    `
}

export const getOtpMessage = (otp: string) => {
    return`
Your OTP (One-Time Password) is: ${otp}.
This OTP will expire in 5 minutes.

    `
}