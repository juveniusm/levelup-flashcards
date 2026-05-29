import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
        redirect("/login");
    }

    return <>{children}</>;
}
