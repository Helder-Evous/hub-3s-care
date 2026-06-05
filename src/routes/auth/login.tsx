import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, useAuth } from "@/shared/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

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
      // TEMP: exibe erro real para diagnóstico — reverter após confirmar login OK
      const parts = [
        `message: ${signInError.message}`,
        `status: ${'status' in signInError ? (signInError as { status?: number }).status : 'n/a'}`,
        `name: ${signInError.name}`,
      ];
      setError(parts.join(' | '));
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
          <h2 className="text-lg font-semibold mb-1">Entrar</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Acesso restrito à equipe 3S.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Mensagem de erro */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-critical/10 border border-critical/20 px-3 py-2.5 text-sm text-critical">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
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
