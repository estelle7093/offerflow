import express from 'express';
import { createClient } from '@supabase/supabase-js';
import aiRouter from '../src/server/routes/ai';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Simple auth check for AI routes
async function verifyToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未认证' });
  }
  
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const sb = createClient(supabaseUrl, serviceKey);
    const { data: { user }, error } = await sb.auth.getUser(auth.split(' ')[1]);
    
    if (error || !user) {
      return res.status(401).json({ error: '认证失效' });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ error: '认证出错' });
  }
}

// Map the AI routes
app.use('/api/ai', verifyToken, aiRouter);

export default app;
