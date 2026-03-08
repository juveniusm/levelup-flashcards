import { Resend } from 'resend';

/**
 * Sends a verification email to a newly registered user.
 * 
 * @param email The user's email address
 * @param token The verification token generated for the user
 * @param baseUrl The base URL of the application, used to construct the verification link
 */
export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. Skipping verification email send.");
        return { success: false, error: "Missing API Key" };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const confirmLink = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'LevelUp Flashcards <noreply@levelupflash.com>', // Matches the verified domain
            to: email,
            subject: 'Welcome to LevelUp Flashcards - Please verify your email',
            html: `
                <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 100%; background-color: #F9FAFB; padding: 40px 20px; text-align: center;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden;">
                        <tr>
                            <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                <img src="https://levelupflash.com/logo5.png" alt="LevelUp Flashcards" style="width: 200px; height: auto; margin-bottom: 24px;" onerror="this.style.display='none';">
                                <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px 0;">Welcome to LevelUp Flashcards!</h1>
                                <p style="font-size: 16px; color: #4B5563; line-height: 1.6; margin: 0;">
                                    Thank you for registering. You're just one step away from mastering any subject faster than ever. Please confirm your email address to get started.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 40px 30px 40px; text-align: center;">
                                <a href="${confirmLink}" style="background-color: #f9c111; color: #111827; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(249, 193, 17, 0.2);">
                                    Verify Email Address
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 40px 40px 40px; text-align: center;">
                                <p style="font-size: 13px; color: #9CA3AF; line-height: 1.5; margin: 0;">
                                    This link will expire in 24 hours.<br>If you did not request this, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                    <div style="max-width: 500px; margin: 24px auto 0 auto; text-align: center;">
                        <p style="font-size: 12px; color: #9CA3AF; line-height: 1.5; margin: 0 0 8px 0;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${confirmLink}" style="color: #6B7280; text-decoration: underline; word-break: break-all;">${confirmLink}</a>
                        </p>
                        <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
                            &copy; ${new Date().getFullYear()} LevelUp Flashcards. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Error sending verification email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return { success: false, error };
    }
}
