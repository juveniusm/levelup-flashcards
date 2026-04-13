import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuthForm() {
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [university, setUniversity] = useState("");
    
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            if (!isLogin) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    setErrorMsg("Please enter a valid email address.");
                    return;
                }

                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password, firstName, lastName, username, university }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setErrorMsg(data.error || "Something went wrong.");
                    return;
                }

                setSuccessMsg(data.message || "Registration successful. Please check your email.");
                setIsLogin(true);
                setPassword("");
                return;
            }

            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                if (result.error === "unverified") {
                    setErrorMsg("Please verify your email address before signing in.");
                } else {
                    setErrorMsg("Invalid credentials. Please try again.");
                }
                return;
            }

            if (result?.ok) {
                router.push("/study");
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrorMsg("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading, setIsLoading,
        isLogin, setIsLogin,
        email, setEmail,
        password, setPassword,
        firstName, setFirstName,
        lastName, setLastName,
        username, setUsername,
        university, setUniversity,
        errorMsg, setErrorMsg,
        successMsg, setSuccessMsg,
        handleCredentialsSubmit
    };
}
