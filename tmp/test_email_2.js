require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Resend } = require('resend');

async function main() {
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log("Using API Key:", process.env.RESEND_API_KEY ? "Set" : "Not Set");

    try {
        const response = await resend.emails.send({
            from: 'LevelUp <noreply@levelupflash.com>',
            to: 'gaminginsurgence@gmail.com',
            subject: 'Test Email from Updated Script',
            html: '<p>If you see this, Resend is working with the apex domain.</p>'
        });

        console.log("Resend Response:", response);
    } catch (e) {
        console.error("Resend Error:", e);
    }
}

main();
