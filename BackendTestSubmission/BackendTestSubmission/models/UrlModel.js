
// models/UrlModel.js
const { nanoid } = require('nanoid');

class UrlModel {
  constructor() {
    // In-memory storage (replace with database in production)
    this.urls = new Map();
    this.analytics = new Map();
  }

  generateShortcode(length = 6) {
    return nanoid(length);
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
    // Alphanumeric, 3-20 characters
    const regex = /^[a-zA-Z0-9]{3,20}$/;
    return regex.test(shortcode);
  }

  createUrl(originalUrl, validityMinutes = 30, customShortcode = null) {
    if (!this.isValidUrl(originalUrl)) {
      throw new Error('Invalid URL format');
    }

    let shortcode = customShortcode;
    
    if (shortcode) {
      if (!this.isValidShortcode(shortcode)) {
        throw new Error('Invalid shortcode format. Must be 3-20 alphanumeric characters.');
      }
      if (this.urls.has(shortcode)) {
        throw new Error('Shortcode already exists. Please choose a different one.');
      }
    } else {
      // Generate unique shortcode
      do {
        shortcode = this.generateShortcode();
      } while (this.urls.has(shortcode));
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + validityMinutes * 60 * 1000);

    const urlData = {
      shortcode,
      originalUrl,
      createdAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      validityMinutes,
      isActive: true
    };

    this.urls.set(shortcode, urlData);
    this.analytics.set(shortcode, {
      totalClicks: 0,
      clicks: []
    });

    return {
      shortcode,
      originalUrl,
      createdAt: urlData.createdAt,
      expiresAt: urlData.expiresAt
    };
  }

  getUrl(shortcode) {
    const urlData = this.urls.get(shortcode);
    if (!urlData) {
      return null;
    }

    // Check if expired
    if (new Date() > new Date(urlData.expiresAt)) {
      urlData.isActive = false;
      return null;
    }

    return urlData;
  }

  recordClick(shortcode, clickData) {
    const analytics = this.analytics.get(shortcode);
    if (analytics) {
      analytics.totalClicks++;
      analytics.clicks.push({
        timestamp: new Date().toISOString(),
        ...clickData
      });
    }
  }

  getAnalytics(shortcode) {
    const urlData = this.urls.get(shortcode);
    const analytics = this.analytics.get(shortcode);
    
    if (!urlData || !analytics) {
      return null;
    }

    return {
      shortcode,
      originalUrl: urlData.originalUrl,
      createdAt: urlData.createdAt,
      expiresAt: urlData.expiresAt,
      totalClicks: analytics.totalClicks,
      isActive: urlData.isActive,
      clicks: analytics.clicks
    };
  }

  // Cleanup expired URLs (call periodically)
  cleanupExpiredUrls() {
    const now = new Date();
    let cleaned = 0;
    
    for (const [shortcode, urlData] of this.urls.entries()) {
      if (new Date(urlData.expiresAt) < now) {
        this.urls.delete(shortcode);
        this.analytics.delete(shortcode);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

module.exports = new UrlModel();