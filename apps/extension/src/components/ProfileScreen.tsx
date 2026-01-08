interface ProfileScreenProps {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  // You can add more profile details here in the future
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#121212] text-white">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <p className="text-gray-400 mb-8">Manage your account and settings.</p>

      {/* --- THIS IS THE "LOG OUT" PART OF THE TOGGLE --- */}
      <button
        onClick={onLogout}
        className="bg-red-600 px-6 py-2 rounded font-semibold w-64 hover:bg-red-700 transition-colors"
      >
        Log Out
      </button>
    </div>
  );
}