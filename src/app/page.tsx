import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Badminton Photo Gallery
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Share and view badminton event photos
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/gallery"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Gallery
            </Link>
            <Link
              href="/admin"
              className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
            >
              Admin Panel
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Upload Photos</h3>
              <p className="text-gray-600">
                Admins can easily upload photos from events
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Browse Gallery</h3>
              <p className="text-gray-600">
                Users can view all uploaded photos
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Secure</h3>
              <p className="text-gray-600">
                Protected with authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
