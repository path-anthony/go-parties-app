import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Kit from "@/pages/Kit"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/kit" element={<Kit />} />
        <Route path="*" element={<Navigate to="/kit" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
