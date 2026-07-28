import { getCurrentProfile } from "@/lib/auth";

// Resident dashboard landing page.
export default async function ResidentDashboard() {
    // load the current signed-in resident profile
    const profile = await getCurrentProfile();

    // normalize the resident name for display
    const displayName = profile?.full_name?.trim();

    return (
        <div className="p-8 max-w-4xl mx-auto w-full">
            {/* main welcome heading */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome{displayName ? `, ${displayName}` : ""}!
            </h1>
        </div>
    );
}
