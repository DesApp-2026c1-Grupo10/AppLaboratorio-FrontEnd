import {
  AppBar,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";

import "../../styles/navbar.css";

export default function Navbar() {

  return (

    <AppBar
      position="fixed"
      className="navbar"
    >

      <Toolbar>

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
