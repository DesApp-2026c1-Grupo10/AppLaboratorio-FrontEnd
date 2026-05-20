import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../api/usuarios";
import { Box, Paper, Typography, TextField, Button, } from "@mui/material";

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
     <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f1f5f9",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          width: 400,
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Typography variant="h4"  sx={{ fontWeight: 700, color: "#0B1739" }}>
          Iniciar Sesión
        </Typography>
        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                borderColor: "#0B1739",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#0B1739",
              },
            }}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                borderColor: "#0B1739",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#0B1739",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 1,
              py: 1.5,
              bgcolor: "#0B1739",
              borderRadius: 2,
              textTransform: "none",
              fontSize: 16,
              "&:hover": { bgcolor: "#1E2A5A" },
            }}
          >
            Entrar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}