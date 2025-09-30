const handleLogin = async (e) => {
  e.preventDefault();
  const res = await fetch("http://localhost:4000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return alert("Login falhou");
  const data = await res.json();
  setUser(data.user);
  setToken(data.token);
};
