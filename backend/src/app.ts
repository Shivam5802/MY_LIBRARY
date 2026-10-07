import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { protectedTestRouter } from './routes/test.routes.js';
import { seatRouter } from './routes/seat.routes.js';
import { studentRouter } from './routes/student.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { ownerProfileRouter } from './routes/owner.routes.js';
import { billingRouter } from './routes/billing.routes.js';
import { developerRouter } from './routes/developer.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export const app = express();

// Security Headers with Helmet
app.use(helmet());

// Rate Limiting for Auth Endpoints (Prevents brute force attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  },
});

// General API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // generous 600 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Security & Parsing Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        config.frontendUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));

// API v1 Routing
const apiV1Router = express.Router();
apiV1Router.use(apiLimiter);
apiV1Router.use('/auth', authLimiter, authRouter);
apiV1Router.use('/health', healthRouter);
apiV1Router.use('/test', protectedTestRouter);
apiV1Router.use('/seats', seatRouter);
apiV1Router.use('/students', studentRouter);
apiV1Router.use('/dashboard', dashboardRouter);
apiV1Router.use('/owner', ownerProfileRouter);
apiV1Router.use('/billing', billingRouter);
apiV1Router.use('/developer', developerRouter);

app.use('/api/v1', apiV1Router);

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);
