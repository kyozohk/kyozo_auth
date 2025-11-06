import "server-only";
import * as admin from "firebase-admin";

const serviceAccount = {
  "type": "service_account",
  "project_id": "kyozo-prod",
  "private_key_id": "3e8bf65fd67b729d1f005e66d62af289197982f6",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQClXfIqnPqSsuA6\ntYOIYWuJ+9W9daqzzgtfbACXRWdVffCm6eI4WOsL9x5lRgA9i8hHPbRygl++RoUp\n/7PuelwYnT0xKO+YP3fFkBKFipEIZzEcNwrP2v6grAXqKt0v1zvfMYt4oFbXXXUR\n3yXrMAU+WjaQ+y1I2yKfqVCg8U6AHmN3vQ/ZtASJIz+rb3S12qGwuI3Kva43Rx78\nDiSxNFhHysbEULretfVQp8Pi2KLkqF60p7SSyi15t3AlwgHrs3YOmAqI67H3/3hJ\nhW+f1pjn8XfB49MrdfAUuc2G2VhtjTdQMvhuos7fru3xpr6sUPXyJtFFNELnsX1B\nRVE8m+/zAgMBAAECggEAB2xVr0sEebeOfQqVenat3jy2f6UIdVgFxt7kXrLOkvxh\nyqRYgG4HzK3NqMv0VwIicR9yE7fXHQWX+0z14nn0qDHN9ubfBoCtQdDLVacYOcsK\nd2x5gqyFqwG92Qd09JPrvwOmC20Rj0sr/6utzWAGkQhGR2QD4hYQK+zTG6TPzZlw\nRyLmypOjB7VEBhz4fdFlMB1ByMV1aHOt7xMTaCFgvsXmDLc2lN8QWxmB0JFMXKsK\nMbyHF+NnE3kNADVN//ZOo6Q+qF8x0CpMGHJXmBwKmLgllPN/9qYdS5w8frlJJYDK\nUX9PQHgS/NhWppA/bwxNZaQxEgqlipDBHr6PB/VWtQKBgQDgYDw+SkfBHGxpIoga\nKOtZa8bXfSmH8octAj6V2brdP44/a0kXAkh2SRSED9tKUV8Y06DZkS6rJ5zMqSQi\nsynlstNxVmAofPUDpBRvqTe+GIM8stqPiRPUTdmHep/q6mODrxxpNtOzXaHDAHmo\n32GnWUSPqctcG6RDbv344Yc39wKBgQC8rJgM1tYsUTvuIJqM+pIRRdG08W5VP70V\nY0AXkJTyHxMzm8j4M2hVaWnV/o8HqxphxUHZ/JzpxUMaxEjjjqi3aH3RTACNX7UY\nBRSMOWDK46icgtMg742hoG/sZ5h0ZYD2SVy8VI7FCTTZPXucaPKBYKCVEolnjHns\nC1awS5gg5QKBgCdn/2yZMxzxVwDn9atSgHMGALgb3U1pBOCcwk0jHjR5UwxEVWPb\nHMrZbub6ufLFc8Qyds9/NgkNPfabxiLqAHO9AnGnT+AMgiOPj59Ewut59qKUbtpC\not7ohUnL+YYSgEPCX2UDIg8gZKaQ0M0d3lK71NS+Z17X4/OL7MLnKQ5lAoGAfOLx\nsm3yTltnA/Ro2LBzRyOj79VvZtZN3n5XykFVlf6jwyF3IXNFuGOSPqfFHRpQ2C6t\nrBDd/I8qH+mVJaskWmK8BXH9W5biVAfo1fiU7TdMQG0IO2DVqwp7i0v3SfR2LI/a\n5n5CEoJJjRJ5Y8rD2oePQ52FfhkqCuhmdUNUa1ECgYBAihU0xvSPU2MFyVGAv6+Y\n9Qgm2QzjS2mcyUwhzQIhF7ovCQ0SiKd0I3YrvWkz9lCUfZxzz1VNkwWEg8e1oX4F\nqqpupu7CDD3J9Q3hqNjZwE1tkjt4wWgGmTox2HWZ/TjZX8kmh4SKFYUyeWYZpWoA\nLTid9aIwBPe7BjZShFc6HA==\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-8ml38@kyozo-prod.iam.gserviceaccount.com",
  "client_id": "109488733821932155311",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-8ml38%40kyozo-prod.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
} as admin.ServiceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const firestore = admin.firestore();