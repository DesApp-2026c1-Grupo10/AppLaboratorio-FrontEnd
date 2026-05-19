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

  return (

    <Box className="app-layout">

      <Sidebar />

      <Box
        component="main"
        className="app-main"
      >

        <Navbar />

        <Toolbar />

        <Box className="app-content">

          {children}

        </Box>

      </Box>

    </Box>
  );
}



