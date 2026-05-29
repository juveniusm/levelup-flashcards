import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function GET(req: Request) {
    // Optional shared-secret gate: if CRON_SECRET is configured, require it so only the trusted
    // pinger can call this. Left open when unset so an existing external pinger keeps working.
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ status: 'error' }, { status: 401 });
    }

    // Rate limit to cap DoS amplification — each call performs a real DB round-trip.
    const ip = req.headers.get('x-real-ip')
        || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || '127.0.0.1';
    if (limiter.check(60, `keep-alive:${ip}`)) {
        return NextResponse.json({ status: 'error' }, { status: 429 });
    }

    try {
        // Microscopic database query to keep the connection pool warm
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json(
            { status: 'alive' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Keep-alive ping failed:', error);

        // Return 500 if database query fails, but don't crash
        return NextResponse.json(
            {
                status: 'error',
                message: 'Database connection failed'
            },
            { status: 500 }
        );
    }
}
