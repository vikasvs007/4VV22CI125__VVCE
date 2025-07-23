const express = require('express');
const { body, param, validationResult } = require('express-validator');
const UrlModel = require('../models/UrlModel');
const Logger = require('../middleware/logger');

const router = express.Router();

// Validation middleware
const validateCreateUrl = [
  body('url')
    .notEmpty()
    .withMessage('URL is required')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid URL format'),
  body('validity')
    .optional()
    .isInt({ min: 1, max: 525600 }) // Max 1 year in minutes
    .withMessage('Validity must be between 1 and 525600 minutes'),
  body('shortcode')
    .optional()
    .matches(/^[a-zA-Z0-9]{3,20}$/)
    .withMessage('Shortcode must be 3-20 alphanumeric characters')
];

const validateShortcode = [
  param('shortcode')
    .matches(/^[a-zA-Z0-9]{3,20}$/)
    .withMessage('Invalid shortcode format')
];

// Create short URL
router.post('/', validateCreateUrl, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Logger.warn('Validation failed for create URL request', { 
        errors: errors.array(),
        body: req.body 
      });
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { url, validity = 30, shortcode } = req.body;
    
    Logger.info('Creating short URL', { 
      originalUrl: url, 
      validity, 
      customShortcode: shortcode 
    });

    const result = UrlModel.createUrl(url, validity, shortcode);
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    
    const response = {
      shortLink: `${protocol}://${host}/${result.shortcode}`,
      expiry: result.expiresAt
    };

    Logger.info('Short URL created successfully', { 
      shortcode: result.shortcode,
      originalUrl: url 
    });

    res.status(201).json(response);
  } catch (error) {
    Logger.error('Error creating short URL', { 
      error: error.message, 
      body: req.body 
    });
    
    if (error.message.includes('already exists') || 
        error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    
    next(error);
  }
});

// Get URL statistics
router.get('/:shortcode', validateShortcode, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Logger.warn('Validation failed for analytics request', { 
        errors: errors.array(),
        shortcode: req.params.shortcode 
      });
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { shortcode } = req.params;
    
    Logger.info('Fetching analytics for shortcode', { shortcode });

    const analytics = UrlModel.getAnalytics(shortcode);
    
    if (!analytics) {
      Logger.warn('Shortcode not found for analytics', { shortcode });
      return res.status(404).json({
        error: 'Not Found',
        message: 'Shortcode does not exist or has expired'
      });
    }

    Logger.info('Analytics retrieved successfully', { 
      shortcode, 
      totalClicks: analytics.totalClicks 
    });

    res.json(analytics);
  } catch (error) {
    Logger.error('Error fetching analytics', { 
      error: error.message, 
      shortcode: req.params.shortcode 
    });
    next(error);
  }
});

module.exports = router;