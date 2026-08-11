import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function useOAuthFlow(
    setIsLoading: (val: boolean) => void,
    setIsLogin: (val: boolean) => void,
    setErrorMsg: (msg: string) => void,
    setSuccessMsg: (msg: string) => void
) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasVerified = useRef(false);

    useEffect(() => {
        // Ensure any lingering admin login intent is cleared when on the student login page
        document.cookie = "admin_login_intent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        if (searchParams) {
            const action = searchParams.get("action");
            const tokenParam = searchParams.get("token");
            const emailParam = searchParams.get("email");

            if (!hasVerified.current && action === "verify" && tokenParam && emailParam) {
                hasVerified.current = true;
                router.replace("/login");

                setTimeout(() => {
                    setIsLoading(true);
                    setSuccessMsg("Verifying your email and logging you in...");
                    setIsLogin(true);
                }, 0);

                signIn("credentials", {
                    redirect: false,
                    email: emailParam,
                    token: tokenParam,
                    isVerifying: "true",
                }).then((result) => {
                    if (result?.error) {
                        setErrorMsg("This verification link has expired or is invalid.");
                        setSuccessMsg("");
                        setIsLoading(false);
                    } else if (result?.ok) {
                        router.push("/study?toast=verified");
                    }
                }).catch(() => {
                    setErrorMsg("An unexpected error occurred during verification.");
                    setSuccessMsg("");
                    setIsLoading(false);
                });

                return;
            }

            if (searchParams.get("verified") === "true") {
                setTimeout(() => {
                    setSuccessMsg("Email successfully verified! You may now sign in.");
                    setIsLogin(true);
                }, 0);
            } else if (searchParams.get("error")) {
                const err = searchParams.get("error");
                setTimeout(() => {
                    if (err === "unverified") {
                        setErrorMsg("Please verify your email address before signing in.");
                    } else if (err === "OAuthAccountNotLinked") {
                        // Google accounts now link to an existing email automatically, so this
                        // only fires when the Google account belongs to a different user.
                        setErrorMsg("That Google account couldn't be linked. Please sign in with your email and password below.");
                    } else if (err === "AccessDenied") {
                        setErrorMsg("Access denied. Only administrators can sign in on the admin page.");
                    } else if (err !== "CredentialsSignin") {
                        setErrorMsg("Authentication error: " + err);
                    }
                }, 0);
            } else if (searchParams.get("signup") === "true") {
                setTimeout(() => {
                    setIsLogin(false);
                }, 0);
            }
        }
    }, [searchParams, router, setIsLoading, setIsLogin, setErrorMsg, setSuccessMsg]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await signIn("google", {
            callbackUrl: "/study",
        });
        setIsLoading(false);
    };

    return { handleGoogleLogin };
}
