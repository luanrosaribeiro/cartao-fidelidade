import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import API_URL from "./config";

export default function ClientApp() {
  const [view, setView] = useState("login");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [meals, setMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);

  async function login(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: cpf, senha: password }),
      });

      if (!res.ok) throw new Error("Login falhou");
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setView("dashboard");
        fetchMeals();
        notify("Bem-vindo", `Olá usuário ${data.user.id}, você está logado!`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Falha no login");
    }
  }


  // Buscar refeições
  async function fetchMeals(token) {
    try {
      const res = await fetch(`${API_URL}/meals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar refeições");
      const data = await res.json();
      setMeals(data.meals);
    } catch (err) {
      alert("Falha ao carregar refeições");
    }
  }
  
  // Logout
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setToken("");
    setView("login");
    setMeals([]);
  }

  // Notificações
  function notify(title, body) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification(title, { body });
      });
    }
  }

  // Abrir QR Code
  function showQR(meal) {
    setSelectedMeal(meal);
  }

  // Fechar QR Code
  function closeQR() {
    notify(
      "Refeição registrada",
      `${selectedMeal.name} foi marcada como consumida!`
    );
    setSelectedMeal(null);
  }

  return (
    <div className="container mt-4">
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

      {view === "dashboard" && user && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Olá, {user.name}</h3>
            <button className="btn btn-danger btn-sm" onClick={logout}>
              Logout
            </button>
          </div>

          <div className="meal-list">
            {meals.length === 0 && <p>Nenhuma refeição encontrada.</p>}
            {meals.map((meal) => (
              <div key={meal.id} className="card mb-2 p-2">
                <div>
                  <strong>{meal.name}</strong> - R$ {meal.value}
                </div>
                <div>{meal.description}</div>
                <button
                  className="btn btn-success btn-sm mt-2"
                  onClick={() => showQR(meal)}
                >
                  Gerar QR Code
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMeal && (
        <div className="qr-modal text-center p-3 border rounded bg-light">
          <h5>QR Code da refeição: {selectedMeal.name}</h5>
          <QRCodeCanvas
            value={JSON.stringify({
              mealId: selectedMeal.id,
              user: user.name,
              time: Date.now(),
            })}
            size={200}
          />
          <div className="mt-2">
            <button className="btn btn-secondary btn-sm" onClick={closeQR}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}