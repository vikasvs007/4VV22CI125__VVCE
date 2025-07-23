export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortcode: string;
  shortLink: string;
  expiry: string;
  createdAt: string;
  clicks: ClickData[];
  isActive: boolean;
}

export interface ClickData {
  timestamp: string;
  referrer: string;
  location: string;
  userAgent: string;
}

export interface CreateShortUrlRequest {
  url: string;
  validity?: number;
  shortcode?: string;
}

export interface CreateShortUrlResponse {
  shortLink: string;
  expiry: string;
}

export interface ShortUrlStats {
  shortcode: string;
  originalUrl: string;
  shortLink: string;
  totalClicks: number;
  createdAt: string;
  expiry: string;
  isActive: boolean;
  clicks: ClickData[];
}

class UrlShortenerService {
  private readonly STORAGE_KEY = 'affordmed_short_urls';
  private readonly BASE_URL = window.location.origin;

  private getStoredUrls(): ShortUrl[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveUrls(urls: ShortUrl[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(urls));
  }

  private generateShortcode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidShortcode(shortcode: string): boolean {
    return /^[a-zA-Z0-9]{3,20}$/.test(shortcode);
  }

  private isExpired(expiry: string): boolean {
    return new Date() > new Date(expiry);
  }

  private getLocationFromUserAgent(): string {
    // Simulate location detection - in real app, this would use IP geolocation
    const locations = ['New York, US', 'London, UK', 'Mumbai, IN', 'Singapore, SG', 'Sydney, AU'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  async createShortUrl(request: CreateShortUrlRequest): Promise<CreateShortUrlResponse> {
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

    const shortUrl: ShortUrl = {
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

  async getShortUrlStats(shortcode: string): Promise<ShortUrlStats> {
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

  async redirectToOriginalUrl(shortcode: string): Promise<string> {
    const urls = this.getStoredUrls();
    const shortUrl = urls.find(url => url.shortcode === shortcode);

    if (!shortUrl) {
      throw new Error('Short URL not found');
    }

    if (this.isExpired(shortUrl.expiry)) {
      throw new Error('Short URL has expired');
    }

    // Record click
    const clickData: ClickData = {
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'Direct',
      location: this.getLocationFromUserAgent(),
      userAgent: navigator.userAgent
    };

    shortUrl.clicks.push(clickData);
    this.saveUrls(urls);

    return shortUrl.originalUrl;
  }

  async getAllShortUrls(): Promise<ShortUrl[]> {
    return this.getStoredUrls().map(url => ({
      ...url,
      isActive: url.isActive && !this.isExpired(url.expiry)
    }));
  }

  async deleteShortUrl(shortcode: string): Promise<void> {
    const urls = this.getStoredUrls();
    const filteredUrls = urls.filter(url => url.shortcode !== shortcode);
    
    if (urls.length === filteredUrls.length) {
      throw new Error('Short URL not found');
    }
    
    this.saveUrls(filteredUrls);
  }
}

export const urlShortenerService = new UrlShortenerService();