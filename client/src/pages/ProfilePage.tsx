import { useEffect, useState } from "react";
import api from "../services/api";
import { AppLayout } from "../components/ui/AppLayout";

export const ProfilePage = () => {
    const [form, setForm] = useState({
        skills: "",
        targetCompanies: "",
        bio: "",
        linkedinUrl: "",
        githubUrl: "",
        college: "",
        graduationYear: "2028",
    });

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setPageLoading(true);
                setError("");

                const { data } = await api.get("/profile/me");

                const profile = data.data?.profile || data.profile;

                setForm({
                    skills: profile?.skills?.join(", ") || "",
                    targetCompanies: profile?.targetCompanies?.join(", ") || "",
                    bio: profile?.bio || "",
                    linkedinUrl: profile?.linkedinUrl || "",
                    githubUrl: profile?.githubUrl || "",
                    college: profile?.college || "",
                    graduationYear: profile?.graduationYear?.toString() || "2028",
                });
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load profile");
            } finally {
                setPageLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const payload = {
                skills: form.skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),

                targetCompanies: form.targetCompanies
                    .split(",")
                    .map((company) => company.trim())
                    .filter(Boolean),

                bio: form.bio,
                linkedinUrl: form.linkedinUrl,
                githubUrl: form.githubUrl,
                college: form.college,
                graduationYear: Number(form.graduationYear),
            };

            await api.put("/profile/me", payload);

            setMessage("Profile updated successfully");
        } catch (err: any) {
            setError(err.response?.data?.message || "Profile update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout
            title="Profile"
            description="Manage your placement profile, skills, target companies, and academic details."
        >
            <div className="max-w-5xl mx-auto">
                <div className="bg-bg-secondary border border-border rounded-2xl p-8 shadow-card">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-text-primary">
                            Student Profile
                        </h3>
                        <p className="text-sm text-text-tertiary mt-1">
                            This data will power your readiness score, resume analysis, and interview replay insights.
                        </p>
                    </div>

                    {pageLoading && (
                        <div className="bg-bg-tertiary border border-border rounded-xl p-4 mb-5 text-sm text-text-secondary">
                            Loading profile...
                        </div>
                    )}

                    {message && (
                        <div className="bg-success-muted border border-success/10 text-success rounded-xl p-3 mb-5 text-sm">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-danger-muted border border-danger/10 text-danger rounded-xl p-3 mb-5 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-sm text-text-secondary mb-1.5 block">
                                Skills
                            </label>
                            <input
                                value={form.skills}
                                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition-all text-sm"
                                placeholder="React, Node.js, TypeScript"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-text-secondary mb-1.5 block">
                                Target Companies
                            </label>
                            <input
                                value={form.targetCompanies}
                                onChange={(e) =>
                                    setForm({ ...form, targetCompanies: e.target.value })
                                }
                                className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition-all text-sm"
                                placeholder="TCS, Infosys, Accenture"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-text-secondary mb-1.5 block">
                                Bio
                            </label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition-all text-sm min-h-40 resize-none"
                                placeholder="Briefly describe your background, interests, and placement goals."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-sm text-text-secondary mb-1.5 block">
                                    LinkedIn URL
                                </label>
                                <input
                                    value={form.linkedinUrl}
                                    onChange={(e) =>
                                        setForm({ ...form, linkedinUrl: e.target.value })
                                    }
                                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition-all text-sm"
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-text-secondary mb-1.5 block">
                                    GitHub URL
                                </label>
                                <input
                                    value={form.githubUrl}
                                    onChange={(e) =>
                                        setForm({ ...form, githubUrl: e.target.value })
                                    }
                                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition-all text-sm"
                                    placeholder="https://github.com/username"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-sm text-text-secondary mb-1.5 block">
                                    College
                                </label>
                                <input
                                    value={form.college}
                                    onChange={(e) =>
                                        setForm({ ...form, college: e.target.value })
                                    }
                                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition-all text-sm"
                                    placeholder="Your college name"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-text-secondary mb-1.5 block">
                                    Graduation Year
                                </label>
                                <input
                                    type="number"
                                    value={form.graduationYear}
                                    onChange={(e) =>
                                        setForm({ ...form, graduationYear: e.target.value })
                                    }
                                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition-all text-sm"
                                    placeholder="2028"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm"
                            >
                                {loading ? "Saving..." : "Save profile"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};