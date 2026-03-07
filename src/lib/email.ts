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
            from: 'LevelUp <noreply@send.levelupflash.com>', // Change to your verified domain later
            to: email,
            subject: 'Welcome to LevelUp - Please verify your email',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Welcome to LevelUp!</h1>
                    <p style="font-size: 16px; color: #555;">
                        Thank you for registering. Please confirm your email address by clicking the link below:
                    </p>
                    <div style="margin: 30px 0;">
                        <a href="${confirmLink}" style="background-color: #f9c111; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #888;">
                        This link will expire in 24 hours. If you did not request this, you can safely ignore this email.
                    </p>
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
