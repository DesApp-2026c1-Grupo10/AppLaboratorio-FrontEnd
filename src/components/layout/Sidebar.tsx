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

import DashboardIcon
from "@mui/icons-material/Dashboard";

import ScienceIcon
from "@mui/icons-material/Science";

import InventoryIcon
from "@mui/icons-material/Inventory";

import EventNoteIcon
from "@mui/icons-material/EventNote";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

const menuItems = [

  {
    text: "Dashboard",
    path: "/",
    icon: <DashboardIcon />,
  },

  {
    text: "Laboratorios",
    path: "/laboratorios",
    icon: <ScienceIcon />,
  },

  {
    text: "Pedidos",
    path: "/pedidos",
    icon: <EventNoteIcon />,
  },

  {
    text: "Inventario",
    path: "/inventario",
    icon: <InventoryIcon />,
  },
];

export default function Sidebar() {

  const location = useLocation();

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  function handleLogout() {

    localStorage.removeItem("user");

    navigate("/login");
  }

  return (

    <Drawer
      variant="permanent"
      className="sidebar"
    >

      <Toolbar>

        <Typography
          component="div"
          className="sidebar-logo"
        >
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

          {menuItems.map((item) => (

            <ListItemButton

              key={item.path}

              component={Link}

              to={item.path}

              selected={
                location.pathname === item.path
              }

              className="sidebar-menu-item"
            >

              <ListItemIcon
                sx={{
                  color: "white",
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.text}
              />

            </ListItemButton>
          ))}

        </List>

        <Box className="sidebar-user">

          <Typography
            component="div"
            className="sidebar-user-name"
          >
            {user.nombre}
          </Typography>

          <Typography
            component="div"
            className="sidebar-user-email"
          >
            {user.email}
          </Typography>

          <Button
            fullWidth
            variant="outlined" //antes "contained"

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

