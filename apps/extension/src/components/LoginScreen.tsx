import { useState } from 'react';

// The props remain the same to keep the connection with App.tsx
interface LoginScreenProps {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export default function LoginScreen({ login, onLoginSuccess, onCancel }: LoginScreenProps) {
  // The state and logic from our previous steps remain the same
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    // Apply the new styles to the form and its elements
    <div className="flex h-screen flex-col items-center justify-center bg-[#121212] text-white">
      <h1 className="text-2xl font-bold mb-6">Login</h1>

      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <input
          id="email"
          type="email"
          placeholder="Email"
          className="mb-3 px-4 py-2 rounded bg-[#171717] border border-[#262626] text-white w-64 focus:outline-none focus:ring-1 focus:ring-[#22d3ee]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          id="password"
          type="password"
          placeholder="Password"
          className="mb-4 px-4 py-2 rounded bg-[#171717] border border-[#262626] text-white w-64 focus:outline-none focus:ring-1 focus:ring-[#22d3ee]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {/* We keep the error message for user feedback, styled to fit in */}
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          className="bg-[#22d3ee] px-6 py-2 rounded font-semibold w-64 hover:bg-[#1bbccf] transition-colors text-[#121212]"
        >
          Sign In
        </button>
      </form>

      {/* The "Back" button is now the "Cancel" button */}
      <button
        onClick={onCancel}
        className="mt-4 text-sm text-gray-400 hover:text-white"
      >
        ← Back to Chat
      </button>
    </div>
  );
}