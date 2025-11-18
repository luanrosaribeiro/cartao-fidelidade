import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import API_URL from "./config";

export default function ClientApp() {
  const [view, setView] = useState("login");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [refeicoes, setRefeicoes] = useState([]);
  const [showQR, setShowQR] = useState(false);

  // Login
  async function login(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: cpf, senha: password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!data.success) return alert("Usuário ou senha inválidos");

      setUser(data.user);
      setView("dashboard");
      carregarRefeicoes();

    } catch (err) {
      alert("Erro ao conectar ao servidor.");
    }
  }

  async function carregarRefeicoes() {
    const res = await fetch(`${API_URL}/clientes/minhas-refeicoes`, {
      credentials: "include",
    });

    const data = await res.json();
    if (data.success) setRefeicoes(data.data);
  }

  async function registrarRefeicao() {
    const res = await fetch(`${API_URL}/clientes/${user.id}/registrar`, {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.success) {
      alert("Refeição registrada!");
      carregarRefeicoes();
    }
  }

  function abrirQR() {
    setShowQR(true);
  }

  function fecharQR() {
    setShowQR(false);
  }

  async function logout() {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    setView("login");
  }

  // -------------------------------------
  // Renderização
  // -------------------------------------
  return (
    <div className="container mt-4">

      {/* LOGIN */}
      {view === "login" && (
        <form onSubmit={login} className="w-50 mx-auto">
          <h3 className="mb-3">Login</h3>

          <div className="mb-3">
            <label>CPF</label>
            <input className="form-control" value={cpf} onChange={(e) => setCpf(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label>Senha</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button className="btn btn-primary w-100">Entrar</button>
        </form>
      )}

      {/* DASHBOARD */}
      {view === "dashboard" && user && (
        <>
          <div className="d-flex justify-content-between">
            <h3>Bem-vindo, {user.nome}</h3>
            <button onClick={logout} className="btn btn-danger btn-sm">Sair</button>
          </div>

          <button className="btn btn-primary mt-3 mb-3" onClick={abrirQR}>
            Gerar QR Code para Registrar Refeição
          </button>

          <h5>Minhas Refeições</h5>
          {refeicoes.length === 0 && <p>Nenhuma refeição registrada.</p>}

          {refeicoes.map((r) => (
            <div key={r.id} className="card p-2 mb-2">
              <strong>{new Date(r.data).toLocaleString()}</strong>
              {r.cortesia && <span className="text-success ms-2">(Cortesia)</span>}
            </div>
          ))}

          {/* MODAL QR */}
          {showQR && (
            <div className="qr-modal text-center p-3 border rounded bg-light position-fixed top-50 start-50 translate-middle shadow-lg">
              <h5>QR para Registrar sua Refeição</h5>

              <QRCodeCanvas
                value={JSON.stringify({
                  clienteId: user.id,
                  time: Date.now(),
                })}
                size={200}
              />

              <div className="mt-3">
                <button className="btn btn-secondary" onClick={fecharQR}>Fechar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
