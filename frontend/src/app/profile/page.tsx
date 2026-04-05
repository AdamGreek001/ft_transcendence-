import { redirect } from "next/navigation";

export default function ProfilePage() {
    // Redirect to a default profile or show current user
    // For now, redirect to a placeholder username
    redirect("/profile/me");
}
