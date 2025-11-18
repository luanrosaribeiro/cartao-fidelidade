import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import API_URL from "./config";

export default function ClientApp() {
  const [view, setView] = useState("login");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // 🔐 Login
  async function login(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: cpf, senha: password }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Falha no login");
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setView("dashboard");
        fetchClients();
        notify("Bem-vindo", `Usuário ${data.user.id} logado com sucesso!`);
      } else {
        alert(data.message || "Usuário ou senha inválidos");
      }
    } catch (err) {
      alert("Erro ao conectar ao servidor de login.");
    }
  }

  // 📋 Buscar clientes
  async function fetchClients() {
    try {
      const res = await fetch(`${API_URL}/clientes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      const data = await res.json();
      setClients(data.data || []);
    } catch (err) {
      alert("Falha ao carregar clientes");
    }
  }

  // 🚪 Logout
  async function logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Erro ao sair:", err);
    } finally {
      setUser(null);
      setView("login");
      setClients([]);
    }
  }

  // 🔔 Notificação
  function notify(title, body) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification(title, { body });
      });
    }
  }

  // 🎟️ Mostrar QR Code
  function showQR(client) {
    setSelectedClient(client);
  }

  // ❌ Fechar modal QR
  function closeQR() {
    setSelectedClient(null);
  }

  // 🍽️ Registrar refeição (via botão ou QR)
  async function registrarRefeicao(clientId) {
    try {
      const res = await fetch(`${API_URL}/clientes/${clientId}/registrar`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Erro ao registrar refeição");
      const data = await res.json();

      if (data.success) {
        notify("Refeição registrada", `Cliente ${clientId} teve refeição registrada!`);
        alert(`Refeição registrada com sucesso para o cliente ${clientId}.`);
      } else {
        alert(data.message || "Falha ao registrar refeição.");
      }
    } catch (err) {
      alert("Erro de comunicação com o servidor.");
    }
  }

  // 📱 Renderização
  return (
    <div className="container mt-4">
      {/* LOGIN */}
      {view === "login" && (
        <form onSubmit={login} className="w-50 mx-auto">
          <h3 className="mb-3">Login</h3>
          <div className="mb-3">
            <label>CPF</label>
            <input
              type="text"
              className="form-control"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label>Senha</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Entrar
          </button>
        </form>
      )}

      {/* DASHBOARD */}
      {view === "dashboard" && user && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Olá, usuário {user.id}</h3>
            <button className="btn btn-danger btn-sm" onClick={logout}>
              Logout
            </button>
          </div>

          <h5>Lista de Clientes</h5>
          {clients.length === 0 && <p>Nenhum cliente encontrado.</p>}
          {clients.map((client) => (
            <div key={client.id} className="card mb-2 p-3">
              <strong>{client.nome}</strong> - CPF: {client.cpf}
              <div>{client.email}</div>
              <div className="mt-2 d-flex gap-2">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => registrarRefeicao(client.id)}
                >
                  Registrar Refeição
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => showQR(client)}
                >
                  Gerar QR Code
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL QR CODE */}
      {selectedClient && (
        <div className="qr-modal text-center p-3 border rounded bg-light position-fixed top-50 start-50 translate-middle shadow-lg">
          <h5>QR Code do cliente: {selectedClient.nome}</h5>
          <QRCodeCanvas
            value={JSON.stringify({
              clienteId: selectedClient.id,
              userId: user.id,
              time: Date.now(),
            })}
            size={200}
          />
          <div className="mt-3 d-flex justify-content-center gap-2">
            <button
              className="btn btn-success btn-sm"
              onClick={() => registrarRefeicao(selectedClient.id)}
            >
              Registrar via QR
            </button>
            <button className="btn btn-secondary btn-sm" onClick={closeQR}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
