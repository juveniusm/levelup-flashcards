import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password, role, firstName, lastName, username, university } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: "Missing email or password." },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username: username || undefined }
                ]
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
            }
            if (existingUser.username && existingUser.username === username) {
                return NextResponse.json({ message: "Username is already taken." }, { status: 409 });
            }
        }

        // Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // Assign requested role if provided, default to STUDENT
        // (In production, an ADMIN role shouldn't be assignable by anyone visiting /register)
        const assignedRole = role === "ADMIN" ? "ADMIN" : "STUDENT";

        // Create the user in the database
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: `${firstName} ${lastName}`.trim() || email.split("@")[0], // Keep basic nextAuth structure
                firstName,
                lastName,
                username,
                university,
                role: assignedRole,
            },
        });

        return NextResponse.json(
            { message: "User registered successfully.", user: { id: newUser.id, email: newUser.email, role: newUser.role } },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "An error occurred during registration." },
            { status: 500 }
        );
    }
}
