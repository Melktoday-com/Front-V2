import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useRequestOtp() {
    return useMutation({
        mutationFn: authService.requestOtp,
    });
}

export function useVerifyOtp() {
    const router = useRouter();

    return useMutation({
        mutationFn: authService.verifyOtp,
        onSuccess: (data) => {
            // Store tokens in cookies
            setCookie("access_token", data.accessToken, { maxAge: data.expiresIn });
            setCookie("refresh_token", data.refreshToken, { maxAge: 30 * 24 * 60 * 60 }); // 30 days

            // Redirect to home or profile
            router.push("/");
        },
    });
}

export function useLogout() {
    const router = useRouter();

    const logout = () => {
        deleteCookie("access_token");
        deleteCookie("refresh_token");
        router.push("/auth");
    };

    return { logout };
}

export function useAuth() {
    const [user, setUser] = useState<{ userId: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = getCookie("access_token");
        if (token && typeof token === "string") {
            try {
                const decoded = jwtDecode<{ sub: string }>(token);
                setUser({ userId: decoded.sub });
            } catch (e) {
                console.error("Failed to decode token", e);
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setIsLoading(false);
    }, []);

    return {
        user,
        isLoggedIn: !!user,
        isLoading,
    };
}

