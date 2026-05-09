import { Outlet } from 'react-router-dom'
import Navbar from '../../Common/Navbar'
import Footer from '../../Common/Footer'
import Toast from '../../Common/Toast'

export default function UserLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow pt-header">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  )
}
