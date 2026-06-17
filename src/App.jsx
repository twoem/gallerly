import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import JSZip from 'jszip'

const TOTAL_IMAGES = 47
const SLIDESHOW_INTERVAL = 3000
const STORAGE_KEY = 'gallery_last_index'

// Generate floating elements data
const generateFloatingElements = (count) => {
  const elements = []
  for (let i = 0; i < count; i++) {
    elements.push({
      id: i,
      type: ['flower', 'petal', 'sparkle', 'leaf', 'heart', 'star'][Math.floor(Math.random() * 6)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 15 + Math.random() * 35,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * 15,
      opacity: 0.2 + Math.random() * 0.5,
      rotation: Math.random() * 360,
      sway: 20 + Math.random() * 40,
    })
  }
  return elements
}

const FloatingElement = ({ element }) => {
  const shapes = {
    flower: (
      <svg viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="30" r="18" opacity="0.9" />
        <circle cx="30" cy="50" r="18" opacity="0.9" />
        <circle cx="70" cy="50" r="18" opacity="0.9" />
        <circle cx="38" cy="70" r="18" opacity="0.9" />
        <circle cx="62" cy="70" r="18" opacity="0.9" />
        <circle cx="50" cy="50" r="12" fill="#fbbf24" />
      </svg>
    ),
    petal: (
      <svg viewBox="0 0 100 100" fill="currentColor">
        <ellipse cx="50" cy="50" rx="25" ry="45" transform="rotate(-30 50 50)" />
      </svg>
    ),
    sparkle: (
      <svg viewBox="0 0 100 100" fill="currentColor">
        <polygon points="50,0 55,40 95,50 55,60 50,100 45,60 5,50 45,40" />
      </svg>
    ),
    leaf: (
      <svg viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 5 C80 20, 95 60, 50 95 C5 60, 20 20, 50 5 Z" />
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 88 C20 60, 5 35, 25 18 C40 8, 50 20, 50 20 C50 20, 60 8, 75 18 C95 35, 80 60, 50 88Z" />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 100 100" fill="currentColor">
        <polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" />
      </svg>
    ),
  }

  const colors = ['#f472b6', '#fb7185', '#fbbf24', '#fcd34d', '#a3e635', '#bef264', '#fda4af', '#f9a8d4', '#fecaca']

  return (
    <div
      className="floating-element"
      style={{
        position: 'absolute',
        left: `${element.left}%`,
        top: `${element.top}%`,
        width: element.size,
        height: element.size,
        color: colors[element.id % colors.length],
        opacity: element.opacity,
        transform: `rotate(${element.rotation}deg)`,
        '--duration': `${element.duration}s`,
        '--delay': `${element.delay}s`,
        '--sway': `${element.sway}px`,
        pointerEvents: 'none',
      }}
    >
      {shapes[element.type]}
    </div>
  )
}

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
  const [imageAnimating, setImageAnimating] = useState(false)

  const containerRef = useRef(null)
  const slideshowRef = useRef(null)
  const controlsTimeoutRef = useRef(null)

  const floatingElements = useMemo(() => generateFloatingElements(40), [])

  // Save current index to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentIndex.toString())
  }, [currentIndex])

  // Handle slideshow
  useEffect(() => {
    if (isSlideshow) {
      slideshowRef.current = setInterval(() => {
        setImageAnimating(true)
        setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % TOTAL_IMAGES)
          setImageAnimating(false)
        }, 300)
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
    setImageAnimating(true)
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % TOTAL_IMAGES)
      setImageAnimating(false)
    }, 200)
  }, [])

  const goToPrev = useCallback(() => {
    setImageAnimating(true)
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + TOTAL_IMAGES) % TOTAL_IMAGES)
      setImageAnimating(false)
    }, 200)
  }, [])

  const goToIndex = useCallback((index) => {
    setImageAnimating(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setImageAnimating(false)
    }, 200)
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
      {/* Animated gradient background */}
      <div style={styles.animatedBg} />

      {/* Floating decorative elements */}
      <div style={styles.floatingContainer}>
        {floatingElements.map(el => (
          <FloatingElement key={el.id} element={el} />
        ))}
      </div>

      {/* Glowing orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />
      <div style={styles.orb4} />

      {/* Header */}
      <header style={{
        ...styles.header,
        opacity: showControls ? 1 : 0,
        transform: showControls ? 'translateY(0)' : 'translateY(-100%)'
      }}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Dowry Gallery</h1>
          <span style={styles.counter}>{currentIndex + 1} / {TOTAL_IMAGES}</span>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={toggleSlideshow}
            style={{
              ...styles.slideshowBtn,
              background: isSlideshow ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ec4899, #db2777)'
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
          className="nav-arrow"
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
          <div style={{
            ...styles.imageFrame,
            transform: imageAnimating ? 'scale(0.95)' : 'scale(1)',
            opacity: imageAnimating ? 0.5 : 1
          }}>
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
        </div>

        {/* Navigation arrows - Right */}
        <button
          onClick={goToNext}
          className="nav-arrow"
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
                border: i === currentIndex ? '3px solid #ec4899' : '2px solid rgba(255,255,255,0.2)',
                opacity: i === currentIndex ? 1 : 0.7,
                transform: i === currentIndex ? 'scale(1.1)' : 'scale(1)'
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
    background: '#0f0a1a',
  },
  animatedBg: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 25%, #0f0a1a 50%, #1a0a2e 75%, #2d1b4e 100%)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 20s ease infinite',
  },
  floatingContainer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  orb1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
    top: '-10%',
    right: '-10%',
    animation: 'orbFloat1 25s ease-in-out infinite',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
    bottom: '-15%',
    left: '-10%',
    animation: 'orbFloat2 30s ease-in-out infinite',
    pointerEvents: 'none',
  },
  orb3: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
    top: '30%',
    left: '10%',
    animation: 'orbFloat3 22s ease-in-out infinite',
    pointerEvents: 'none',
  },
  orb4: {
    position: 'absolute',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(249,168,212,0.25) 0%, transparent 70%)',
    top: '60%',
    right: '15%',
    animation: 'orbFloat4 28s ease-in-out infinite',
    pointerEvents: 'none',
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
    background: 'linear-gradient(180deg, rgba(15,10,26,0.95) 0%, transparent 100%)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #fda4af, #f472b6, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.02em',
  },
  counter: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#fdf4ff',
    background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(251,191,36,0.2))',
    padding: '8px 16px',
    borderRadius: '999px',
    border: '1px solid rgba(236,72,153,0.3)',
  },
  slideshowBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 18px',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(236,72,153,0.3)',
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 18px',
    background: 'linear-gradient(135deg, rgba(100,116,139,0.8), rgba(71,85,105,0.8))',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  downloadAllBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 18px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
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
    padding: '100px 24px 120px',
    cursor: 'grab',
    userSelect: 'none',
  },
  imageWrapper: {
    maxWidth: 'calc(100vw - 100px)',
    maxHeight: 'calc(100vh - 280px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageFrame: {
    padding: '8px',
    background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(251,191,36,0.2), rgba(16,185,129,0.2))',
    borderRadius: '16px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 25px 80px rgba(236,72,153,0.2), 0 15px 40px rgba(0,0,0,0.3)',
  },
  image: {
    maxWidth: 'calc(100vw - 120px)',
    maxHeight: 'calc(100vh - 300px)',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '12px',
    transition: 'opacity 0.4s ease',
    display: 'block',
  },
  loader: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '56px',
    height: '56px',
    border: '4px solid rgba(236,72,153,0.2)',
    borderTopColor: '#ec4899',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(251,191,36,0.1))',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(236,72,153,0.3)',
    borderRadius: '50%',
    color: '#fdf4ff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px rgba(236,72,153,0.2)',
    zIndex: 20,
  },
  navArrowLeft: {
    left: '24px',
  },
  navArrowRight: {
    right: '24px',
  },
  thumbnailStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px 0 24px',
    background: 'linear-gradient(0deg, rgba(15,10,26,0.98) 0%, transparent 100%)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    zIndex: 100,
  },
  thumbnailContainer: {
    display: 'flex',
    gap: '10px',
    padding: '0 28px',
    overflowX: 'auto',
    scrollbarWidth: 'thin',
    WebkitOverflowScrolling: 'touch',
  },
  thumbnail: {
    flexShrink: 0,
    padding: 0,
    background: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  thumbnailImg: {
    width: '65px',
    height: '65px',
    objectFit: 'cover',
    display: 'block',
    borderRadius: '8px',
  },
  slideshowIndicator: {
    position: 'absolute',
    bottom: '110px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.2))',
    backdropFilter: 'blur(12px)',
    padding: '10px 24px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 8px 32px rgba(16,185,129,0.2)',
    border: '1px solid rgba(16,185,129,0.3)',
  },
  slideshowText: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  slideshowProgress: {
    width: '30px',
    height: '4px',
    background: 'rgba(16,185,129,0.3)',
    borderRadius: '999px',
    position: 'relative',
    overflow: 'hidden',
  },
}

export default App


export default App