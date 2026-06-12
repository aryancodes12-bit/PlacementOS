import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export const RegisterPage = () => {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data } = await api.post("/auth/register", form);

            setAuth(data.user, data.accessToken);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        Placement<span className="text-indigo-500">OS</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Start your placement journey</p>
                </div>

                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                    <h2 className="text-xl font-semibold text-white mb-6">Create account</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400
                          rounded-lg p-3 mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg
                           px-4 py-3 text-white placeholder-gray-500
                           focus:outline-none focus:border-indigo-500 transition"
                                placeholder="Aryan Jaiswal"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg
                           px-4 py-3 text-white placeholder-gray-500
                           focus:outline-none focus:border-indigo-500 transition"
                                placeholder="aryan@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg
                           px-4 py-3 text-white placeholder-gray-500
                           focus:outline-none focus:border-indigo-500 transition"
                                placeholder="Min 8 characters"
                                minLength={8}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                         text-white font-semibold rounded-lg py-3 transition"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-gray-400 text-sm text-center mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}