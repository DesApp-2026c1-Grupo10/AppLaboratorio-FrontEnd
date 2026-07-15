import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Button,
} from "@mui/material";

import "../../styles/sidebar.css";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ScienceIcon from "@mui/icons-material/Science";
import InventoryIcon from "@mui/icons-material/Inventory";
import EventNoteIcon from "@mui/icons-material/EventNote";
import BarChartIcon from "@mui/icons-material/BarChart";
import BiotechIcon from "@mui/icons-material/Biotech";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PeopleIcon from "@mui/icons-material/People";

import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

const menuItems = [
  { text: "Dashboard", path: "/", icon: <DashboardIcon />, roles: ['Profesor', 'Desarrollador'] },
  { text: "Laboratorios", path: "/laboratorios", icon: <ScienceIcon />, roles: ['Profesor', 'Desarrollador'] },
  { text: "Pedidos", path: "/pedidos", icon: <EventNoteIcon />, roles: ['Profesor', 'Desarrollador'] },
  { text: "Agenda", path: "/agenda", icon: <EventNoteIcon />, roles: ['Profesor', 'Desarrollador'] },
  { text: "Inventario", path: "/inventario", icon: <InventoryIcon />, roles: ['Desarrollador'] },
  { text: "Sustancias Básicas", path: "/sustancias-basicas", icon: <BiotechIcon />, roles: ['Desarrollador'] },
  { text: "Carritos", path: "/carritos", icon: <LocalShippingIcon />, roles: ['Desarrollador'] },
  { text: "Estadísticas", path: "/estadisticas", icon: <BarChartIcon />, roles: ['Desarrollador'] },
  { text: "Usuarios", path: "/usuarios", icon: <PeopleIcon />, roles: ['Desarrollador'] },
];

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  // Buscamos con las dos posibles claves por si hubo una mezcla de nombres
  const userString = localStorage.getItem("user") || localStorage.getItem("usuario") || "{}";
  const user = JSON.parse(userString);

  function handleLogout() {
    // Borramos ambas claves para asegurarnos de matar la sesión al 100%
    localStorage.removeItem("user");
    localStorage.removeItem("usuario");

    // Forzamos la recarga de la página para que el Router y React limpien la memoria
    window.location.href = "/login";
  }

  const drawerContent = (
    <>
      <Toolbar>
        <Typography component="div" className="sidebar-logo">
          LabManager Pro
        </Typography>
      </Toolbar>

      <Box
        sx={{
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        <List>
          {menuItems.filter((item) => item.roles.includes(user.rol)).map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              className="sidebar-menu-item"
              onClick={() => { navigate(item.path); onClose(); }}
            >
              <ListItemIcon sx={{ color: "white", minWidth: 40, transition: 'transform 0.2s' }} className="sidebar-menu-icon">
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        <Box className="sidebar-user">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PersonIcon sx={{ fontSize: 18, color: '#CBD5E1' }} />
            <Typography component="div" className="sidebar-user-name">
              {user.nombre} {user.apellido || ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user.rol === 'Desarrollador' ? (
              <AdminPanelSettingsIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
            ) : (
              <SchoolIcon sx={{ fontSize: 16, color: '#6366F1' }} />
            )}
            <Typography component="div" className="sidebar-user-role">
              {user.rol === 'Desarrollador' ? 'Desarrollador' : 'Profesor'}
            </Typography>
          </Box>
          <Button
            fullWidth
            variant="outlined"
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Box>
    </>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        className="sidebar sidebar-desktop"
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        className="sidebar sidebar-mobile"
      >
        {drawerContent}
      </Drawer>
    </>
  );
}