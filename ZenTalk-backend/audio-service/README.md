# ZenTalk Audio Service

## Features

- JWT Authentication
- Redis Queue
- Redis Pub/Sub
- Redisson Distributed Lock
- WebSocket STOMP
- WebRTC Signaling
- Audio Call Management
- Call Logs
- Flyway Migration
- Docker Ready
- Spring Boot 3
- Java 21

---

## Tech Stack

- Java 21
- Spring Boot 3
- Spring Security
- Spring WebSocket
- Spring Data JPA
- MySQL
- Redis
- Redisson
- Flyway

---

## Run

```bash
mvn clean package
```

```bash
docker build -t audio-service .
```

```bash
docker run -p 8082:8082 audio-service
```