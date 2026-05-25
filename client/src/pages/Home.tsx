// 重導向至登入頁
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/');
  }, []);
  return null;
}
