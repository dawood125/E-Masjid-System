import './styles/globals.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { UIProvider } from './context/UIContext.jsx'

import Home from './components/User/Pages/Home'
import Login from './components/User/Pages/Login'
import Register from './components/User/Pages/Register'
import ForgotPassword from './components/User/Pages/ForgotPassword'
import ResetPassword from './components/User/Pages/ResetPassword'
import PrayerTimes from './components/User/Pages/PrayerTimes'
import Events from './components/User/Pages/Events'
import Donate from './components/User/Pages/Donate'
import NikahBooking from './components/User/Pages/NikahBooking'
import MyBookings from './components/User/Pages/MyBookings'
import Announcements from './components/User/Pages/Announcements'
import Transparency from './components/User/Pages/Transparency'
import FundRequest from './components/User/Pages/FundRequest'
import MyRequests from './components/User/Pages/MyRequests'
import AdminLogin from './components/Admin/Pages/AdminLogin'

import AdminDashboard from './components/Admin/Pages/Dashboard'
import AdminMarketing from './components/Admin/Pages/Marketing'
import DonationsExpenses from './components/Admin/Pages/DonationsExpenses'
import AdminPrayerTimes from './components/Admin/Pages/PrayerTimes'
import AdminEvents from './components/Admin/Pages/Events'
import AdminAnnouncements from './components/Admin/Pages/Announcements'
import AdminScholars from './components/Admin/Pages/Scholars'
import AdminCommittee from './components/Admin/Pages/Committee'
import AdminFundRequests from './components/Admin/Pages/FundRequests'

import ScholarDashboard from './components/Scholar/Pages/Dashboard'

import ManagerLogin from './components/Manager/Pages/ManagerLogin'
import ManagerDashboard from './components/Manager/Pages/Dashboard'
import ManageMosques from './components/Manager/Pages/Mosques'
import ManageAdmins from './components/Manager/Pages/Admins'

import CommitteeLogin from './components/Committee/Pages/CommitteeLogin'
import CommitteeDashboard from './components/Committee/Pages/Dashboard'

import UserLayout from './components/User/Layouts/UserLayout'
import AdminLayout from './components/Admin/Layouts/AdminLayout'
import ScholarLayout from './components/Scholar/Layouts/ScholarLayout'
import ManagerLayout from './components/Manager/Layouts/ManagerLayout'
import CommitteeLayout from './components/Committee/Layouts/CommitteeLayout'
import Toast from './components/Common/Toast'
import ScrollToTop from './components/Common/ScrollToTop.jsx'
import { MosqueProvider } from './context/MosqueContext.jsx'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <UIProvider>
          <MosqueProvider>
          <Toast />
          <Routes>

            <Route element={<UserLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/prayer-times" element={<PrayerTimes />} />
              <Route path="/events" element={<Events />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/nikah-booking" element={<NikahBooking />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/transparency" element={<Transparency />} />
              <Route path="/fund-request" element={<FundRequest />} />
              <Route path="/my-requests" element={<MyRequests />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="donations" element={<DonationsExpenses />} />
              <Route path="prayer-times" element={<AdminPrayerTimes />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="scholars" element={<AdminScholars />} />
              <Route path="committee" element={<AdminCommittee />} />
              <Route path="fund-requests" element={<AdminFundRequests />} />
              <Route path="marketing" element={<AdminMarketing />} />
            </Route>

            <Route path="/scholar/*" element={<ScholarLayout />}>
              <Route index element={<ScholarDashboard />} />
              <Route path="dashboard" element={<ScholarDashboard />} />
            </Route>

            <Route path="/manager/login" element={<ManagerLogin />} />
            <Route path="/manager/*" element={<ManagerLayout />}>
              <Route index element={<ManagerDashboard />} />
              <Route path="mosques" element={<ManageMosques />} />
              <Route path="admins" element={<ManageAdmins />} />
            </Route>

            <Route path="/committee/login" element={<CommitteeLogin />} />
            <Route path="/committee/*" element={<CommitteeLayout />}>
              <Route index element={<CommitteeDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </MosqueProvider>
        </UIProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
