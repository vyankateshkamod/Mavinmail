'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// A Higher-Order Component is a function that takes a component and returns a new component.
const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AuthComponent = (props: P) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // This effect runs on the client-side after the component mounts.
      const token = localStorage.getItem('token');

      if (!token) {
        // If no token is found, redirect to the login page.
        router.replace('/auth/login');
      } else {
        // If a token is found, the user is authenticated.
        // We can stop loading and show the protected component.
        setIsLoading(false);
      }
    }, [router]);

    if (isLoading) {
      // While checking for the token, show a loading indicator.
      // This prevents a "flash" of the protected content.
      return (
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-xl">Loading...</p>
        </div>
      );
    }

    // If not loading and token exists, render the component that was passed in.
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;