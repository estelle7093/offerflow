import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Helpers
async function callDeepSeek(prompt: string, isJson: boolean = true) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not defined');

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: isJson ? 'You are a helpful assistant that always responds in valid JSON format.' : 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      response_format: isJson ? { type: 'json_object' } : undefined,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'DeepSeek API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

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

// AI Routes
app.post('/api/ai/interview-strategy', verifyToken, async (req, res) => {
  try {
    const { role, company, jd, userResume } = req.body;
    const prompt = `你是一位资深的职业顾问。请根据以下职位信息和用户简历，生成一份极其详尽的面试准备策略。\n职位: ${role}\n公司: ${company}\n职位描述: ${jd}\n${userResume ? `用户简历: ${userResume}` : '（未提供简历，请基于职位要求进行通用分析）'}\n请提供专业、具体且具有针对性的分析。\n你必须返回符合以下结构的 JSON 对象：\n{
  "coreCompetencies": [{"name": "技能名", "score": 0-100, "label": "说明"}],
  "predictedQuestions": [{"question": "问题", "context": "背景", "keyPoints": "要点", "suggestedAnswer": "建议回答"}],
  "strategy": "总体策略",
  "avoidPits": "注意事项"
}`;

    const content = await callDeepSeek(prompt);
    return res.json(JSON.parse(content));
  } catch (err: any) {
    console.error('DeepSeek interview strategy error:', err);
    return res.status(500).json({ error: 'AI 分析失败: ' + err.message });
  }
});

app.post('/api/ai/retro-feedback', verifyToken, async (req, res) => {
  try {
    const { keeps, problems } = req.body;
    const prompt = `你是一位资深的面试官。以下是一位面试者的自我复盘：\n亮点: ${(keeps || []).join(', ')}\n不足: ${(problems || []).join(', ')}\n请提供 2-3 条极简的进阶建议。请直接返回一个字符串数组，例如：["建议1", "建议2"]`;

    const content = await callDeepSeek(prompt);
    return res.json(JSON.parse(content));
  } catch (err: any) {
    console.error('DeepSeek retro feedback error:', err);
    return res.json(['无法获取 AI 反馈']);
  }
});

app.post('/api/ai/diagnose-resume', verifyToken, async (req, res) => {
  try {
    const { resumeContent } = req.body;
    const prompt = `你是一位顶级互联网公司招聘专家。请对以下简历内容进行诊断并提供修改建议。\n简历内容:\n${resumeContent}\n你必须返回符合以下结构的 JSON 对象：\n{
  "score": 分数(0-100),
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["建议1", "建议2"],
  "marketValue": "市场价值预估（如：30k-50k）"
}`;

    const content = await callDeepSeek(prompt);
    return res.json(JSON.parse(content));
  } catch (err: any) {
    console.error('DeepSeek diagnose resume error:', err);
    return res.status(500).json({ error: '诊断失败: ' + err.message });
  }
});

export default app;
