import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { ROUTES } from '../../../utils/constants.js'
import { formatCurrency } from '../../../utils/formatters.js'
import api from '../../../utils/api.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'

const donationTypes = [
  { value: 'sadaqah', label: 'Sadaqah', icon: 'favorite' },
  { value: 'zakat', label: 'Zakat', icon: 'handshake' },
  { value: 'masjid-fund', label: 'Masjid Fund', icon: 'mosque' },
]

const presetAmounts = [500, 1000, 5000, 10000]

export default function Donate() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useUI()

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setShowSuccess(true)
      setTransactionId('Stripe Payment Completed')
      showToast('Donation processed successfully. JazakAllah Khair!', 'success')
      setSearchParams({}, { replace: true })
    } else if (searchParams.get('canceled') === '1') {
      showToast('Donation was canceled. You were not charged.', 'warning')
      setSearchParams({}, { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [donationData, setDonationData] = useState({
    amount: 1000,
    customAmount: '',
    type: 'sadaqah',
    donorName: '',
    email: '',
    phone: '',
    isAnonymous: false,
  })
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionId, setTransactionId] = useState('')

  const effectiveAmount = useMemo(() => {
    if (donationData.customAmount && Number(donationData.customAmount) > 0) {
      return Number(donationData.customAmount)
    }
    return Number(donationData.amount)
  }, [donationData.amount, donationData.customAmount])

  const handlePresetAmount = (value) => {
    setDonationData((prev) => ({
      ...prev,
      amount: value,
      customAmount: '',
    }))
  }

  const handleCustomAmount = (value) => {
    setDonationData((prev) => ({
      ...prev,
      customAmount: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (effectiveAmount < 100) {
      showToast('Minimum donation amount is PKR 100', 'warning')
      return
    }

    const mosqueId = getActiveMosqueId()
    if (!mosqueId) {
      showToast('Please select a mosque from the navbar first', 'warning')
      return
    }

    setLoading(true)

    try {
      const backendType = donationData.type === 'zakat'
        ? 'Zakat'
        : donationData.type === 'masjid-fund'
          ? 'Masjid Fund'
          : 'Sadaqah'

      const res = await api.createOnlineDonation({
        donorName: donationData.donorName,
        email: donationData.email,
        phone: donationData.phone,
        amount: effectiveAmount,
        type: backendType,
        isAnonymous: !!donationData.isAnonymous,
        mosqueId,
      })

      if (res.url) {
        window.location.assign(res.url)
        return
      }

      setTransactionId(res.transactionId || 'TXN-PENDING')
      setShowSuccess(true)
      showToast('Donation processed successfully. JazakAllah Khair!', 'success')
    } catch (e2) {
      showToast(e2.message || 'Failed to process donation', 'error')
    } finally {
      setLoading(false)
    }
  }

  const closeSuccess = () => {
    setShowSuccess(false)
    setDonationData({
      amount: 1000,
      customAmount: '',
      type: 'sadaqah',
      donorName: '',
      email: '',
      phone: '',
      isAnonymous: false,
    })
  }

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-8">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-[#047857] border border-primary-200">
              <i className="material-icons-round">volunteer_activism</i>
              <span className="text-sm font-semibold uppercase tracking-wide">Sadaqah Jariyah</span>
            </div>

            <h1 className="mt-5 font-primary text-5xl font-bold text-[#064e3b] leading-tight">
              Invest in your <span className="text-[#d4af37]">Akhirah</span>
            </h1>

            <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-2xl">
              Your contributions help maintain the House of Allah, support community services, educational programs, and assist those in need. Every donation makes a difference.
            </p>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-6 text-white relative overflow-hidden">
              <i className="material-icons-round absolute -top-3 right-4 text-[64px] text-white/20">format_quote</i>
              <blockquote className="text-2xl italic leading-relaxed">
                The believer&apos;s shade on the Day of Resurrection will be their charity.
              </blockquote>
              <p className="mt-3 text-white/80">Tirmidhi</p>
            </div>

            <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-4 inline-flex items-center gap-2 text-gray-700">
              <i className="material-icons-round text-[#047857]">phone_in_talk</i>
              <span>
                Need help donating? Call <strong>0321-5551234</strong>
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-5">
              <h2 className="font-primary text-2xl font-bold text-gray-900">Make a Donation</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-[#047857]">
                <i className="material-icons-round text-sm">lock</i>
                Secure Payment
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div>
                <label className="form-label">Select Donation Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {donationTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setDonationData((prev) => ({ ...prev, type: type.value }))}
                      className={`rounded-xl border p-3 text-center transition-all ${
                        donationData.type === type.value
                          ? 'border-[#047857] bg-primary-50 text-[#047857]'
                          : 'border-gray-200 text-gray-700 hover:border-primary-200 hover:bg-primary-50'
                      }`}
                    >
                      <i className="material-icons-round block mb-1">{type.icon}</i>
                      <span className="text-sm font-semibold">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Select Amount</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handlePresetAmount(amount)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                        !donationData.customAmount && Number(donationData.amount) === amount
                          ? 'border-[#047857] bg-[#047857] text-white'
                          : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      Rs. {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="mt-3 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">PKR</span>
                  <input
                    type="number"
                    min="100"
                    className="form-input pl-14"
                    placeholder="Enter custom amount"
                    value={donationData.customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">
                  Your Details <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Optional</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Full Name"
                    value={donationData.donorName}
                    onChange={(e) => setDonationData((prev) => ({ ...prev, donorName: e.target.value }))}
                  />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Phone Number"
                    value={donationData.phone}
                    onChange={(e) => setDonationData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <input
                  type="email"
                  className="form-input mt-3"
                  placeholder="Email (for receipt)"
                  value={donationData.email}
                  onChange={(e) => setDonationData((prev) => ({ ...prev, email: e.target.value }))}
                />
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-[#047857] focus:ring-[#047857]"
                      checked={donationData.isAnonymous || false}
                      onChange={(e) => setDonationData((prev) => ({ ...prev, isAnonymous: e.target.checked }))}
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <i className="material-icons-round text-base text-amber-600">visibility_off</i>
                        Donate Anonymously
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Your name will be shown as &quot;Anonymous&quot; in all donation records and reports</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <i className="material-icons-round text-blue-600 mt-0.5">info</i>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Secure Payment via Stripe</p>
                    <p className="text-xs text-blue-700 mt-1">You will be redirected to Stripe&apos;s secure checkout page to enter your card details. We never see or store your card information.</p>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 bg-[#047857] hover:bg-[#064e3b]">
                <i className="material-icons-round">volunteer_activism</i>
                {loading ? 'Redirecting to Stripe...' : `Donate ${effectiveAmount >= 100 ? 'PKR ' + effectiveAmount.toLocaleString() : 'Now'}`}
              </button>

              <div className="space-y-2 text-center text-xs text-gray-500">
                <p className="inline-flex items-center gap-1"><i className="material-icons-round text-sm">verified_user</i>Secure 256-bit SSL Encrypted Payment via Stripe</p>
                <p>VISA | MasterCard | All major cards accepted</p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 text-center shadow-2xl animate-fade-in-up">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary-50 text-[#047857] flex items-center justify-center">
              <i className="material-icons-round text-5xl">check</i>
            </div>
            <h3 className="mt-5 font-primary text-3xl font-bold text-gray-900">JazakAllah Khair!</h3>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Your donation has been processed successfully. May Allah accept your contribution and reward you abundantly.
            </p>
            <div className="mt-4 inline-flex rounded-xl bg-primary-50 px-4 py-2 text-xl font-bold text-[#047857]">
              {formatCurrency(effectiveAmount)}
            </div>
            <p className="mt-3 text-sm text-gray-600">
              <strong>Transaction ID:</strong> {transactionId}<br />A receipt has been sent to your email address.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to={ROUTES.TRANSPARENCY} className="btn btn-secondary">View Transparency Report</Link>
              <button type="button" className="btn btn-primary bg-[#047857]" onClick={closeSuccess}>Done</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
