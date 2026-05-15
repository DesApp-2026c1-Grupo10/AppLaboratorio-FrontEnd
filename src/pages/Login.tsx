import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../api/usuarios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Llamamos a la API
      const userData = await loginUsuario(email, password);
      
      // 2. Guardamos el usuario en el navegador (localStorage)
      localStorage.setItem("usuario", JSON.stringify(userData));
      
      // 3. Lo mandamos al Dashboard
      navigate("/");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "100px auto", textAlign: "center" }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}