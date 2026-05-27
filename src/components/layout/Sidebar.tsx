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

import {
  Link,
  useLocation,
} from "react-router-dom";

const menuItems = [
  { text: "Dashboard", path: "/", icon: <DashboardIcon />, roles: ['Alumno', 'Profesor', 'Desarrollador'] },
  { text: "Laboratorios", path: "/laboratorios", icon: <ScienceIcon />, roles: ['Alumno', 'Profesor', 'Desarrollador'] },
  { text: "Pedidos", path: "/pedidos", icon: <EventNoteIcon />, roles: ['Alumno', 'Profesor', 'Desarrollador'] },
  { text: "Inventario", path: "/inventario", icon: <InventoryIcon />, roles: ['Desarrollador'] },
  { text: "Estadísticas", path: "/estadisticas", icon: <BarChartIcon />, roles: ['Desarrollador'] },
];

export default function Sidebar() {
  const location = useLocation();

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

  return (
    <Drawer variant="permanent" className="sidebar">
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
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              className="sidebar-menu-item"
            >
              <ListItemIcon sx={{ color: "white" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        <Box className="sidebar-user">
          <Typography component="div" className="sidebar-user-name">
            {user.nombre} {user.apellido || ''}
          </Typography>
          <Typography component="div" className="sidebar-user-email">
            {user.email}
          </Typography>
          <Typography component="div" className="sidebar-user-role">
            {user.rol || 'Usuario'}
          </Typography>
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
    </Drawer>
  );
}