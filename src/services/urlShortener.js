// JavaScript version - interfaces converted to JSDoc comments for documentation

/**
 * @typedef {Object} ShortUrl
 * @property {string} id
 * @property {string} originalUrl
 * @property {string} shortcode
 * @property {string} shortLink
 * @property {string} expiry
 * @property {string} createdAt
 * @property {ClickData[]} clicks
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} ClickData
 * @property {string} timestamp
 * @property {string} referrer
 * @property {string} location
 * @property {string} userAgent
 */

/**
 * @typedef {Object} CreateShortUrlRequest
 * @property {string} url
 * @property {number} [validity]
 * @property {string} [shortcode]
 */

/**
 * @typedef {Object} CreateShortUrlResponse
 * @property {string} shortLink
 * @property {string} expiry
 */

/**
 * @typedef {Object} ShortUrlStats
 * @property {string} shortcode
 * @property {string} originalUrl
 * @property {string} shortLink
 * @property {number} totalClicks
 * @property {string} createdAt
 * @property {string} expiry
 * @property {boolean} isActive
 * @property {ClickData[]} clicks
 */

class UrlShortenerService {
  constructor() {
    this.STORAGE_KEY = 'affordmed_short_urls';
    this.BASE_URL = window.location.origin;
  }

  getStoredUrls() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveUrls(urls) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(urls));
  }

  generateShortcode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isValidShortcode(shortcode) {
    return /^[a-zA-Z0-9]{3,20}$/.test(shortcode);
  }

  isExpired(expiry) {
    return new Date() > new Date(expiry);
  }

  getLocationFromUserAgent() {
    // Simulate location detection - in real app, this would use IP geolocation
    const locations = ['New York, US', 'London, UK', 'Mumbai, IN', 'Singapore, SG', 'Sydney, AU'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  async createShortUrl(request) {
    // Validate URL
    if (!this.isValidUrl(request.url)) {
      throw new Error('Invalid URL format');
    }

    const urls = this.getStoredUrls();
    let shortcode = request.shortcode;

    // Validate custom shortcode if provided
    if (shortcode) {
      if (!this.isValidShortcode(shortcode)) {
        throw new Error('Invalid shortcode format. Must be 3-20 alphanumeric characters.');
      }
      
      // Check if shortcode already exists
      if (urls.some(url => url.shortcode === shortcode)) {
        throw new Error('Shortcode already exists. Please choose a different one.');
      }
    } else {
      // Generate unique shortcode
      do {
        shortcode = this.generateShortcode();
      } while (urls.some(url => url.shortcode === shortcode));
    }

    // Calculate expiry (default 30 minutes)
    const validityMinutes = request.validity || 30;
    const expiry = new Date(Date.now() + validityMinutes * 60 * 1000);

    const shortUrl = {
      id: crypto.randomUUID(),
      originalUrl: request.url,
      shortcode,
      shortLink: `${this.BASE_URL}/${shortcode}`,
      expiry: expiry.toISOString(),
      createdAt: new Date().toISOString(),
      clicks: [],
      isActive: true
    };

    urls.push(shortUrl);
    this.saveUrls(urls);

    return {
      shortLink: shortUrl.shortLink,
      expiry: shortUrl.expiry
    };
  }

  async getShortUrlStats(shortcode) {
    const urls = this.getStoredUrls();
    const shortUrl = urls.find(url => url.shortcode === shortcode);

    if (!shortUrl) {
      throw new Error('Short URL not found');
    }

    return {
      shortcode: shortUrl.shortcode,
      originalUrl: shortUrl.originalUrl,
      shortLink: shortUrl.shortLink,
      totalClicks: shortUrl.clicks.length,
      createdAt: shortUrl.createdAt,
      expiry: shortUrl.expiry,
      isActive: shortUrl.isActive && !this.isExpired(shortUrl.expiry),
      clicks: shortUrl.clicks
    };
  }

  async redirectToOriginalUrl(shortcode) {
    const urls = this.getStoredUrls();
    const shortUrl = urls.find(url => url.shortcode === shortcode);

    if (!shortUrl) {
      throw new Error('Short URL not found');
    }

    if (this.isExpired(shortUrl.expiry)) {
      throw new Error('Short URL has expired');
    }

    // Record click
    const clickData = {
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'Direct',
      location: this.getLocationFromUserAgent(),
      userAgent: navigator.userAgent
    };

    shortUrl.clicks.push(clickData);
    this.saveUrls(urls);

    return shortUrl.originalUrl;
  }

  async getAllShortUrls() {
    return this.getStoredUrls().map(url => ({
      ...url,
      isActive: url.isActive && !this.isExpired(url.expiry)
    }));
  }

  async deleteShortUrl(shortcode) {
    const urls = this.getStoredUrls();
    const filteredUrls = urls.filter(url => url.shortcode !== shortcode);
    
    if (urls.length === filteredUrls.length) {
      throw new Error('Short URL not found');
    }
    
    this.saveUrls(filteredUrls);
  }
}

export const urlShortenerService = new UrlShortenerService();