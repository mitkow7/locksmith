import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleVault } from "@/data/mockVault";
import { Shield, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function SecurityPage() {
  const stats = useMemo(() => {
    const total = sampleVault.length;
    const weak = sampleVault.filter((i) => i.strength === "weak").length;
    const compromised = sampleVault.filter((i) => i.strength === "compromised").length;
    const strong = sampleVault.filter((i) => i.strength === "strong").length;
    return { total, weak, compromised, strong };
  }, []);

  const data = [
    { name: "Strong", value: stats.strong, color: "hsl(var(--success))" },
    { name: "Weak", value: stats.weak, color: "hsl(var(--warning))" },
    { name: "Compromised", value: stats.compromised, color: "hsl(var(--destructive))" },
  ];

  const score = Math.round(((stats.strong - stats.compromised * 0.5) / Math.max(1, stats.total)) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Security Health</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={data} innerRadius={60} outerRadius={80} paddingAngle={4}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <span className="text-success"><CheckCircle className="inline h-4 w-4 mr-1" />Strong: {stats.strong}</span>
            <span className="text-warning"><AlertTriangle className="inline h-4 w-4 mr-1" />Weak: {stats.weak}</span>
            <span className="text-destructive"><Shield className="inline h-4 w-4 mr-1" />Compromised: {stats.compromised}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="relative h-32 w-32 rounded-full border-8 border-muted flex items-center justify-center">
              <div className="absolute inset-0 rounded-full" style={{
                background: `conic-gradient(hsl(var(--success)) ${score}%, hsl(var(--muted)) ${score}% 100%)`
              }} aria-hidden="true" />
              <div className="absolute inset-2 rounded-full bg-background" />
              <span className="relative text-xl font-semibold">{Math.max(0, Math.min(100, score))}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>Reused Passwords</span><span>0</span></div>
            <div className="flex items-center justify-between"><span>Weak Passwords</span><span>{stats.weak}</span></div>
            <div className="flex items-center justify-between"><span>Compromised</span><span>{stats.compromised}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Recent Security Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.compromised === 0 ? (
            <div className="text-sm text-muted-foreground">No recent alerts. You're all set.</div>
          ) : (
            <div className="flex items-center gap-3 text-warning">
              <AlertTriangle className="h-4 w-4" /> Update compromised passwords as soon as possible.
            </div>
          )}
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-4 w-4" /> Enable automatic security checks for continuous protection.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
