import { useState, useEffect, useRef, useCallback } from 'react'
import JSZip from 'jszip'

const TOTAL_IMAGES = 47
const SLIDESHOW_INTERVAL = 3000
const STORAGE_KEY = 'gallery_last_index'

function App() {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? parseInt(saved, 10) : 0
    return parsed >= 0 && parsed < TOTAL_IMAGES ? parsed : 0
  })
  const [isSlideshow, setIsSlideshow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [imageLoaded, setImageLoaded] = useState({})
  const [showControls, setShowControls] = useState(true)

  const containerRef = useRef(null)
  const slideshowRef = useRef(null)
  const controlsTimeoutRef = useRef(null)

  // Save current index to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentIndex.toString())
  }, [currentIndex])

  // Handle slideshow
  useEffect(() => {
    if (isSlideshow) {
      slideshowRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % TOTAL_IMAGES)
      }, SLIDESHOW_INTERVAL)
    } else {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current)
      }
    }
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current)
      }
    }
  }, [isSlideshow])

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isSlideshow) {
        setShowControls(false)
      }
    }, 3000)
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isSlideshow, currentIndex])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % TOTAL_IMAGES)
  }, [])

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + TOTAL_IMAGES) % TOTAL_IMAGES)
  }, [])

  const goToIndex = useCallback((index) => {
    setCurrentIndex(index)
  }, [])

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      goToNext()
    } else if (distance < -minSwipeDistance) {
      goToPrev()
    }
  }

  // Mouse handlers for desktop
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setTouchEnd(null)
    setTouchStart(e.clientX)
  }

  const handleMouseMove = (e) => {
    if (!touchStart) return
    setTouchEnd(e.clientX)
  }

  const handleMouseUp = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      goToNext()
    } else if (distance < -minSwipeDistance) {
      goToPrev()
    }
    setTouchStart(null)
    setTouchEnd(null)
  }

  // Download single image
  const downloadImage = async (index) => {
    const imgNum = index + 1
    const link = document.createElement('a')
    link.href = `/img/${imgNum}.jpeg`
    link.download = `image_${imgNum}.jpeg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download all images as zip
  const downloadAllImages = async () => {
    setIsDownloadingAll(true)
    try {
      const zip = new JSZip()
      const promises = []

      for (let i = 1; i <= TOTAL_IMAGES; i++) {
        const promise = fetch(`/img/${i}.jpeg`)
          .then(res => res.blob())
          .then(blob => {
            zip.file(`${i}.jpeg`, blob)
          })
        promises.push(promise)
      }

      await Promise.all(promises)
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = 'gallery_images.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading images:', error)
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const toggleSlideshow = () => {
    setIsSlideshow(prev => !prev)
  }

  const handleImageLoad = (index) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }))
    if (index === currentIndex) {
      setIsLoading(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrev()
      } else if (e.key === ' ') {
        e.preventDefault()
        toggleSlideshow()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])

  // Initial load
  useEffect(() => {
    const img = new Image()
    img.src = `/img/${currentIndex + 1}.jpeg`
    img.onload = () => setIsLoading(false)
  }, [])

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{
        ...styles.header,
        opacity: showControls ? 1 : 0,
        transform: showControls ? 'translateY(0)' : 'translateY(-100%)'
      }}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Photo Gallery</h1>
          <span style={styles.counter}>{currentIndex + 1} / {TOTAL_IMAGES}</span>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={toggleSlideshow}
            style={{
              ...styles.slideshowBtn,
              backgroundColor: isSlideshow ? 'var(--success)' : 'var(--primary)'
            }}
            title={isSlideshow ? 'Pause Slideshow' : 'Start Slideshow'}
          >
            {isSlideshow ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <button
            onClick={() => downloadImage(currentIndex)}
            style={styles.downloadBtn}
            title="Download Current Image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span style={styles.downloadBtnText}>Download</span>
          </button>
          <button
            onClick={downloadAllImages}
            disabled={isDownloadingAll}
            style={{
              ...styles.downloadAllBtn,
              opacity: isDownloadingAll ? 0.7 : 1
            }}
            title="Download All Images"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span style={styles.downloadBtnText}>
              {isDownloadingAll ? 'Downloading...' : 'Download All'}
            </span>
          </button>
        </div>
      </header>

      {/* Main gallery */}
      <div
        ref={containerRef}
        style={styles.gallery}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Navigation arrows - Left */}
        <button
          onClick={goToPrev}
          style={{
            ...styles.navArrow,
            ...styles.navArrowLeft,
            opacity: showControls ? 1 : 0
          }}
          aria-label="Previous image"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        {/* Image container */}
        <div style={styles.imageWrapper}>
          {isLoading && (
            <div style={styles.loader}>
              <div style={styles.spinner}></div>
            </div>
          )}
          <img
            src={`/img/${currentIndex + 1}.jpeg`}
            alt={`Image ${currentIndex + 1}`}
            style={{
              ...styles.image,
              opacity: imageLoaded[currentIndex] ? 1 : 0
            }}
            onLoad={() => handleImageLoad(currentIndex)}
            draggable={false}
          />
        </div>

        {/* Navigation arrows - Right */}
        <button
          onClick={goToNext}
          style={{
            ...styles.navArrow,
            ...styles.navArrowRight,
            opacity: showControls ? 1 : 0
          }}
          aria-label="Next image"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>

      {/* Thumbnail strip */}
      <div style={{
        ...styles.thumbnailStrip,
        opacity: showControls ? 1 : 0,
        transform: showControls ? 'translateY(0)' : 'translateY(100%)'
      }}>
        <div style={styles.thumbnailContainer}>
          {Array.from({ length: TOTAL_IMAGES }, (_, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              style={{
                ...styles.thumbnail,
                border: i === currentIndex ? '2px solid var(--primary)' : '2px solid transparent',
                opacity: i === currentIndex ? 1 : 0.6
              }}
              aria-label={`Go to image ${i + 1}`}
            >
              <img
                src={`/img/${i + 1}.jpeg`}
                alt={`Thumbnail ${i + 1}`}
                style={styles.thumbnailImg}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Slideshow mode indicator */}
      {isSlideshow && (
        <div style={styles.slideshowIndicator}>
          <span style={styles.slideshowText}>Slideshow Active</span>
          <div style={styles.slideshowProgress}></div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.9) 0%, transparent 100%)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  counter: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--secondary)',
    background: 'var(--bg-card)',
    padding: '6px 12px',
    borderRadius: '999px',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
  },
  slideshowBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'var(--secondary)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  downloadAllBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'var(--success)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  downloadBtnText: {
    display: 'none',
  },
  gallery: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '80px 20px 100px',
    cursor: 'grab',
    userSelect: 'none',
  },
  imageWrapper: {
    maxWidth: 'calc(100vw - 120px)',
    maxHeight: 'calc(100vh - 200px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 200px)',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: 'var(--shadow)',
    transition: 'opacity 0.3s ease',
  },
  loader: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(8px)',
    border: 'none',
    borderRadius: '50%',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  navArrowLeft: {
    left: '20px',
  },
  navArrowRight: {
    right: '20px',
  },
  thumbnailStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 0',
    background: 'linear-gradient(0deg, rgba(2, 6, 23, 0.95) 0%, transparent 100%)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    zIndex: 100,
  },
  thumbnailContainer: {
    display: 'flex',
    gap: '8px',
    padding: '0 24px',
    overflowX: 'auto',
    scrollbarWidth: 'thin',
    WebkitOverflowScrolling: 'touch',
  },
  thumbnail: {
    flexShrink: 0,
    padding: 0,
    background: 'none',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    display: 'block',
    borderRadius: '6px',
  },
  slideshowIndicator: {
    position: 'absolute',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--bg-card)',
    backdropFilter: 'blur(8px)',
    padding: '8px 20px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  slideshowText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--success)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  slideshowProgress: {
    width: '24px',
    height: '3px',
    background: 'rgba(16, 185, 129, 0.3)',
    borderRadius: '999px',
    position: 'relative',
  },
}

const globalStyles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (min-width: 640px) {
    ${styles.downloadBtnText} {
      display: block;
    }
  }
`

const styleSheet = document.createElement('style')
styleSheet.innerText = globalStyles
document.head.appendChild(styleSheet)

export default App
