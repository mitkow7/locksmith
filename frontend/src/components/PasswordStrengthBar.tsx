import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthBarProps {
  password: string;
  className?: string;
}

function scorePassword(pw: string) {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Normalize to 0..4
  return Math.min(4, Math.max(0, Math.floor(score - 1)));
}

export const PasswordStrengthBar = ({ password, className }: PasswordStrengthBarProps) => {
  const value = useMemo(() => scorePassword(password), [password]);
  const segments = [0, 1, 2, 3];

  const colorClass =
    value <= 1 ? "bg-destructive" : value === 2 ? "bg-warning" : "bg-success";

  return (
    <div className={cn("w-full flex gap-1", className)} aria-label="Password strength">
      {segments.map((i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-sm bg-muted",
            i <= value && colorClass
          )}
        />
      ))}
    </div>
  );
};
