
// routes/redirectRoute.js
const express = require('express');
const { param, validationResult } = require('express-validator');
const geoip = require('geoip-lite');
const UrlModel = require('../models/UrlModel');
const Logger = require('../middleware/logger');

const router = express.Router();

const validateShortcode = [
  param('shortcode')
    .matches(/^[a-zA-Z0-9]{3,20}$/)
    .withMessage('Invalid shortcode format')
];

// Redirect route
router.get('/:shortcode', validateShortcode, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Logger.warn('Validation failed for redirect request', { 
        errors: errors.array(),
        shortcode: req.params.shortcode 
      });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid shortcode format'
      });
    }

    const { shortcode } = req.params;
    
    Logger.info('Redirect request received', { shortcode });

    const urlData = UrlModel.getUrl(shortcode);
    
    if (!urlData || !urlData.isActive) {
      Logger.warn('Shortcode not found or expired for redirect', { shortcode });
      return res.status(404).json({
        error: 'Not Found',
        message: 'Short URL not found or has expired'
      });
    }

    // Record click analytics
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const geo = geoip.lookup(ip);
    const clickData = {
      ip: ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer') || 'Direct',
      location: geo ? {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone
      } : null
    };

    UrlModel.recordClick(shortcode, clickData);

    Logger.info('Redirecting to original URL', { 
      shortcode, 
      originalUrl: urlData.originalUrl,
      userAgent: clickData.userAgent,
      referer: clickData.referer
    });

    // Perform redirect
    res.redirect(301, urlData.originalUrl);
  } catch (error) {
    Logger.error('Error processing redirect', { 
      error: error.message, 
      shortcode: req.params.shortcode 
    });
    next(error);
  }
});

module.exports = router;