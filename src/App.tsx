import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { BookingProvider } from "@/state/booking"
import { CustomerProvider } from "@/state/customer"
import { AskProvider } from "@/state/ask"
import Home from "@/pages/Home"
import Browse from "@/pages/Browse"
import BookDate from "@/pages/BookDate"
import BookBudget from "@/pages/BookBudget"
import BookPackage from "@/pages/BookPackage"
import BookDetail from "@/pages/BookDetail"
import BookAddons from "@/pages/BookAddons"
import BookWhere from "@/pages/BookWhere"
import BookReview from "@/pages/BookReview"
import Held from "@/pages/Held"
import MyParty from "@/pages/MyParty"
import PartySignIn from "@/pages/PartySignIn"
import PartySignUp from "@/pages/PartySignUp"
import PartyReschedule from "@/pages/PartyReschedule"
import PartyChange from "@/pages/PartyChange"
import ItemDate from "@/pages/ItemDate"
import ItemWho from "@/pages/ItemWho"
import ItemAccount from "@/pages/ItemAccount"
import ItemHeld from "@/pages/ItemHeld"
import Kit from "@/pages/Kit"

function App() {
  return (
    <BookingProvider>
      <CustomerProvider>
      <BrowserRouter>
        <AskProvider>
          <Routes>
            {/* Welcome and Home are one screen; both paths render it so old links keep working. */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            {/* The old click-through gate is gone; sign in is the portal's. */}
            <Route path="/signin" element={<Navigate to="/party/signin" replace />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/book/date" element={<BookDate />} />
            <Route path="/book/budget" element={<BookBudget />} />
            <Route path="/book/package" element={<BookPackage />} />
            <Route path="/book/detail" element={<BookDetail />} />
            <Route path="/book/addons" element={<BookAddons />} />
            <Route path="/book/where" element={<BookWhere />} />
            <Route path="/book/review" element={<BookReview />} />
            <Route path="/held" element={<Held />} />
            <Route path="/party" element={<MyParty />} />
            <Route path="/party/signin" element={<PartySignIn />} />
            <Route path="/party/signup" element={<PartySignUp />} />
            <Route path="/party/:id/reschedule" element={<PartyReschedule />} />
            <Route path="/party/:id/change" element={<PartyChange />} />
            <Route path="/item/held" element={<ItemHeld />} />
            <Route path="/item/:id" element={<ItemDate />} />
            <Route path="/item/:id/who" element={<ItemWho />} />
            <Route path="/item/:id/account" element={<ItemAccount />} />
            <Route path="/kit" element={<Kit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AskProvider>
      </BrowserRouter>
      </CustomerProvider>
    </BookingProvider>
  )
}

export default App
