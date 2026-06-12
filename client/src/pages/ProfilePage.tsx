import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const ProfilePage = () => {
    const navigate = useNavigate();

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
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/profile/me");
                const profile = data.data.profile;

                setForm({
                    skills: profile.skills?.join(", ") || "",
                    targetCompanies: profile.targetCompanies?.join(", ") || "",
                    bio: profile.bio || "",
                    linkedinUrl: profile.linkedinUrl || "",
                    githubUrl: profile.githubUrl || "",
                    college: profile.college || "",
                    graduationYear: profile.graduationYear?.toString() || "2028",
                });
            } catch {
                setError("Failed to load profile");
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

            setMessage("Profile updated successfully ✅");
        } catch (err: any) {
            setError(err.response?.data?.message || "Profile update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold">
                        Placement<span className="text-indigo-500">OS</span>
                    </h1>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                    <h2 className="text-xl font-semibold mb-2">Complete Your Profile</h2>
                    <p className="text-gray-400 mb-6">
                        This data will power your resume analysis, interview replay, and readiness score.
                    </p>

                    {message && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-3 mb-4 text-sm">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Skills</label>
                            <input
                                value={form.skills}
                                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                                placeholder="React, Node.js, TypeScript"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">
                                Target Companies
                            </label>
                            <input
                                value={form.targetCompanies}
                                onChange={(e) =>
                                    setForm({ ...form, targetCompanies: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                                placeholder="TCS, Infosys, Accenture"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Bio</label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 min-h-24"
                                placeholder="Tell something about yourself"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">LinkedIn URL</label>
                            <input
                                value={form.linkedinUrl}
                                onChange={(e) =>
                                    setForm({ ...form, linkedinUrl: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">GitHub URL</label>
                            <input
                                value={form.githubUrl}
                                onChange={(e) =>
                                    setForm({ ...form, githubUrl: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">College</label>
                            <input
                                value={form.college}
                                onChange={(e) => setForm({ ...form, college: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">
                                Graduation Year
                            </label>
                            <input
                                type="number"
                                value={form.graduationYear}
                                onChange={(e) =>
                                    setForm({ ...form, graduationYear: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg py-3"
                        >
                            {loading ? "Saving..." : "Save Profile"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};