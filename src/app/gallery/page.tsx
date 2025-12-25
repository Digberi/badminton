'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Photo {
  id: string
  title: string
  description: string | null
  imageUrl: string
  createdAt: string
  uploadedBy: {
    name: string | null
    email: string
  }
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos')
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading photos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Badminton Gallery
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Photo Gallery</h1>
        
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No photos yet</p>
            <p className="text-gray-500 mt-2">Check back later for updates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative h-64">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {photo.title}
                  </h3>
                  {photo.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {photo.description}
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    by {photo.uploadedBy.name || photo.uploadedBy.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-5xl w-full">
            <div className="relative h-[80vh]">
              <Image
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            <div className="text-white mt-4">
              <h2 className="text-2xl font-bold">{selectedPhoto.title}</h2>
              {selectedPhoto.description && (
                <p className="text-gray-300 mt-2">{selectedPhoto.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
