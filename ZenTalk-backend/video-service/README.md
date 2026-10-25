# ZenTalk Video Service

Standalone Spring Boot microservice for the Video Call feature.

## Important
This project intentionally uses the existing shared database tables:
- users
- auth_tokens

It creates only:
- video_requests
- video_sessions

Do not create duplicate user/auth tables.

## Default local port
8083

## Environment
Set these before starting:

DB_URL=jdbc:mysql://localhost:3306/zentalk_auth?createDatabaseIfNotExist=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=YOUR_PASSWORD
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=YOUR_BASE64_JWT_SECRET

Optional:
COTURN_ENABLED=false
COTURN_HOST=localhost
COTURN_PORT=3478
COTURN_USERNAME=
COTURN_PASSWORD=

## Build
mvn clean package

## Run
mvn spring-boot:run

or:

java -jar target/video-service-1.0.0.jar

## Public endpoint
GET http://localhost:8083/api/v1/video/health

## JWT endpoints
POST /api/v1/video/rooms/enter
POST /api/v1/video/rooms/exit
GET  /api/v1/video/rooms/snapshot
POST /api/v1/video/rooms/connect
POST /api/v1/video/rooms/accept/{requestId}
POST /api/v1/video/rooms/reject/{requestId}
POST /api/v1/video/rooms/cancel/{requestId}
POST /api/v1/video/call/end

## WebSocket
Endpoint:
ws://localhost:8083/ws/video?token=YOUR_JWT

STOMP destinations:
 /app/offer
 /app/answer
 /app/ice

Subscriptions:
 /topic/video/events
 /topic/video/call/{sessionId}/offer
 /topic/video/call/{sessionId}/answer
 /topic/video/call/{sessionId}/ice

## Request flow
1. Login through the existing Auth Service and obtain JWT.
2. Call /rooms/enter.
3. Call /rooms/snapshot.
4. Send /rooms/connect with targetUserId.
5. Receiver gets REQUEST_RECEIVED on /topic/video/events.
6. Receiver calls /rooms/accept/{requestId} or /rooms/reject/{requestId}.
7. Accept creates a video session and both users leave the queue.
8. Use WebRTC in the client; backend only authenticates and relays signaling.
9. End the call with /api/v1/video/call/end.

## WebRTC
Do not exchange private IP/MAC addresses through the API.
Use browser WebRTC ICE gathering with STUN/TURN as appropriate.
This service is the signaling/control plane.

## Notes
The WebSocket handshake validates JWT signature/expiry. REST requests additionally check the token against auth_tokens and revoked=false.
