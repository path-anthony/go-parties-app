import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { BookingProvider } from "@/state/booking"
import { AskProvider } from "@/state/ask"
import Welcome from "@/pages/Welcome"
import SignIn from "@/pages/SignIn"
import Home from "@/pages/Home"
import BookDate from "@/pages/BookDate"
import BookBudget from "@/pages/BookBudget"
import BookPackage from "@/pages/BookPackage"
import BookDetail from "@/pages/BookDetail"
import BookAddons from "@/pages/BookAddons"
import BookWhere from "@/pages/BookWhere"
import BookReview from "@/pages/BookReview"
import Kit from "@/pages/Kit"

function App() {
  return (
    <BookingProvider>
      <BrowserRouter>
        <AskProvider>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/home" element={<Home />} />
            <Route path="/book/date" element={<BookDate />} />
            <Route path="/book/budget" element={<BookBudget />} />
            <Route path="/book/package" element={<BookPackage />} />
            <Route path="/book/detail" element={<BookDetail />} />
            <Route path="/book/addons" element={<BookAddons />} />
            <Route path="/book/where" element={<BookWhere />} />
            <Route path="/book/review" element={<BookReview />} />
            <Route path="/kit" element={<Kit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AskProvider>
      </BrowserRouter>
    </BookingProvider>
  )
}

export default App
