// app/login/page.tsx
'use client'; // Marking this as a Client Component

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie'; // Import js-cookie for cookie handling

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);  // Loading state to control spinner
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true); // Start loading when the user submits the form

    // Log the email and password submitted by the user
    console.log("User submitted login:", { email, password });

    // Authenticate user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Log the response from Supabase
    console.log("Supabase signIn response:", { authData, authError });

    if (authError) {
      // If error occurs during sign-in, log and display error message
      setError("Invalid credentials or user does not exist.");
      setLoading(false); // Stop loading
      console.error("Authentication error:", authError.message);
      return;
    }

    // Create session and set expiry to 1 hour
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const { session } = sessionData;

    // Log the session and user details
    console.log("Supabase session response:", { session, sessionError });

    if (sessionError) {
      // If session creation fails, log and display error
      setError("Failed to create session.");
      setLoading(false); // Stop loading
      console.error("Session creation error:", sessionError.message);
      return;
    }

    // Store session and set expiry time (1 hour)
    const expiry = new Date().getTime() + 3600 * 1000; // 1 hour from now

    // Use js-cookie to set the cookies in the client-side
    Cookies.set('userSession', JSON.stringify(session), {
      expires: 1, // expires in 1 day (you can adjust this as needed)
      path: '/',
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'Strict', // Prevent CSRF attacks
    });

    Cookies.set('sessionExpiry', expiry.toString(), {
      expires: 1, // expires in 1 day (you can adjust this as needed)
      path: '/',
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'Strict',
    });

    // Log session storage
    console.log("Session and expiry stored in cookies");

    // Redirect to home page after successful login
    router.push("/dashboard");

    // Log success
    console.log("Login successful, redirecting to home dashboard.");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm onSubmit={handleLogin} error={error} loading={loading} /> {/* Pass loading state */}
      </div>
    </div>
  );
}
