'use client'

import React from 'react'
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Slideshow from "yet-another-react-lightbox/plugins/slideshow"
import Captions from "yet-another-react-lightbox/plugins/captions"
import "yet-another-react-lightbox/plugins/captions.css"

interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  images: {
    src: string
    alt?: string
    title?: string
    description?: string
  }[]
  initialIndex?: number
}

export function ImageLightbox({ isOpen, onClose, images, initialIndex = 0 }: ImageLightboxProps) {
  const slides = images.map(img => ({
    src: img.src,
    alt: img.alt,
    title: img.title,
    description: img.description
  }))

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={initialIndex}
      plugins={[Zoom, Fullscreen, Slideshow, Captions]}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true
      }}
      captions={{
        showToggle: true,
        descriptionTextAlign: 'center'
      }}
      carousel={{
        finite: images.length <= 1
      }}
      render={{
        iconPrev: images.length <= 1 ? () => null : undefined,
        iconNext: images.length <= 1 ? () => null : undefined,
      }}
    />
  )
}