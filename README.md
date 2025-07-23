
## URL Creation Flow
Client → API Gateway → Microservice → Database → Cache → Response

1. Client sends POST /shorturls with URL
2. API Gateway validates rate limits
3. Microservice validates input
4. Generate/validate shortcode
5. Store in NOsql(mongo)
6. Cache in Redis
7. Return shortened URL

![URL Creation Flow](./images/Screenshot%202025-07-23%20125852.png)
![URL Creation Process](./images/Screenshot%202025-07-23%20130044.png)
![URL Creation Details](./images/Screenshot%202025-07-23%20130118.png)

## URL Redirection Flow
Client → API Gateway → Microservice → Cache → Database → Analytics → Redirect

1. Client requests GET /:shortcode
2. Check Redis cache first
3. If miss, query PostgreSQL
4. Validate expiration
5. Record analytics asynchronously
6. Return 301 redirect

![URL Redirection Flow](./images/Screenshot%202025-07-23%20130405.png)
![URL Redirection Process](./images/Screenshot%202025-07-23%20130415.png)

## Analytics Flow
Client → API Gateway → Microservice → Database → Analytics Engine → Response

1. Client requests GET /shorturls/:shortcode
2. Query URL metadata from database
3. Aggregate click data
4. Return analytics JSON

![Analytics Dashboard](./images/Screenshot%202025-07-23%20130432.png)
![Analytics Details](./images/Screenshot%202025-07-23%20130440.png)
![Analytics Overview](./images/Screenshot%202025-07-23%20130452.png)

## System Architecture


