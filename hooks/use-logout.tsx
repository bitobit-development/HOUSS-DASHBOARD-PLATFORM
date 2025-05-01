import Cookies from 'js-cookie'; // Import js-cookie for cookie handling

// Custom hook to handle logout functionality
export const useLogout = (router: any) => {
  const logout = () => {
    // Clear session-related cookies
    Cookies.remove('userSession');
    Cookies.remove('sessionExpiry');

    // Optionally clear other cookies if necessary
    // Cookies.remove('otherCookie'); 

    // Redirect to the login page and refresh the Dashboard
    //router.replace('/login'); // Use replace to ensure login isn't in the history
    window.location.reload(); // Refresh the page
  };

  return logout;
};
