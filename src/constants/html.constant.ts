


export const getUserUpdationNotificationHTML = (username: string, previousEmail: string, Updatedemail: string) => {
    return `
<b>Hi ${username},</b>

<p>Your email has been changed from <strong>${previousEmail}</strong> to <strong>${Updatedemail}</strong>!</p>
<p>Please verify your account by following the link below:</p>
<a href="[Verification Link]">Verify Email</a>

<p>Once you’ve completed the verification, you’ll have full access to the system. If you need any assistance, don’t hesitate to contact our support team.</p>

<p>We’re excited to have you with us. Welcome aboard!</p>

<p>Best regards,</p>
<p><b>[Your Company Name]</b></p>
<p><b>[Support Contact Information]</b></p>
    `
}


export const getUserCreationNotificationHTML = (username: string, role: string, email: string, phone: string) => {
    return `
<b>Hi ${username},</b>

<p>Welcome to [Your Company Name]!</p>

<p>Your ${role} account has been successfully created in our Attendance Management System. Here are your account details:</p>
<ul>
    <li>Email: ${email}</li>
    <li>Phone: ${phone}</li>
</ul>

<p>To activate your account, please verify your email and set your password using the link below:</p>
<a href="[Activation Link]">Activate Account</a>

<p>Once you’ve completed the verification, you’ll have full access to the system. If you need any assistance, don’t hesitate to contact our support team.</p>

<p>We’re excited to have you with us. Welcome aboard!</p>

<p>Best regards,</p>
<p><b>[Your Company Name]</b></p>
<p><b>[Support Contact Information]</b></p>

    `
}


export const getOtpMessageHTML = (otp: string) => {
    return `
<p>Your OTP (One-Time Password) is: <strong>${otp}</strong>.</p>
<p>This OTP will expire in <strong>5 minutes</strong>.</p>

    `
}