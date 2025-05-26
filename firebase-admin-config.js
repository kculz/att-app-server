// firebase-admin-config.js
const admin = require('firebase-admin');

// Using your service account credentials
const serviceAccount = {
  type: "service_account",
  project_id: "att-app-24fb5",
  private_key_id: "d97077656d608aff20b5c8dad5264d81e26a17b8",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfDYb9A9t87cOK\nHpxsldV6JXvXJRx6JKHNlf9lol6VWn5IYKYt8ZzMUhzGkom7xNjj5zaSdFc1+EFx\n7EYQ5P7LvjhOMKlhfYDXkMtIFXb3ijyATEVL8SXFup0ALpufMytlyPQtcvdhZ0Yl\n6x7NsjHf6kgVDxD3uunNUo9Oz0TGwvFjnQ25ZUst8oqq7PxLj6bJ5fSOuexC/iIt\nJHeE1XMQ7uReECGkthMb3eygC826at07n+7hbcZ52+SB2p7UzHitE0iFJBsefZT9\nb2muij8lmieJoOwR1rcjBlr4gZuyc5o79xv67dGj9XVq+ukM2WX110mhycufMXKs\nMZThkEghAgMBAAECggEAFX4RUSEtZann3u/Q6QYdgDPrLUmIR00vEZcX2UhWVowW\nEb2NWa03q3joiKo/TwpaT0h8ycsfyaWikbp/bFqSYhmxxXf7JDeSggLz0X3u/Q5z\nArZGsZj6h6VSAj3bdTE6J+g/ff8fTuGDgP0ZNl8Knv2tRSky3HoEVApV4HVIlmGt\njtkB52tyAZmwuVUzugdC0rtHxnSQRwHmtpMIe213wqGttefH/hQcdmhkRl20t8sq\nAuAhvpzoVCrMpC8XYAWotU9J6OfkfRxIiiCc28zCj3y9GUQvfPgLRpS3O3mgeSho\nze3e9gaVNbBY6lW/tVBxXSS18UA12wHJ4SaCMnn9qQKBgQD0EfIiQfS+SjrHLQcf\nmiksxsHy38v7+1PtEwwpMwsWbVpxd8HZQEZibr0Cimsk/34hRZwrNrIXeapDksOL\n/2WS3uv26L+JG4VKqyolaPrlCR8k4IcuuTnW7PabsS51VLBF++R1QK345IMPeZx9\nGdUIm9vnAM2Kc22CxZRA/m5O+QKBgQDp9JeRO/whPF58/PSxI7N6CbQsgODdivph\nRTf63wLFBf3EFL+0miqzbVdKUwE0ctSfDhBYzPzXtEOI0u0c9COwhdjTdIU6nTC0\nZVP1KG7Ms1MsDQXyOSh7oNt5cS1WyfeGXQAnlzTgV85bb5DXLtyrZ/7RRu/BCboU\nnydPHUYEaQKBgClLH/xLzGylgmxQYfQm0PCScB33XzuyufBSWKxfxnB07+hiqpln\nFoFw2umjIZ2Q3HYkoNdu2ZK/Mt9b5Vm6TCUdMi8EEePQlCyd6POLX2eAs5Q5qKVv\nESobzV1qDMItIeW1SGHOH6EMiGAF40QHKtPaCsp6iEv0W4LUitC0O1WBAoGBAMdp\nB1dvPXRGtHLsWNQzjeLTKpNUNlYfA1KtYQ2f0AiHFslutggF76eH5wMexMQjrD72\nCdDmyAxDRdz1i81F+rWXIDz78CMJoF3ikDFCCU7I+ndtkkfnmC3n6aoVYYO8GhKY\nam1UYGln7ifZbCc9djFTLsrKH8j1tXmmPicc2HUhAoGBAOs/pnGHMNoqkC3O6h/l\nqHkfKlC2VNDSwD2vaIHouvUG3j2h+UyVvSGWmZtmSd0nIfkfYZhff0J7Dzv/QMvq\n10WCVuYSW9up7MTOh6lO79kGQ43pqMvPiPnhaAO40M45vpYHKxyUa7wJsLaB++EU\nvb8hLICWQyW0vA/Dfyt/zyqE\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@att-app-24fb5.iam.gserviceaccount.com",
  client_id: "110057653993031086683",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40att-app-24fb5.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'att-app-24fb5.firebasestorage.app'
});

module.exports = admin;