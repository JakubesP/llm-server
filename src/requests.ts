import axios from 'axios';
import http from 'http';
import https from 'https';

// Create axios instance with connection pooling and keep-alive
const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 1000, maxSockets: 50 });
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 1000, maxSockets: 50 });

const axiosInstance = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 5000, // 5 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fire-and-forget token streaming to avoid blocking
export const streamToken = (correlationId: string, token?: string): void => {
  const url = `${process.env.NODE_MANAGER_SERVER}/p2p-queue/${correlationId}`;

  // Don't await - fire and forget to avoid blocking generation
  axiosInstance
    .post(url, { text: token ?? '__END__' })
    .catch((err) => {
      // Only log errors, don't throw - we don't want to block generation
      console.error(`Cannot stream tokens. Error: ${err}`);
    });
};
