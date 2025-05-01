import Cookies from 'js-cookie'; // Import js-cookie for cookie handling
import { useRouter } from 'next/router';

export const getSessionFromCookies = () => {
  // Retrieve cookies using js-cookie
  const userSession = Cookies.get('userSession') ? JSON.parse(Cookies.get('userSession')) : null;
  const sessionExpiry = Cookies.get('sessionExpiry') ? parseInt(Cookies.get('sessionExpiry')) : null;
  const currentTime = new Date().getTime();

  // Check if the session is expired
  if (sessionExpiry && currentTime > sessionExpiry) {
    return null; // Session expired
  }

  return userSession;
};
