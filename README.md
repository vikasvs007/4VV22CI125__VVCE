
URL creation flow
Client → API Gateway → Microservice → Database → Cache → Response

1. Client sends POST /shorturls with URL
2. API Gateway validates rate limits
3. Microservice validates input
4. Generate/validate shortcode
5. Store in PostgreSQL
6. Cache in Redis
7. Return shortened URL

URL flow

Client → API Gateway → Microservice → Cache → Database → Analytics → Redirect

1. Client requests GET /:shortcode
2. Check Redis cache first
3. If miss, query PostgreSQL
4. Validate expiration
5. Record analytics asynchronously
6. Return 301 redirect

analytics flow 

Client → API Gateway → Microservice → Database → Analytics Engine → Response

1. Client requests GET /shorturls/:shortcode
2. Query URL metadata from database
3. Aggregate click data
4. Return analytics JSON