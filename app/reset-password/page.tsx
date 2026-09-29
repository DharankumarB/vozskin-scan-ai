import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() { return <AuthPage mode="reset" />; }
