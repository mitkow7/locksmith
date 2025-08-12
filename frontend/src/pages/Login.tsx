import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [open2FA, setOpen2FA] = useState(false);
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [resendingCode, setResendingCode] = useState(false);

  useEffect(() => {
    document.title = "Login – Locksmith";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.login({ email, password });
      
      if (response.success) {
        if (response.requires_2fa && response.user_id) {
          // 2FA required - show verification dialog
          setUserId(response.user_id);
          setOpen2FA(true);
          toast.success(response.message || "Please check your email for the verification code");
        } else {
          // Normal login successful
          toast.success("Login successful!");
          navigate("/dashboard");
        }
      } else {
        toast.error(response.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during login");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (code.length >= 6 && userId) {
      setLoading(true);
      
      try {
        const response = await apiClient.verify2FA(userId, code);
        
        if (response.success) {
          toast.success("2FA verification successful!");
          setOpen2FA(false);
          navigate("/dashboard");
        } else {
          toast.error(response.error || "Invalid verification code");
        }
      } catch (error) {
        toast.error("An error occurred during 2FA verification");
        console.error("2FA error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resendCode = async () => {
    if (!userId) return;
    
    setResendingCode(true);
    try {
      const response = await apiClient.resend2FA(userId);
      
      if (response.success) {
        toast.success("New verification code sent to your email");
        setCode(""); // Clear the input
      } else {
        toast.error(response.error || "Failed to resend code");
      }
    } catch (error) {
      toast.error("Failed to resend verification code");
      console.error("Resend error:", error);
    } finally {
      setResendingCode(false);
    }
  };

  const handleDialogClose = () => {
    setOpen2FA(false);
    setCode("");
    setUserId(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[length:100%]">
      <main className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg animate-fade-in">
        <div className="text-center mb-6">
          <div className="mx-auto h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]" />
          <h1 className="mt-3 text-2xl font-semibold">Locksmith</h1>
          <p className="text-sm text-muted-foreground">Secure Password Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Master Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="remember" 
                checked={remember} 
                onCheckedChange={(v) => setRemember(Boolean(v))} 
                disabled={loading}
              />
              <Label htmlFor="remember" className="text-sm">Remember this device</Label>
            </div>
            <Link to="#" className="text-sm hover:underline">Forgot Password?</Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here? <Link to="/register" className="underline">Create Account</Link>
        </p>
      </main>

      <Dialog open={open2FA} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Verification</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit verification code to your email address. 
              Please enter it below to complete your login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input 
                id="code" 
                inputMode="numeric" 
                value={code} 
                maxLength={6} 
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Enter 6-digit code"
                disabled={loading}
              />
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={resendCode}
                disabled={resendingCode || loading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {resendingCode ? "Sending..." : "Didn't receive the code? Resend"}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={handleDialogClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={verify2FA} disabled={code.length < 6 || loading}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
