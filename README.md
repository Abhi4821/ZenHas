# ZenTalk

> **Real-Time Communication Platform with Audio Call, Video Call, and AI Chat**

ZenTalk is a real-time communication platform designed to allow users to connect with each other through **audio calls, video calls, and AI-powered conversations**.

The application is built using a **microservices architecture** with Spring Boot and uses **WebRTC** for peer-to-peer real-time communication, **WebSocket/STOMP** for signaling and real-time events, and **Redis** for queue management, pending requests, distributed locking, and event propagation.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Application Flow](#application-flow)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Microservices](#microservices)
- [Authentication & Security](#authentication--security)
- [Audio Call](#audio-call)
- [Video Call](#video-call)
- [AI Chat](#ai-chat)
- [Redis](#redis)
- [WebRTC](#webrtc)
- [WebSocket & STOMP](#websocket--stomp)
- [AWS](#aws)
- [Database](#database)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Docker](#docker)
- [Kubernetes](#kubernetes)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

# Overview

ZenTalk provides a platform where registered users can discover other users and establish real-time communication sessions.

The platform currently contains three primary communication options:

```text
                 ┌─────────────────────┐
                 │       ZenTalk       │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     Audio Call        Video Call          AI Chat
```

After authentication, the user reaches the ZenTalk dashboard and can select one of the available communication modes.

Users can enter a waiting room, view available users, send connection requests, accept/reject requests, and establish a real-time communication session.

---

# Features

## User Management

- User registration
- Email-based unique identity
- User login
- JWT authentication
- Profile image
- Gender
- Country
- City
- Secure authentication token management

## Audio Call

- Audio communication
- User waiting queue
- Real-time user snapshot
- Connection requests
- Accept/reject functionality
- Call session management
- WebSocket events
- Redis-based queue management

## Video Call

- Real-time video communication
- Audio + video support
- WebRTC peer-to-peer communication
- SDP offer/answer exchange
- ICE candidate exchange
- WebSocket signaling
- Connection request management
- Call session management
- Redis-backed waiting room

## AI Chat

- AI-powered communication
- Real-time conversation architecture
- Dedicated AI communication module

## Infrastructure

- Spring Boot
- Spring Cloud / Microservices
- API Gateway
- Redis
- PostgreSQL / RDS
- AWS S3
- WebRTC
- WebSocket
- STOMP
- Docker
- Kubernetes
- AWS

---

# Application Flow

## 1. Registration

A new user registers with:

```text
Email
Gender
Profile Image
Country
City
```

The email is treated as the user's unique identity.

---

## 2. Login

The user logs into ZenTalk.

```text
Client
   │
   ▼
API Gateway
   │
   ▼
Auth Service
   │
   ▼
Validate Credentials
   │
   ▼
Generate JWT
   │
   ▼
Client
```

The client uses the JWT for authenticated API requests.

---

## 3. Dashboard

After successful login, the user sees:

```text
┌───────────────────────────────┐
│          ZenTalk              │
├───────────────────────────────┤
│                               │
│       🎧 Audio Call           │
│                               │
│       📹 Video Call           │
│                               │
│       🤖 AI Chat              │
│                               │
└───────────────────────────────┘
```

---

## 4. Waiting Room

When a user selects Audio Call or Video Call, the user enters the corresponding waiting queue.

Example:

```text
User A
   │
   ▼
Video Call
   │
   ▼
Video Waiting Queue
```

Other users already waiting can be displayed as cards.

Example:

```text
┌──────────────────────────────┐
│        Profile Image         │
│                              │
│        Rahul                 │
│        Male                  │
│        Delhi                 │
│                              │
│        [ Connect ]            │
└──────────────────────────────┘
```

User information is retrieved from the user system and profile images can be stored in AWS S3.

---

# Connection Flow

The communication flow is:

```text
User A
  │
  │ Connect
  ▼
User B
  │
  │ Notification
  ▼
┌───────────────┐
│ Accept/Reject │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
Accept     Reject
   │         │
   ▼         ▼
Create      Request
Session     Rejected
   │
   ▼
WebRTC Signaling
   │
   ▼
P2P Connection
   │
   ▼
Audio / Video
```

---

# Architecture

ZenTalk follows a microservices architecture.

```text
                         ┌─────────────────┐
                         │     Client      │
                         │ Web / Mobile    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   API Gateway   │
                         │     :8080       │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
       ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
       │ Auth/User   │     │    Video    │     │    Audio    │
       │  Service    │     │   Service   │     │   Service   │
       │    :8081    │     │    :????    │     │    :8082    │
       └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
              │                   │                   │
              │                   │                   │
              ▼                   ▼                   ▼
          ┌───────┐           ┌───────┐           ┌───────┐
          │  RDS  │           │ Redis │           │ Redis │
          └───────┘           └───────┘           └───────┘

                                  │
                                  ▼
                              ┌───────┐
                              │WebRTC │
                              └───────┘

                                  │
                                  ▼
                             ┌─────────┐
                             │ AWS S3  │
                             └─────────┘
```

> Service ports can be configured through environment variables and application configuration.

---

# Technology Stack

| Category | Technology |
|---|---|
| Backend | Java |
| Framework | Spring Boot |
| Architecture | Microservices |
| API Gateway | Spring Cloud Gateway |
| Security | Spring Security |
| Authentication | JWT |
| Database | PostgreSQL |
| Cloud Database | AWS RDS |
| Cache / Queue | Redis |
| Distributed Lock | Redisson |
| Object Storage | AWS S3 |
| Real-Time Communication | WebRTC |
| Signaling | WebSocket |
| Messaging Protocol | STOMP |
| Containerization | Docker |
| Orchestration | Kubernetes |
| Cloud | AWS |
| API Testing | Postman |

---

# Microservices

ZenTalk is divided into independent services.

## Auth Service

Responsible for:

- User registration
- Login
- JWT generation
- Token validation
- Token persistence
- Token revocation
- User-related authentication data

---

## Audio Service

Responsible for:

- Audio waiting room
- Queue management
- Connection requests
- Call sessions
- Audio signaling
- Redis events
- WebSocket communication

---

## Video Service

Responsible for:

- Video waiting room
- Video connection requests
- Video sessions
- WebRTC signaling
- SDP offer/answer
- ICE candidates
- WebSocket communication
- Redis queue/event management

---

## AI Chat Service

Responsible for:

- AI conversation
- AI session management
- Real-time AI interaction

---

# Authentication & Security

All APIs are secured using JWT authentication by default.

The expected flow is:

```text
Client
   │
   │ Authorization: Bearer <JWT>
   ▼
API Gateway
   │
   ▼
Microservice
   │
   ▼
JWT Filter
   │
   ▼
Validate Token
   │
   ▼
Authenticated User
```

## Authorization Header

Authenticated requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## JWT

The JWT contains the user identity.

The JWT subject is used as the authenticated user ID.

Example:

```text
JWT
 │
 └── subject = userId
```

---

## Token Validation

ZenTalk validates:

1. JWT signature
2. JWT expiration
3. Token existence
4. Token revocation status

The system also stores a SHA-256 hash of the token for server-side token tracking.

---

# WebSocket Authentication

WebSocket connections require JWT authentication.

The WebSocket handshake can pass the JWT through the connection request.

Example:

```text
/ws?token=<JWT>
```

The handshake interceptor validates the JWT and associates the WebSocket connection with the authenticated user.

---

# Audio Call

The Audio Service provides a matchmaking system.

## Queue

Users can enter the audio queue:

```http
POST /api/v1/rooms/enter
```

Get queue information:

```http
GET /api/v1/rooms/snapshot
```

Leave the queue:

```http
POST /api/v1/rooms/exit
```

---

## Audio Connection

```text
User A
  │
  │ Enter Queue
  ▼
Redis Audio Queue
  │
  │
  ▼
User B
  │
  │ Connect Request
  ▼
Pending Request
  │
  ▼
Accept
  │
  ▼
Create Call Session
  │
  ▼
Real-Time Audio
```

---

# Video Call

Video communication uses WebRTC.

The Video Service is responsible for matchmaking and signaling, while WebRTC handles the actual peer-to-peer media connection.

---

## Video Flow

```text
User A                         User B
   │                              │
   │ Enter Video Queue            │
   ├──────────────┐               │
   │              ▼               │
   │         Redis Queue           │
   │                              │
   │ Connect Request              │
   ├─────────────────────────────►│
   │                              │
   │                       Accept Request
   │◄─────────────────────────────┤
   │                              │
   │        Create Session        │
   ├─────────────────────────────►│
   │                              │
   │        WebSocket Signaling   │
   │◄────────────────────────────►│
   │                              │
   │          WebRTC              │
   │◄────────────────────────────►│
   │                              │
   │     Audio + Video P2P        │
   │◄════════════════════════════►│
```

---

# WebRTC

WebRTC provides peer-to-peer real-time media communication.

ZenTalk uses WebRTC for:

- Camera streaming
- Microphone streaming
- Peer-to-peer communication
- SDP negotiation
- ICE candidate exchange

---

## SDP Offer / Answer

The connection negotiation follows:

```text
User A
  │
  │ Create RTCPeerConnection
  │
  │ Create Offer
  ▼
SDP Offer
  │
  │ WebSocket
  ▼
User B
  │
  │ Create Answer
  ▼
SDP Answer
  │
  │ WebSocket
  ▼
User A
```

---

## ICE Candidates

Both users exchange ICE candidates through the signaling server.

```text
User A
   │
   │ ICE Candidate
   ▼
WebSocket Server
   │
   │
   ▼
User B
```

After negotiation, WebRTC attempts to establish the best available peer-to-peer route.

---

# WebSocket & STOMP

WebSocket is used for real-time signaling and application events.

STOMP provides message routing on top of WebSocket.

Example destinations:

```text
/topic/audio/events
/topic/video/events
/topic/call/{roomId}/offer
/topic/call/{roomId}/answer
/topic/call/{roomId}/candidate
```

---

# Redis

Redis is used for high-speed, temporary, distributed communication state.

## Audio Queue

```text
audio:queue
```

A Redis Sorted Set can maintain users waiting in the queue.

---

## Pending Requests

```text
audio:pending
```

Pending connection requests can be stored with a TTL.

---

## Video Queue

The Video Service can use a separate namespace:

```text
video:queue
video:pending
video:events
```

This keeps Audio and Video communication state isolated.

---

# Distributed Locking

Redisson is used for distributed locking.

Distributed locks help prevent race conditions when multiple service instances attempt to modify the same resource.

Example:

```text
User A
   │
   ├─────────────┐
   │             │
Service 1     Service 2
   │             │
   └──────┬──────┘
          │
       Redis Lock
          │
          ▼
     Single Update
```

This is particularly useful for:

- Queue operations
- Connection requests
- Session creation
- Duplicate request prevention

---

# Redis Pub/Sub

Redis Pub/Sub can distribute real-time events between service instances.

Example:

```text
Service Instance 1
        │
        ▼
Redis Pub/Sub
        │
        ▼
Service Instance 2
        │
        ▼
WebSocket Clients
```

This allows horizontally scaled services to propagate events.

---

# AWS

ZenTalk is designed to run on AWS infrastructure.

Possible deployment architecture:

```text
                    AWS
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
      EKS           RDS          S3
 Kubernetes      PostgreSQL   Profile Images
        │
        ▼
 Microservices
        │
        ▼
      Redis
```

---

# AWS S3

S3 is used for user profile images.

Example flow:

```text
Client
  │
  │ Upload Image
  ▼
Backend
  │
  ▼
AWS S3
  │
  ▼
Image URL
  │
  ▼
User Profile
```

The application can store the S3 object reference rather than storing image binary data directly in the relational database.

---

# Database

PostgreSQL is used for persistent application data.

AWS RDS can be used for the production database.

Typical persistent data includes:

- Users
- Authentication tokens
- User profiles
- Sessions
- Connection records
- Communication metadata

Temporary communication state is preferably maintained in Redis.

---

# Project Structure

A typical service structure:

```text
src/
└── main/
    ├── java/
    │   └── com/
    │       └── zentalk/
    │           └── ...
    │
    └── resources/
        ├── application.yml
        └── application.properties
```

A communication service can be organized as:

```text
video-service/
│
├── config/
│   ├── SecurityConfig
│   ├── CorsConfig
│   ├── WebSocketConfig
│   └── RedisConfig
│
├── controller/
│   └── RoomController
│
├── service/
│   ├── RoomQueueService
│   ├── ConnectRequestService
│   └── CallSessionService
│
├── repository/
│   └── ...
│
├── redis/
│   ├── RoomQueueRepository
│   ├── DistributedLockService
│   └── RedisMessageSubscriber
│
├── security/
│   ├── JwtAuthenticationFilter
│   ├── JwtTokenProvider
│   └── JwtHandshakeInterceptor
│
├── websocket/
│   └── SignalingController
│
├── dto/
│   ├── ConnectRequestDto
│   ├── CallEndRequestDto
│   ├── SdpOfferMessage
│   ├── SdpAnswerMessage
│   └── IceCandidateMessage
│
└── entity/
    └── ...
```

---

# API Overview

## Authentication

Example:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
```

---

## Audio

Base URL:

```text
http://localhost:8082
```

### Enter Queue

```http
POST /api/v1/rooms/enter
```

Headers:

```http
Authorization: Bearer <JWT>
```

Body:

```text
No Body
```

---

### Queue Snapshot

```http
GET /api/v1/rooms/snapshot
```

Headers:

```http
Authorization: Bearer <JWT>
```

Example response structure:

```json
{
  "totalUsers": 2,
  "users": [
    {
      "userId": "user-001",
      "username": "Rahul",
      "profileImage": "https://...",
      "communicationSeconds": 120
    }
  ]
}
```

---

### Exit Queue

```http
POST /api/v1/rooms/exit
```

Headers:

```http
Authorization: Bearer <JWT>
```

Body:

```text
No Body
```

---

# API Security

Except for the explicitly configured testing/public endpoint, APIs should require:

```http
Authorization: Bearer <JWT>
```

The gateway and individual services should enforce authentication according to the deployment architecture.

---

# Environment Configuration

Do not commit secrets directly into Git.

Recommended environment variables:

```env
JWT_SECRET=your-secret

DB_HOST=localhost
DB_PORT=5432
DB_NAME=zentalk
DB_USERNAME=postgres
DB_PASSWORD=your-password

REDIS_HOST=localhost
REDIS_PORT=6379

AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket
```

For production, secrets should be managed through an appropriate secret-management mechanism rather than stored directly in source code.

---

# Running the Application

## Prerequisites

Install:

- Java 17+
- Maven
- PostgreSQL
- Redis
- Docker
- Docker Compose
- Node.js (if using a separate web frontend)
- Git

---

## Clone Repository

```bash
git clone <repository-url>
cd ZenTalk
```

---

## Start PostgreSQL

Create the required database:

```sql
CREATE DATABASE zentalk;
```

---

## Start Redis

Using Docker:

```bash
docker run -d \
  --name zentalk-redis \
  -p 6379:6379 \
  redis:latest
```

---

## Build Services

```bash
mvn clean install
```

---

## Run Spring Boot Services

Example:

```bash
mvn spring-boot:run
```

Each microservice can be started independently.

---

# Docker

Each microservice can be containerized independently.

Example:

```bash
docker build -t zentalk-auth-service .
```

Run:

```bash
docker run -p 8081:8081 zentalk-auth-service
```

---

# Docker Compose

A complete local environment can contain:

```text
┌─────────────────────────┐
│      Docker Compose     │
├─────────────────────────┤
│ API Gateway             │
│ Auth Service            │
│ Audio Service           │
│ Video Service           │
│ AI Chat Service         │
│ PostgreSQL              │
│ Redis                   │
└─────────────────────────┘
```

Start:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

---

# Kubernetes

Production deployment can use Kubernetes.

Example:

```text
Kubernetes Cluster
│
├── API Gateway
│
├── Auth Service
│
├── Audio Service
│
├── Video Service
│
├── AI Chat Service
│
├── Redis
│
└── Supporting Services
```

Typical Kubernetes resources:

```text
Deployment
Service
ConfigMap
Secret
Ingress
HorizontalPodAutoscaler
```

---

# Scalability

ZenTalk is designed for horizontal scaling.

For example:

```text
                 Load Balancer
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Video-1      Video-2      Video-3
          │            │            │
          └────────────┼────────────┘
                       ▼
                     Redis
```

Redis provides shared temporary state so multiple instances can participate in the same queue and event system.

---

# Real-Time Communication Architecture

ZenTalk separates application signaling from media transport.

```text
                 WebSocket
                    │
                    ▼
              Signaling Server
                    │
          ┌─────────┴─────────┐
          │                   │
       SDP Offer          SDP Answer
          │                   │
          └─────────┬─────────┘
                    │
              ICE Candidates
                    │
                    ▼
                  WebRTC
                    │
             ┌──────┴──────┐
             ▼             ▼
          Audio          Video
```

The backend is responsible for matchmaking, authentication, authorization, session management, and signaling.

The actual audio/video media stream is handled by WebRTC.

---

# Testing

Postman can be used to test REST APIs.

Example:

```text
Base URL:
http://localhost:8082
```

Authenticated request:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

For endpoints that do not require a request body, no body should be sent.

---

# Error Handling

API errors should return a consistent response structure.

Example:

```json
{
  "success": false,
  "message": "Unauthorized request"
}
```

Recommended HTTP status codes:

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict |
| 500 | Internal server error |

---

# Security Considerations

ZenTalk should follow these security principles:

- JWT authentication
- Stateless authentication
- Token expiration
- Token revocation
- SHA-256 token hashing
- HTTPS in production
- Secure WebSocket connections
- CORS configuration
- Environment-based secrets
- AWS IAM policies
- Database credentials outside source code
- Redis authentication in production
- Input validation
- Request authorization
- Rate limiting where appropriate

---

# Development Guidelines

## Backend

Use:

```text
Controller
    ↓
Service
    ↓
Repository
```

Business logic should remain inside service classes rather than controllers.

---

## DTOs

Use DTOs for API and WebSocket messages instead of exposing database entities directly.

Example:

```text
ConnectRequestDto
CallEndRequestDto
SdpOfferMessage
SdpAnswerMessage
IceCandidateMessage
```

---

## Redis

Redis should contain temporary communication state.

Persistent business data should remain in PostgreSQL/RDS.

```text
PostgreSQL
    │
    └── Persistent Data

Redis
    │
    ├── Queue
    ├── Pending Requests
    ├── Locks
    └── Events
```

---

# High-Level Data Flow

```text
                   ┌──────────────┐
                   │    Client    │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ API Gateway  │
                   └──────┬───────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Auth          Audio        Video
          Service       Service      Service
             │            │            │
             ▼            ▼            ▼
            RDS         Redis        Redis
             │
             ▼
          AWS S3

Video/Audio
    │
    ▼
WebSocket / STOMP
    │
    ▼
WebRTC
    │
    ▼
Peer-to-Peer Communication
```

---

# Future Enhancements

Potential future improvements include:

- Group audio calls
- Group video calls
- Screen sharing
- Call recording
- Push notifications
- Online/offline presence
- Typing indicators
- Message history
- User blocking
- User reporting
- Call history
- Advanced matchmaking
- TURN server integration
- Automatic media quality adaptation
- Monitoring and observability
- Distributed tracing
- Prometheus/Grafana integration
- Centralized logging
- CI/CD pipeline
- AWS EKS deployment
- Auto scaling
- Rate limiting
- API documentation with OpenAPI/Swagger

---

# Production Architecture

A production deployment can follow:

```text
                         Internet
                            │
                            ▼
                    ┌───────────────┐
                    │ Load Balancer │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Kubernetes /  │
                    │     EKS       │
                    └───────┬───────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
  API Gateway          Auth Service        Communication
                                             Services
       │                    │                    │
       │                    ▼                    ▼
       │                   RDS                  Redis
       │
       └────────────────────────────────────────┐
                                                │
                                                ▼
                                             AWS S3
```

---

# Project Status

| Module | Status |
|---|---|
| User Registration | ✅ Implemented |
| Authentication | ✅ Implemented |
| JWT Security | ✅ Implemented |
| Audio Call | ✅ Implemented |
| Audio Queue | ✅ Implemented |
| Audio Connection Requests | ✅ Implemented |
| Video Call | 🚧 In Development |
| WebRTC Signaling | 🚧 In Development |
| AI Chat | 🚧 Planned / In Development |
| Docker | 🚧 Integration |
| Kubernetes | 🚧 Deployment |
| AWS Production Deployment | 🚧 Planned |

---

# Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/new-feature
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push the branch.

```bash
git push origin feature/new-feature
```

5. Create a Pull Request.

---

# License

This project is currently a private/proprietary project.

Add the appropriate license information before making the repository publicly available.

---

# ZenTalk

**Real-time communication. One platform. Multiple ways to connect.**

```text
Audio  •  Video  •  AI
```
