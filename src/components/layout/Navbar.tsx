import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";

import "../../styles/navbar.css";

interface Props {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: Props) {
  return (

    <AppBar
      position="fixed"
      className="navbar"
    >

      <Toolbar>

        <IconButton
          edge="start"
          className="navbar-menu-btn"
          onClick={onMenuClick}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          component="div"
          className="navbar-title"
        >
          Sistema de Gestión de Laboratorios
        </Typography>

        <Box className="navbar-spacer" />

      </Toolbar>

    </AppBar>
  );
}
