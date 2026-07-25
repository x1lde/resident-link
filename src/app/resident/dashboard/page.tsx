import { getCurrentProfile } from "@/lib/auth";

export default async function ResidentDashboard() {
    const profile = await getCurrentProfile();
    return <h1 className="p-8 text-2x1">Welcome{profile ? `, ${profile.full_name}` : ""}</h1>
}