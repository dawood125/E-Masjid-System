import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMosque } from '../../hooks/useMosque.js'
import { ROUTES } from '../../utils/constants.js'

export default function HeroSection() {
  const { activeMosque } = useMosque()
  const [videoFailed, setVideoFailed] = useState(false)
  const [showVideo, setShowVideo] = useState(true)

  
  
  
  const handleVideoError = () => {
    setVideoFailed(true)
  }

  return (
    <section className="relative h-[620px] md:h-[720px] overflow-hidden flex items-center justify-center bg-[#064e3b]">

      {!videoFailed && showVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/images/hero/hero-desktop.jpg"
          onError={handleVideoError}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/assets/images/hero/hero-loop.mp4" type="video/mp4" />
        </video>
      )}

      <img
        src="/assets/images/hero/hero-desktop.jpg"
        alt="Beautiful Pakistani mosque at golden hour"
        className={`absolute inset-0 h-full w-full object-cover ${(!showVideo || videoFailed) ? 'animate-ken-burns' : ''}`}
        loading="eager"
        onError={() => setShowVideo(false)}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b]/90 via-[#064e3b]/75 to-[#047857]/60" />

      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M40 0l8 16 16 8-16 8-8 16-8-16-16-8 16-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 container text-center py-14 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 backdrop-blur mb-6">
          <span className="h-2 w-2 rounded-full bg-[#d4af37] animate-pulse" />
          <span className="text-xs sm:text-sm tracking-wide font-semibold uppercase text-white">
            Serving the Community Since 1985
          </span>
        </div>

        <h1 className="font-primary text-white text-4xl md:text-6xl font-bold leading-tight drop-shadow-lg">
          Connect. Pray.{' '}
          <span className="text-[#d4af37]">Give back.</span>
        </h1>

        <p className="mt-3 text-base sm:text-lg text-white/80 font-medium">
          Welcome to {activeMosque?.name || 'E-Masjid'}
          {activeMosque?.city ? <span className="text-white/60"> · {activeMosque.city}</span> : null}
        </p>

        <p className="mt-5 mx-auto max-w-3xl text-lg md:text-xl text-white/90 leading-relaxed">
          Connecting hearts through faith, prayer, and community service. Your trusted digital platform for all mosque services.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to={ROUTES.DONATE}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-[#d4af37] text-[#1f2937] border-2 border-[#d4af37] hover:bg-[#b7791f] hover:border-[#b7791f] shadow-lg hover:shadow-xl transition-all"
          >
            <i className="material-icons-round text-xl">volunteer_activism</i>
            Donate Now
          </Link>
          <Link
            to={ROUTES.FUND_REQUEST}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#047857] transition-all"
          >
            <i className="material-icons-round text-xl">request_quote</i>
            Submit Fund Request
          </Link>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <i className="material-icons-round text-3xl">keyboard_arrow_down</i>
        </div>
      </div>
    </section>
  )
}
