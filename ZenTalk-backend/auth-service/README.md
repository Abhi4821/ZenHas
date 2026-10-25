# ZenTalk auth-service

Spring Boot 4.1 / Java 21 authentication, OTP, JWT, profile, account deletion and location service.

## Before run
1. Create/configure MySQL.
2. Set environment variables shown in `.env.example`.
3. For Gmail SMTP, use an App Password, not your normal Gmail password.
4. Generate a strong random secret of at least 32 bytes and Base64 encode it for `JWT_SECRET`.
5. Run: `mvn spring-boot:run`

## Important location-data note
`V5__seed_development_location.sql` is only a small development seed so the project starts and the cascading APIs can be tested.
For the final all-country/all-state/all-city requirement, import the selected local ODbL-compatible country-state-city dataset into `countries`, `states`, and `cities`.
Do not keep the development seed as the production world-location dataset.

## Main flow
- Registration: check email -> send OTP -> verify OTP -> register -> JWT
- Login: send OTP -> verify OTP -> fresh JWT + existing profile
- Protected: profile read/update/photo, logout, delete-account OTP/verify/delete
- Email is never exposed in an update request and cannot be changed through profile update.
