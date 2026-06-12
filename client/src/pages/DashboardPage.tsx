import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export const DashboardPage = () => {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold">
                        Placement<span className="text-indigo-500">OS</span>
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition"
                    >
                        Logout
                    </button>
                    <button
                        onClick={() => navigate("/profile")}
                        className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm transition"
                    >
                        Edit Profile
                    </button>
                </div>

                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                    <h2 className="text-xl font-semibold mb-2">
                        Welcome, {user?.name}! 👋
                    </h2>
                    <p className="text-gray-400">
                        Dashboard coming in Step 5. Auth is working perfectly ✅
                    </p>
                </div>
            </div>
        </div>
    )
}