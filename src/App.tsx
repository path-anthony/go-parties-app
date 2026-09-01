import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { BookingProvider } from "@/state/booking"
import { AskProvider } from "@/state/ask"
import Welcome from "@/pages/Welcome"
import Kit from "@/pages/Kit"

function App() {
  return (
    <BookingProvider>
      <BrowserRouter>
        <AskProvider>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/kit" element={<Kit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AskProvider>
      </BrowserRouter>
    </BookingProvider>
  )
}

export default App
