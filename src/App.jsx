import { BrowserRouter, Routes, Route } from "react-router-dom";

import BuilderApp from "./BuilderApp";  
import BulletinsApp from "./modules/bulletinsm/BulletinsApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<ListaBotones />} />

        {/* BUILDER */}
        <Route path="/builder" element={<BuilderApp />} />

      </Routes>
    </BrowserRouter>
  );
}