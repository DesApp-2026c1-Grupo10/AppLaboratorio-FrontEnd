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
    <Box sx={{ minHeight: '100vh', bgcolor: '#6C72FA', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2.5 }}>
      <Box sx={{ bgcolor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', width: 450, maxWidth: '100%', p: '50px 60px' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#333', display: 'flex', alignItems: 'center', gap: 1, mb: 5 }}>
          <span>🔬</span> GestiónLab
        </Typography>
        
        <Typography sx={{ fontSize: '2rem', color: '#1A1A1A', mb: 3.75 }}>Welcome Back</Typography>
        
        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', mb: 1 }}>Email Address</Typography>
            <TextField
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#6C72FA' } }}
            />
          </Box>
          
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', mb: 1 }}>Password</Typography>
            <TextField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#6C72FA' } }}
            />
          </Box>
          
          <Button type="submit" variant="contained" disabled={loading} fullWidth sx={{ bgcolor: '#6C72FA', borderRadius: '8px', py: 1.75, fontSize: '1rem', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#555be0' } }}>
            {loading ? 'Ingresando...' : 'Log In'}
          </Button>
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
