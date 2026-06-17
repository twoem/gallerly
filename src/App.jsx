import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import JSZip from 'jszip'

const TOTAL_IMAGES = 47
const SLIDESHOW_INTERVAL = 4000
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
      size: 12 + Math.random() * 28,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * 15,
      opacity: 0.15 + Math.random() * 0.35,
      rotation: Math.random() * 360,
      sway: 15 + Math.random() * 30,
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
  const [imageLoaded, setImageLoaded] = useState({})
  const [showControls, setShowControls] = useState(true)
  const [slideDirection, setSlideDirection] = useState('next')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const containerRef = useRef(null)
  const slideshowRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const startYRef = useRef(null)

  const floatingElements = useMemo(() => generateFloatingElements(30), [])

  // Save current index to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentIndex.toString())
  }, [currentIndex])

  // Handle slideshow
  useEffect(() => {
    if (isSlideshow) {
      slideshowRef.current = setInterval(() => {
        navigateNext()
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
  }, [isSlideshow, currentIndex])

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
    }, 2500)
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isSlideshow, currentIndex])

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowShareMenu(false)
    if (showShareMenu) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showShareMenu])

  const navigateNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setSlideDirection('next')
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % TOTAL_IMAGES)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 300)
  }, [isTransitioning])

  const navigatePrev = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setSlideDirection('prev')
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + TOTAL_IMAGES) % TOTAL_IMAGES)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 300)
  }, [isTransitioning])

  const goToIndex = useCallback((index) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setSlideDirection(index > currentIndex ? 'next' : 'prev')
    setTimeout(() => {
      setCurrentIndex(index)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 300)
  }, [isTransitioning, currentIndex])

  // Multi-directional touch handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    // Nothing needed here
  }

  const handleTouchEnd = (e) => {
    if (!touchStart || !startYRef.current) return

    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = touchStart - endX
    const deltaY = startYRef.current - endY
    const minSwipeDistance = 50

    // Determine if horizontal or vertical swipe is stronger
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)

    if (isHorizontalSwipe) {
      // Horizontal: Swipe RIGHT = next, LEFT = prev
      if (deltaX > minSwipeDistance) {
        navigateNext()
      } else if (deltaX < -minSwipeDistance) {
        navigatePrev()
      }
    } else {
      // Vertical: Swipe UP = next, DOWN = prev
      if (deltaY > minSwipeDistance) {
        navigateNext()
      } else if (deltaY < -minSwipeDistance) {
        navigatePrev()
      }
    }

    setTouchStart(null)
    startYRef.current = null
  }

  // Mouse handlers for desktop
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setTouchStart(e.clientX)
    startYRef.current = e.clientY
  }

  const handleMouseUp = (e) => {
    if (!touchStart || !startYRef.current) return

    const deltaX = touchStart - e.clientX
    const deltaY = startYRef.current - e.clientY
    const minSwipeDistance = 50

    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)

    if (isHorizontalSwipe) {
      if (deltaX > minSwipeDistance) {
        navigateNext()
      } else if (deltaX < -minSwipeDistance) {
        navigatePrev()
      }
    } else {
      if (deltaY > minSwipeDistance) {
        navigateNext()
      } else if (deltaY < -minSwipeDistance) {
        navigatePrev()
      }
    }

    setTouchStart(null)
    startYRef.current = null
  }

  // Download single image
  const downloadImage = async (index) => {
    const imgNum = index + 1
    const link = document.createElement('a')
    link.href = `/img/${imgNum}.jpeg`
    link.download = `dowry_photo_${imgNum}.jpeg`
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
            zip.file(`dowry_photo_${i}.jpeg`, blob)
          })
        promises.push(promise)
      }

      await Promise.all(promises)
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = 'dowry_gallery.zip'
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

  // Share functionality with rich preview
  const shareImage = async () => {
    const imgUrl = `${window.location.origin}/img/${currentIndex + 1}.jpeg`
    const shareUrl = window.location.href
    const shareTitle = 'Dowry Gallery'
    const shareText = `Check out this beautiful photo (${currentIndex + 1} of ${TOTAL_IMAGES}) from our dowry collection!`

    // Try native share first
    if (navigator.share && navigator.canShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // User cancelled or error
      }
    }

    // Show share menu
    setShowShareMenu(true)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowShareMenu(false)
  }

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Check out this beautiful photo (${currentIndex + 1} of ${TOTAL_IMAGES}) from our dowry collection! ${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setShowShareMenu(false)
  }

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    setShowShareMenu(false)
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Check out photo ${currentIndex + 1} of ${TOTAL_IMAGES} from our dowry gallery!`)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    setShowShareMenu(false)
  }

  const shareToTelegram = () => {
    const text = encodeURIComponent(`Check out this beautiful photo (${currentIndex + 1} of ${TOTAL_IMAGES}) from our dowry collection!`)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank')
    setShowShareMenu(false)
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
        navigateNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        navigatePrev()
      } else if (e.key === ' ') {
        e.preventDefault()
        toggleSlideshow()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateNext, navigatePrev])

  // Initial load
  useEffect(() => {
    const img = new Image()
    img.src = `/img/${currentIndex + 1}.jpeg`
    img.onload = () => setIsLoading(false)
  }, [])

  // Get transition styles based on direction
  const getTransitionStyle = () => {
    if (!isTransitioning) return {}

    if (slideDirection === 'next') {
      return {
        transform: 'translateX(-100px) scale(0.9)',
        opacity: 0,
      }
    } else {
      return {
        transform: 'translateX(100px) scale(0.9)',
        opacity: 0,
      }
    }
  }

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
      </header>

      {/* Action buttons row */}
      <div style={{
        ...styles.actionRow,
        opacity: showControls ? 1 : 0,
      }}>
        <button
          onClick={toggleSlideshow}
          style={{
            ...styles.iconBtn,
            ...styles.slideshowBtn,
          }}
          title={isSlideshow ? 'Pause' : 'Play'}
        >
          {isSlideshow ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        <button
          onClick={shareImage}
          style={{ ...styles.iconBtn, ...styles.shareBtn }}
          title="Share"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        <button
          onClick={() => downloadImage(currentIndex)}
          style={styles.iconBtn}
          title="Download"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        <button
          onClick={downloadAllImages}
          disabled={isDownloadingAll}
          style={{
            ...styles.iconBtn,
            ...styles.downloadAllBtn,
            opacity: isDownloadingAll ? 0.7 : 1
          }}
          title="Download All"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* Share Menu Popup */}
      {showShareMenu && (
        <div style={styles.shareMenu} onClick={e => e.stopPropagation()}>
          <div style={styles.shareMenuHeader}>
            <span>Share this photo</span>
            <button style={styles.closeBtn} onClick={() => setShowShareMenu(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <div style={styles.sharePreview}>
            <img
              src={`/img/${currentIndex + 1}.jpeg`}
              alt={`Photo ${currentIndex + 1}`}
              style={styles.sharePreviewImg}
            />
            <div>
              <div style={styles.sharePreviewTitle}>Photo {currentIndex + 1} of {TOTAL_IMAGES}</div>
              <div style={styles.sharePreviewSub}>Dowry Gallery Collection</div>
            </div>
          </div>

          <div style={styles.shareOptions}>
            <button style={styles.shareOptionBtn} onClick={shareToWhatsApp}>
              <div style={{...styles.shareIcon, background: '#25D366'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <span>WhatsApp</span>
            </button>

            <button style={styles.shareOptionBtn} onClick={shareToFacebook}>
              <div style={{...styles.shareIcon, background: '#1877F2'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span>Facebook</span>
            </button>

            <button style={styles.shareOptionBtn} onClick={shareToTwitter}>
              <div style={{...styles.shareIcon, background: '#000'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span>X (Twitter)</span>
            </button>

            <button style={styles.shareOptionBtn} onClick={shareToTelegram}>
              <div style={{...styles.shareIcon, background: '#0088cc'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.462-1.9-.906-1.056-.697-1.653-1.13-2.678-1.812-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.627z"/>
                </svg>
              </div>
              <span>Telegram</span>
            </button>

            <button style={styles.shareOptionBtn} onClick={copyToClipboard}>
              <div style={{...styles.shareIcon, background: 'linear-gradient(135deg, #ec4899, #f472b6)'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </div>
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Main gallery */}
      <div
        ref={containerRef}
        style={styles.gallery}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setTouchStart(null); startYRef.current = null; }}
      >
        {/* Navigation arrows - Left */}
        <button
          onClick={navigatePrev}
          className="nav-arrow"
          style={{
            ...styles.navArrow,
            ...styles.navArrowLeft,
            opacity: showControls ? 1 : 0
          }}
          aria-label="Previous image"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
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
            ...getTransitionStyle(),
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <img
              key={currentIndex}
              src={`/img/${currentIndex + 1}.jpeg`}
              alt={`Image ${currentIndex + 1}`}
              style={{
                ...styles.image,
                opacity: imageLoaded[currentIndex] ? 1 : 0,
              }}
              onLoad={() => handleImageLoad(currentIndex)}
              draggable={false}
            />
          </div>
        </div>

        {/* Navigation arrows - Right */}
        <button
          onClick={navigateNext}
          className="nav-arrow"
          style={{
            ...styles.navArrow,
            ...styles.navArrowRight,
            opacity: showControls ? 1 : 0
          }}
          aria-label="Next image"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
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
                outline: i === currentIndex ? '2px solid #ec4899' : 'none',
                outlineOffset: '2px',
                opacity: i === currentIndex ? 1 : 0.6,
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
          <span style={styles.slideshowDot}></span>
          <span style={styles.slideshowText}>Playing</span>
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
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)',
    top: '-5%',
    right: '-5%',
    animation: 'orbFloat1 25s ease-in-out infinite',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)',
    bottom: '-10%',
    left: '-5%',
    animation: 'orbFloat2 30s ease-in-out infinite',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'linear-gradient(180deg, rgba(15,10,26,0.98) 0%, rgba(15,10,26,0.8) 70%, transparent 100%)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #fda4af, #f472b6, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.02em',
  },
  counter: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#fdf4ff',
    background: 'linear-gradient(135deg, rgba(236,72,153,0.4), rgba(251,191,36,0.3))',
    padding: '4px 10px',
    borderRadius: '999px',
  },
  actionRow: {
    position: 'absolute',
    top: '52px',
    right: '12px',
    display: 'flex',
    gap: '8px',
    zIndex: 90,
    transition: 'opacity 0.3s ease',
  },
  iconBtn: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(30, 20, 50, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(236,72,153,0.2)',
    borderRadius: '12px',
    color: '#fdf4ff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  slideshowBtn: {
    background: 'linear-gradient(135deg, rgba(236,72,153,0.4), rgba(251,191,36,0.3))',
    border: '1px solid rgba(236,72,153,0.3)',
  },
  shareBtn: {
    background: 'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(5,150,105,0.3))',
    border: '1px solid rgba(16,185,129,0.3)',
  },
  downloadAllBtn: {
    background: 'linear-gradient(135deg, rgba(16,185,129,0.5), rgba(5,150,105,0.4))',
    border: '1px solid rgba(16,185,129,0.3)',
  },
  shareMenu: {
    position: 'fixed',
    bottom: '80px',
    left: '16px',
    right: '16px',
    background: 'rgba(20, 12, 40, 0.98)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '16px',
    zIndex: 200,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    border: '1px solid rgba(236,72,153,0.2)',
  },
  shareMenuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    color: '#fdf4ff',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
  },
  sharePreview: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  sharePreviewImg: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  sharePreviewTitle: {
    color: '#fdf4ff',
    fontWeight: '600',
    marginBottom: '4px',
  },
  sharePreviewSub: {
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
  shareOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  shareOptionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 8px',
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    borderRadius: '12px',
    color: '#fdf4ff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.75rem',
  },
  shareIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallery: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '70px 12px 90px',
    cursor: 'grab',
    userSelect: 'none',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageFrame: {
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 'calc(100vh - 180px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(251,191,36,0.15), rgba(16,185,129,0.15))',
    borderRadius: '12px',
    boxShadow: '0 15px 50px rgba(236,72,153,0.15), 0 8px 24px rgba(0,0,0,0.3)',
  },
  image: {
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 200px)',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '10px',
    transition: 'opacity 0.3s ease',
    display: 'block',
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
    border: '3px solid rgba(236,72,153,0.2)',
    borderTopColor: '#ec4899',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(30, 20, 50, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(236,72,153,0.25)',
    borderRadius: '50%',
    color: '#fdf4ff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 24px rgba(236,72,153,0.15)',
    zIndex: 20,
  },
  navArrowLeft: {
    left: '12px',
  },
  navArrowRight: {
    right: '12px',
  },
  thumbnailStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 0 16px',
    background: 'linear-gradient(0deg, rgba(15,10,26,0.98) 0%, rgba(15,10,26,0.9) 60%, transparent 100%)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    zIndex: 100,
  },
  thumbnailContainer: {
    display: 'flex',
    gap: '8px',
    padding: '0 14px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
    msOverflowStyle: 'none',
  },
  thumbnail: {
    flexShrink: 0,
    padding: 0,
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.22s ease',
    overflow: 'hidden',
    boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
  },
  thumbnailImg: {
    width: '56px',
    height: '56px',
    objectFit: 'cover',
    display: 'block',
    borderRadius: '6px',
  },
  slideshowIndicator: {
    position: 'absolute',
    bottom: '90px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(5,150,105,0.3))',
    backdropFilter: 'blur(12px)',
    padding: '8px 18px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 6px 24px rgba(16,185,129,0.2)',
    border: '1px solid rgba(16,185,129,0.25)',
  },
  slideshowDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  slideshowText: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
}

export default App
