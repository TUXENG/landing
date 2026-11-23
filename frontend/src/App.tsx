import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Admin } from "./pages/Admin";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
