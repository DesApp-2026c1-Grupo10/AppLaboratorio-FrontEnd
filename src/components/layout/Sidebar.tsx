import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Box, Button, Collapse,
} from "@mui/material";
import {
  Dashboard as DashboardIcon, Science as ScienceIcon,
  Inventory as InventoryIcon, EventNote as EventNoteIcon,
  ExpandLess, ExpandMore, Biotech as BiotechIcon,
  PrecisionManufacturing as PrecisionManufacturingIcon,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/sidebar.css";

const topItems = [
  { text: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { text: "Laboratorios", path: "/laboratorios", icon: <ScienceIcon /> },
  { text: "Pedidos", path: "/pedidos", icon: <EventNoteIcon /> },
];

const invSubItems = [
  { text: "General", path: "/inventario", icon: <InventoryIcon /> },
  { text: "Materiales", path: "/materiales", icon: <BiotechIcon /> },
  { text: "Reactivos", path: "/reactivos", icon: <ScienceIcon /> },
  { text: "Equipos", path: "/equipos", icon: <PrecisionManufacturingIcon /> },
  { text: "Movimientos", path: "/movimientos", icon: <SwapHorizIcon /> },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [invOpen, setInvOpen] = useState(
    location.pathname.startsWith("/inventario") ||
    location.pathname === "/materiales" ||
    location.pathname === "/reactivos" ||
    location.pathname === "/equipos" ||
    location.pathname === "/movimientos"
  );

  const user = JSON.parse(localStorage.getItem("usuario") || "{}");

  function handleLogout() {
    localStorage.removeItem("usuario");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <Drawer variant="permanent" className="sidebar">
      <Toolbar>
        <Typography component="div" className="sidebar-logo">
          LabManager Pro
        </Typography>
      </Toolbar>

      <Box sx={{ overflow: "auto", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        <List>
          {topItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              className="sidebar-menu-item"
            >
              <ListItemIcon sx={{ color: "white" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}

          <ListItemButton onClick={() => setInvOpen(!invOpen)} className="sidebar-menu-item">
            <ListItemIcon sx={{ color: "white" }}><InventoryIcon /></ListItemIcon>
            <ListItemText primary="Inventario" />
            {invOpen ? <ExpandLess sx={{ color: "white" }} /> : <ExpandMore sx={{ color: "white" }} />}
          </ListItemButton>

          <Collapse in={invOpen} timeout="auto" unmountOnExit>
            <List disablePadding>
              {invSubItems.map((item) => (
                <ListItemButton
                  key={item.path}
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  className="sidebar-sub-item"
                >
                  <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)", minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>

        <Box className="sidebar-user">
          <Typography component="div" className="sidebar-user-name">
            {user.nombre || "Usuario"}
          </Typography>
          <Typography component="div" className="sidebar-user-email">
            {user.email || ""}
          </Typography>
          <Button fullWidth variant="outlined" className="sidebar-logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
