"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Falha no login.");
      }
    } catch {
      setError("Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 19,19 1,19" fill="#FC0100" />
          </svg>
          <span
            className="text-lg tracking-[-0.05em] text-black"
            style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
          >
            Content Lab
          </span>
        </div>

        <h1
          className="text-2xl text-black tracking-[-0.04em] mb-1"
          style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
        >
          Entrar
        </h1>
        <p className="text-sm text-neutral-400 font-light mb-8">
          Studio Latina — acesso restrito
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
              E-mail
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded-xl px-4 py-2.5 text-sm text-black font-light placeholder:text-neutral-300 focus:outline-none focus:border-[#FC0100] transition"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
              Senha
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded-xl px-4 py-2.5 text-sm text-black font-light placeholder:text-neutral-300 focus:outline-none focus:border-[#FC0100] transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-[#FC0100] font-light">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#FC0100] text-white text-sm font-medium rounded-xl shadow-[0_4px_14px_rgba(252,1,0,0.25)] hover:bg-[#D40000] hover:shadow-[0_6px_20px_rgba(252,1,0,0.35)] hover:-translate-y-px transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
