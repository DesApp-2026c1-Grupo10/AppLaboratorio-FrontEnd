import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../api/usuarios";
import { Box, Paper, Typography, TextField, Button, Snackbar, Alert } from "@mui/material";
import type { SnackbarState } from '../types/snackbar';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await loginUsuario(email, password);
      localStorage.setItem("usuario", JSON.stringify(userData));
      navigate("/");
    } catch (error) {
      setSnackbar({ msg: error instanceof Error ? error.message : 'Error al iniciar sesión', severity: 'error' });
    } finally {
      setLoading(false);
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
            disabled={loading}
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
            {loading ? 'Ingresando...' : 'Entrar'}
          </Button>
        </Box>
      </Paper>

      {snackbar && (
        <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>{snackbar.msg}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}