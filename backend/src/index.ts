import express from 'express';
import cors from 'cors';
import decisionRouter from './routes/decision.route';

/**
 * Main application entry point for the Express Server
 */

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
});

// api health check
app.get('/api/health', (_req, res) => {
    res.status(200).send('OK');
});

app.use('/api', decisionRouter);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
}

export default app;