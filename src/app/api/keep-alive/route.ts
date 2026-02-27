import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
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
