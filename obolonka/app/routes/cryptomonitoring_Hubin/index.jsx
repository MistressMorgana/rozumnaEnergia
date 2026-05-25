import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Monitor from "./pages/Monitor";
import Logs from "./pages/Logs";
import Stats from "./pages/Stats";
import Login from "./pages/Login";
import "./css/index.css";
import "./css/style.css";

export default function Index() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
