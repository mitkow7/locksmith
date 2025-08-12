import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tos, setTos] = useState(false);
  const [questions, setQuestions] = useState({ q1: "", a1: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Create Account – Locksmith";
  }, []);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const canNext1 = email && password.length >= 8 && password === confirm;
  const canNext2 = true; // optional questions

  const submit = async () => {
    if (!tos) return;
    
    setLoading(true);
    
    try {
      const response = await apiClient.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      
      if (response.success) {
        toast.success("Account created successfully!");
        // Navigate to dashboard since user is now logged in with JWT tokens
        navigate("/dashboard");
      } else {
        toast.error(response.error || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred during registration");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-xl rounded-lg border bg-card p-6 shadow-lg animate-fade-in">
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">Use a strong master password. You'll verify your email next.</p>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Master password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <PasswordStrengthBar password={password} />
              <p className="text-xs text-muted-foreground">Use 12+ characters with upper, lower, numbers, and symbols.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpw">Confirm password</Label>
              <Input id="cpw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" asChild>
                <Link to="/login">Cancel</Link>
              </Button>
              <Button onClick={next} disabled={!canNext1}>Continue</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="q1">Security question (optional)</Label>
                <Input id="q1" placeholder="E.g. First pet's name" value={questions.q1} onChange={(e) => setQuestions({ ...questions, q1: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a1">Answer</Label>
                <Input id="a1" value={questions.a1} onChange={(e) => setQuestions({ ...questions, a1: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={back}>Back</Button>
              <Button onClick={next} disabled={!canNext2}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox id="tos" checked={tos} onCheckedChange={(v) => setTos(Boolean(v))} />
              <label htmlFor="tos" className="text-sm">
                I agree to the <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>
              </label>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={back}>Back</Button>
              <Button onClick={submit} disabled={!tos || loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">We will send a verification email.</p>
          </div>
        )}
      </main>
    </div>
  );
}
