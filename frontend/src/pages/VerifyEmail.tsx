import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function VerifyEmail() {
  useEffect(() => {
    document.title = "Verify Email – Locksmith";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-lg animate-scale-in">
        <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent mb-4" />
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 text-muted-foreground">We sent a verification link to your inbox. Click it to activate your account.</p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Return to Login</Link>
        </Button>
      </main>
    </div>
  );
}
