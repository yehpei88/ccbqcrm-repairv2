// 重導向至登入頁
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/');
  }, []);
  return null;
}
