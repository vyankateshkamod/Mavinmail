// 'use client';

// import { useState, useEffect } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { getGoogleUrl } from '@/app/services/api'; // Import the new function

// export default function GmailConnect() {
//   const [isConnected, setIsConnected] = useState(false);
//   const [message, setMessage] = useState('');
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const success = searchParams.get('success');
//     const error = searchParams.get('error');

//     if (success === 'gmail_connected') {
//       setMessage('Successfully connected to your Gmail account!');
//       setIsConnected(true);
//     }
//     if (error) {
//       setMessage('Failed to connect to Gmail. Please try again.');
//     }
//   }, [searchParams]);

//   const handleConnect = async () => {
//     setMessage('');
//     try {
//       // 1. Fetch the secure URL from the backend
//       const googleAuthUrl = await getGoogleUrl();
//       // 2. Redirect the user
//       window.location.href = googleAuthUrl;
//     } catch (error: any) {
//       setMessage(error.message);
//     }
//   };

//   return (
//     // ... JSX is the same as before ...
//     <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10">
//       <h2 className="text-2xl font-bold mb-4 text-center">Connect Your Gmail</h2>
//       {message && (
//         <p
//           className={`text-center mb-4 ${
//             isConnected ? 'text-green-600' : 'text-red-600'
//           }`}
//         >
//           {message}
//         </p>
//       )}
//       <div className="flex justify-center">
//         <button
//           onClick={handleConnect}
//           disabled={isConnected}
//           className={`px-6 py-2 font-semibold text-white rounded-md ${
//             isConnected
//               ? 'bg-green-500 cursor-not-allowed'
//               : 'bg-blue-600 hover:bg-blue-700'
//           } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
//         >
//           {isConnected ? '✓ Connected' : 'Connect to Gmail'}
//         </button>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getGoogleUrl,
  checkConnectionStatus,
  disconnectGoogle,
  ConnectionStatus,
} from '@/app/services/api';

export default function GmailConnect() {
  const [connection, setConnection] = useState<ConnectionStatus & { isLoading: boolean }>({
    isLoading: true,
    isConnected: false,
    email: undefined,
  });
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  // Function to fetch and set status, wrapped in useCallback for stability
  const fetchStatus = useCallback(async () => {
    setConnection((prev) => ({ ...prev, isLoading: true }));
    const status = await checkConnectionStatus();
    setConnection({ ...status, isLoading: false });
  }, []);

  useEffect(() => {
    // Check for success/error messages from the Google OAuth redirect
    const success = searchParams.get('success');
    const authError = searchParams.get('error');
    if (success === 'gmail_connected' || authError) {
      // If we are coming back from a redirect, refetch the status to update the UI
      window.history.replaceState(null, '', '/dashboard'); // Clean the URL
    }
    fetchStatus();
  }, [fetchStatus, searchParams]);

  const handleConnect = async () => {
    setError('');
    try {
      const googleAuthUrl = await getGoogleUrl();
      window.location.href = googleAuthUrl;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisconnect = async () => {
    setError('');
    if (window.confirm('Are you sure you want to disconnect your Gmail account?')) {
      try {
        await disconnectGoogle();
        // Manually update the state to reflect the change immediately
        setConnection({ isLoading: false, isConnected: false, email: undefined });
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  // === RENDER LOGIC ===

  if (connection.isLoading) {
    return <div className="text-center p-6">Loading connection status...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Connect Your Gmail</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {connection.isConnected ? (
        // --- CONNECTED STATE ---
        <div>
          <p className="text-green-600 font-semibold mb-2">
            ✓ Account Connected
          </p>
          <p className="text-gray-600 mb-4">
            Connected as: <strong>{connection.email}</strong>
          </p>
          <button
            onClick={handleDisconnect}
            className="px-6 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
          >
            Disconnect
          </button>
        </div>
      ) : (
        // --- DISCONNECTED STATE ---
        <div>
          <p className="text-gray-600 mb-4">
            Connect your account to let the AI assistant manage your emails.
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Connect to Gmail
          </button>
        </div>
      )}
    </div>
  );
}