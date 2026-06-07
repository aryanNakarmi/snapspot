import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SnapSpot
            </span>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/organizer/create" 
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition"
            >
              Create Event
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Share Event Photos
          <br />
          Instantly with QR Codes
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          No app downloads. No logins. Just scan, snap, and share.
          Perfect for weddings, parties, and college events.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link 
            href="/organizer/create" 
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg rounded-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Create Your Event
          </Link>
          <Link 
            href="#how-it-works" 
            className="px-8 py-4 border-2 border-indigo-500 text-indigo-600 text-lg rounded-lg hover:bg-indigo-50 transition"
          >
            How It Works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">1️⃣</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Create Event</h3>
            <p className="text-gray-600">
              Set up your event in seconds. Get a unique QR code and shareable link.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">2️⃣</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Guests Scan & Share</h3>
            <p className="text-gray-600">
              Guests scan the QR code and start uploading photos directly from their phones.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">3️⃣</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Live Gallery</h3>
            <p className="text-gray-600">
              Watch photos appear in real-time. Everyone sees the same live gallery.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Create your first event in under a minute
          </p>
          <Link 
            href="/organizer/create" 
            className="inline-block px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Create Event Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 SnapSpot. Made with ❤️ for event memories.</p>
      </footer>
    </main>
  );
}
