import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useStore from '../store/useStore';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, accessToken } = useStore();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (user && accessToken) {
        setAuthenticated(true);
        setLoading(false);
        return;
      }

      // Try to refresh token if no access token but might have refresh cookie
      try {
        await refresh();
        setAuthenticated(true);
      } catch (error) {
        console.log('No valid session found');
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, accessToken, refresh]);

  if (loading) {
    return (
      <div className="h-full grid place-items-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}