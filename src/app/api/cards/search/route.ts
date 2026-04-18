import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Card search is an admin-only feature
        const role = (session.user as { role?: string }).role;
        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";
        const cursor = searchParams.get("cursor");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

        // High-performance Search using Prisma Full-Text Search
        // Note: For partial matches (contains), we fallback to startsWith/endsWith logic 
        // if fullTextSearch doesn't yield results for short queries.
        const searchTerms = query.trim().split(/\s+/).join(" & ");
        
        const cards = await prisma.cards.findMany({
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            where: {
                deck: {
                    user_id: session.user.id // Only search user's OWN cards
                },
                OR: query ? [
                    {
                        front: {
                            search: searchTerms,
                        } as any,
                    },
                    {
                        back: {
                            search: searchTerms,
                        } as any,
                    },
                    // Fallback for simple "contains" if needed for partials
                    {
                        front: {
                            contains: query,
                            mode: "insensitive"
                        }
                    },
                    {
                        back: {
                            contains: query,
                            mode: "insensitive"
                        }
                    }
                ] : undefined,
            },
            select: {
                id: true,
                deck_id: true,
                front: true,
                back: true,
                front_image_url: true,
                back_image_url: true,
                card_seq: true,
                deck: {
                    select: {
                        title: true,
                    }
                }
            },
            orderBy: {
                id: "desc", // Stable ordering for cursors
            }
        });

        const nextCursor = cards.length === limit ? cards[cards.length - 1].id : null;

        return NextResponse.json({
            cards,
            nextCursor,
        });
    } catch (error) {
        console.error("Global Search Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
