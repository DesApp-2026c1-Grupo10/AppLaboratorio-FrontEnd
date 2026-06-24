import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../api/usuarios";
import { Box, TextField, Button, Snackbar, Alert, Typography } from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#0B1739', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2.5 }}>
      <Box sx={{ bgcolor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', display: 'flex', width: 1000, maxWidth: '100%', minHeight: 600, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, p: '50px 70px', display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#0B1739', display: 'flex', alignItems: 'center', gap: 1.5, mb: 6, letterSpacing: '-0.5px' }}>
            <Box component="span" sx={{ fontSize: '1.8rem' }}>🔬</Box> GestiónLab
          </Typography>

          <Typography sx={{ fontSize: '2rem', color: '#1A1A1A', mb: 4, fontWeight: 700 }}>Bienvenido</Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', mb: 1 }}>Correo electrónico</Typography>
              <TextField
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                required
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#0B1739' } }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', mb: 1 }}>Contraseña</Typography>
              <TextField
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#0B1739' } }}
              />
            </Box>

            <Button type="submit" variant="contained" disabled={loading} fullWidth sx={{ bgcolor: '#0B1739', borderRadius: '8px', py: 1.75, fontSize: '1rem', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#1E2A5A' } }}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, bgcolor: '#F4F6FF', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <Box component="img" src="/imagen-login.png" alt="Laboratorio" sx={{ maxWidth: '100%', height: 'auto', maxHeight: 400 }} />
        </Box>
      </Box>

      {snackbar && (
        <Snackbar open autoHideDuration={3000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>{snackbar.msg}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}
