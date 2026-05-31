import { useState } from "react";
import {
  Box,
  Toolbar,
} from "@mui/material";

import Sidebar
from "./Sidebar";

import Navbar
from "./Navbar";

import "../../styles/layout.css";

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({
  children,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (

    <Box className="app-layout">

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        className="app-main"
      >

        <Navbar onMenuClick={() => setMobileOpen(!mobileOpen)} />

        <Toolbar />

        <Box className="app-content">

          {children}

        </Box>

      </Box>

    </Box>
  );
}



