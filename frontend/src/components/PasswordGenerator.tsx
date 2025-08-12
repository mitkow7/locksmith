import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Copy, RefreshCw } from "lucide-react";
import { PasswordStrengthBar } from "./PasswordStrengthBar";
import { toast } from "@/hooks/use-toast";

interface PasswordGeneratorProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUsePassword?: (pw: string) => void;
}

function generatePassword(length: number, opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean; excludeSimilar: boolean; excludeAmbiguous: boolean; }): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed I O
  const lower = "abcdefghijkmnopqrstuvwxyz"; // removed l
  const numbers = opts.excludeSimilar ? "23456789" : "0123456789";
  const symbols = opts.excludeAmbiguous ? "!@#$%^&*" : "!@#$%^&*()-_=+[]{};:,.<>/?";
  let pool = "";
  if (opts.upper) pool += upper;
  if (opts.lower) pool += lower;
  if (opts.numbers) pool += numbers;
  if (opts.symbols) pool += symbols;
  if (!pool) pool = lower;
  let out = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    const idx = arr[i] % pool.length;
    out += pool[idx];
  }
  return out;
}

export default function PasswordGenerator({ open, onOpenChange, onUsePassword }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true, excludeSimilar: true, excludeAmbiguous: false });
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (open) {
      setPassword(generatePassword(length, opts));
    }
  }, [open]);

  const regen = () => setPassword(generatePassword(length, opts));

  const onCopy = async () => {
    await navigator.clipboard.writeText(password);
    toast({ title: "Password copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Password Generator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Generated password</Label>
            <div className="flex gap-2">
              <Input readOnly value={password} />
              <Button variant="secondary" onClick={onCopy}><Copy className="h-4 w-4 mr-2" />Copy</Button>
              <Button variant="outline" onClick={regen}><RefreshCw className="h-4 w-4 mr-2" />New</Button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>

          <div className="space-y-2">
            <Label>Length: {length}</Label>
            <Slider value={[length]} min={8} max={128} step={1} onValueChange={([v]) => setLength(v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2"><Checkbox checked={opts.upper} onCheckedChange={(v) => setOpts({ ...opts, upper: Boolean(v) })} id="upper" /><Label htmlFor="upper">Uppercase letters</Label></div>
            <div className="flex items-center gap-2"><Checkbox checked={opts.lower} onCheckedChange={(v) => setOpts({ ...opts, lower: Boolean(v) })} id="lower" /><Label htmlFor="lower">Lowercase letters</Label></div>
            <div className="flex items-center gap-2"><Checkbox checked={opts.numbers} onCheckedChange={(v) => setOpts({ ...opts, numbers: Boolean(v) })} id="numbers" /><Label htmlFor="numbers">Numbers</Label></div>
            <div className="flex items-center gap-2"><Checkbox checked={opts.symbols} onCheckedChange={(v) => setOpts({ ...opts, symbols: Boolean(v) })} id="symbols" /><Label htmlFor="symbols">Symbols</Label></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2"><Checkbox checked={opts.excludeSimilar} onCheckedChange={(v) => setOpts({ ...opts, excludeSimilar: Boolean(v) })} id="similar" /><Label htmlFor="similar">Exclude similar characters</Label></div>
            <div className="flex items-center gap-2"><Checkbox checked={opts.excludeAmbiguous} onCheckedChange={(v) => setOpts({ ...opts, excludeAmbiguous: Boolean(v) })} id="ambiguous" /><Label htmlFor="ambiguous">Exclude ambiguous characters</Label></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => { onUsePassword?.(password); onOpenChange(false); }}>Use Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
