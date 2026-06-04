import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, useAuth } from "@/shared/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Entrar — Hub 3S" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message === "User already registered"
        ? "Este e-mail já está cadastrado. Use o login normal."
        : signUpError.message);
      return;
    }
    setSuccess("Conta criada! Agora clique em Entrar.");
    setShowSignup(false);
  }

  // Se já autenticado, redireciona
  if (!authLoading && session) {
    navigate({ to: "/" });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Erro ao entrar. Tente novamente.",
      );
      setLoading(false);
      return;
    }

    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary grid place-items-center text-primary-foreground font-black text-2xl shadow-lg mb-4">
            3S
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hub 3S</h1>
          <p className="text-sm text-muted-foreground mt-1">Sala de Operação</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-1">{showSignup ? "Criar acesso" : "Entrar"}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {showSignup ? "Crie seu acesso inicial ao Hub 3S." : "Acesso restrito à equipe 3S."}
          </p>

          <form onSubmit={showSignup ? handleSignup : handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@3s.com.br"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition-colors",
                )}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition-colors",
                )}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-critical/10 border border-critical/20 px-3 py-2.5 text-sm text-critical">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2.5 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className={cn(
                "w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground",
                "transition-colors hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
              )}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{showSignup ? "Criando…" : "Entrando…"}</>
              ) : (
                showSignup ? "Criar acesso" : "Entrar"
              )}
            </button>

            <button
              type="button"
              onClick={() => { setShowSignup(!showSignup); setError(null); setSuccess(null); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {showSignup ? "← Voltar para o login" : "Primeiro acesso? Criar conta"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Problemas de acesso? Fale com o administrador do sistema.
        </p>
      </div>
    </div>
  );
}
