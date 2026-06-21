import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../api/usuarios";
import { Box, TextField, Button, Snackbar, Alert, Typography, Checkbox, FormControlLabel } from "@mui/material";

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
      <Box sx={{ bgcolor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', width: 1000, maxWidth: '100%', minHeight: 600, overflow: 'hidden' }}>
        
        {/* Form Section */}
        <Box sx={{ flex: 1, p: '50px 70px', display: 'flex', flexDirection: 'column' }}>
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
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.75, fontSize: '0.85rem' }}>
              <FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: '0.85rem', color: '#666' }}>Keep me logged in</Typography>} />
              <Typography component="a" href="#" sx={{ color: '#ff758f', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>Forgot your password?</Typography>
            </Box>
            
            <Button type="submit" variant="contained" disabled={loading} fullWidth sx={{ bgcolor: '#6C72FA', borderRadius: '8px', py: 1.75, fontSize: '1rem', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#555be0' } }}>
              {loading ? 'Ingresando...' : 'Log In'}
            </Button>
          </Box>
          
          <Typography sx={{ textAlign: 'center', mt: 3.75, fontSize: '0.85rem', color: '#666' }}>
            Don't have an account? <Typography component="a" href="#" sx={{ color: '#ff758f', textDecoration: 'none', fontWeight: 600 }}>Sign up</Typography>
          </Typography>
        </Box>
        
        {/* Illustration Section */}
        <Box sx={{ flex: 1, bgcolor: '#F4F6FF', p: 5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
          <Box sx={{ textAlign: 'right', maxWidth: 300, alignSelf: 'flex-end' }}>
            <Typography sx={{ fontWeight: 700, color: '#333', mb: 1.25, fontSize: '0.9rem' }}>📖 Lab Academy</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#666', mb: 1.875, lineHeight: 1.4 }}>Tenemos guías y herramientas para que gestiones el laboratorio fácilmente.</Typography>
            <Button variant="outlined" sx={{ borderRadius: '4px', px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 600, borderColor: '#333', color: '#333', '&:hover': { bgcolor: '#333', color: '#fff' } }}>START ACADEMY</Button>
          </Box>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box component="img" src="https://cdni.iconscout.com/illustration/premium/thumb/man-working-on-laptop-at-home-2528448-2117417.png" alt="Ilustración" sx={{ maxWidth: '100%', height: 'auto' }} />
          </Box>
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