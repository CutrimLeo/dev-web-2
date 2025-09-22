// Performance monitoring and optimization for frontend
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTimes: [],
      imageLoadTimes: [],
      errors: [],
    }

    this.init()
  }

  init() {
    // Monitor page load time
    window.addEventListener("load", () => {
      this.metrics.pageLoadTime = performance.now()
      console.log(`[v0] Page loaded in ${this.metrics.pageLoadTime.toFixed(2)}ms`)
    })

    // Monitor API calls
    this.interceptAjax()

    // Monitor image loading
    this.monitorImages()

    // Monitor errors
    this.monitorErrors()

    // Report metrics periodically
    setInterval(() => this.reportMetrics(), 30000) // Every 30 seconds
  }

  interceptAjax() {
    const originalAjax = window.jQuery.ajax
    const self = this

    window.jQuery.ajax = function (options) {
      const startTime = performance.now()
      const url = options.url || ""

      const originalSuccess = options.success
      const originalError = options.error

      options.success = function (data, textStatus, jqXHR) {
        const endTime = performance.now()
        const responseTime = endTime - startTime

        self.metrics.apiResponseTimes.push({
          url,
          responseTime,
          timestamp: Date.now(),
        })

        if (responseTime > 2000) {
          console.warn(`[v0] Slow API call: ${url} took ${responseTime.toFixed(2)}ms`)
        }

        if (originalSuccess) {
          originalSuccess.call(this, data, textStatus, jqXHR)
        }
      }

      options.error = function (jqXHR, textStatus, errorThrown) {
        const endTime = performance.now()
        const responseTime = endTime - startTime

        self.metrics.errors.push({
          type: "ajax",
          url,
          error: errorThrown,
          status: jqXHR.status,
          responseTime,
          timestamp: Date.now(),
        })

        console.error(`[v0] API error: ${url} - ${errorThrown}`)

        if (originalError) {
          originalError.call(this, jqXHR, textStatus, errorThrown)
        }
      }

      return originalAjax.call(this, options)
    }
  }

  monitorImages() {
    

    document.addEventListener("load", (event) => {
      if (event.target.tagName === "IMG") {
        const img = event.target
        const loadTime = performance.now()

        this.metrics.imageLoadTimes.push({
          src: img.src,
          loadTime,
          timestamp: Date.now(),
        })

        if (loadTime > 3000) {
          console.warn(`[v0] Slow image load: ${img.src} took ${loadTime.toFixed(2)}ms`)
        }
      }
    })
  }

  monitorErrors() {
    

    window.addEventListener("error", (event) => {
      this.metrics.errors.push({
        type: "javascript",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
      })

      console.error("[v0] JavaScript error:", event.message)
    })

    window.addEventListener("unhandledrejection", (event) => {
      this.metrics.errors.push({
        type: "promise",
        reason: event.reason,
        timestamp: Date.now(),
      })

      console.error("[v0] Unhandled promise rejection:", event.reason)
    })
  }

  reportMetrics() {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000

    // Filter recent metrics
    const recentApiCalls = this.metrics.apiResponseTimes.filter((call) => call.timestamp > fiveMinutesAgo)

    const recentErrors = this.metrics.errors.filter((error) => error.timestamp > fiveMinutesAgo)

    if (recentApiCalls.length > 0) {
      const avgResponseTime = recentApiCalls.reduce((sum, call) => sum + call.responseTime, 0) / recentApiCalls.length

      console.log(`[v0] Performance Report:
        - API Calls: ${recentApiCalls.length}
        - Avg Response Time: ${avgResponseTime.toFixed(2)}ms
        - Errors: ${recentErrors.length}
      `)
    }

    // Clean old metrics to prevent memory leaks
    this.cleanOldMetrics()
  }

  cleanOldMetrics() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000

    this.metrics.apiResponseTimes = this.metrics.apiResponseTimes.filter((call) => call.timestamp > oneHourAgo)

    this.metrics.imageLoadTimes = this.metrics.imageLoadTimes.filter((img) => img.timestamp > oneHourAgo)

    this.metrics.errors = this.metrics.errors.filter((error) => error.timestamp > oneHourAgo)
  }

  getMetrics() {
    return this.metrics
  }
}

// Image lazy loading optimization
class LazyImageLoader {
  constructor() {
    this.observer = null
    this.init()
  }

  init() {
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
        rootMargin: "50px 0px",
        threshold: 0.01,
      })

      this.observeImages()
    } else {
      // Fallback for older browsers
      this.loadAllImages()
    }
  }

  observeImages() {
    const images = document.querySelectorAll("img[data-src]")
    images.forEach((img) => this.observer.observe(img))
  }

  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        this.loadImage(img)
        this.observer.unobserve(img)
      }
    })
  }

  loadImage(img) {
    const src = img.getAttribute("data-src")
    if (src) {
      img.src = src
      img.removeAttribute("data-src")
      img.classList.add("loaded")
    }
  }

  loadAllImages() {
    const images = document.querySelectorAll("img[data-src]")
    images.forEach((img) => this.loadImage(img))
  }
}

// Initialize performance monitoring
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.performanceMonitor === "undefined") {
    window.performanceMonitor = new PerformanceMonitor()
    window.lazyImageLoader = new LazyImageLoader()

    console.log("[v0] Performance monitoring initialized")
  }
})
