import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');
  return new GoogleGenAI({ apiKey });
}

// POST /api/ai/interview-strategy
router.post('/interview-strategy', async (req: Request, res: Response) => {
  try {
    const { role, company, jd, userResume } = req.body;
    const ai = getAI();
    const prompt = `你是一位资深的职业顾问。请根据以下职位信息和用户简历，生成一份极其详尽的面试准备策略。\n职位: ${role}\n公司: ${company}\n职位描述: ${jd}\n${userResume ? `用户简历: ${userResume}` : '（未提供简历，请基于职位要求进行通用分析）'}\n请提供专业、具体且具有针对性的分析。`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coreCompetencies: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, label: { type: Type.STRING } }, required: ['name', 'score', 'label'] } },
            predictedQuestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, context: { type: Type.STRING }, keyPoints: { type: Type.STRING }, suggestedAnswer: { type: Type.STRING } }, required: ['question', 'context', 'keyPoints', 'suggestedAnswer'] } },
            strategy: { type: Type.STRING },
            avoidPits: { type: Type.STRING },
          },
          required: ['coreCompetencies', 'predictedQuestions', 'strategy', 'avoidPits'],
        },
      },
    });
    const text = response.text;
    if (!text) return res.status(500).json({ error: 'AI 返回为空' });
    return res.json(JSON.parse(text.trim()));
  } catch (err: any) {
    console.error('AI interview strategy error:', err);
    return res.status(500).json({ error: 'AI 分析失败: ' + err.message });
  }
});

// POST /api/ai/retro-feedback
router.post('/retro-feedback', async (req: Request, res: Response) => {
  try {
    const { keeps, problems } = req.body;
    const ai = getAI();
    const prompt = `你是一位资深的面试官。以下是一位面试者的自我复盘：\n亮点: ${(keeps || []).join(', ')}\n不足: ${(problems || []).join(', ')}\n请提供 2-3 条极简的进阶建议。`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } },
    });
    const text = response.text;
    if (!text) return res.json(['无法获取 AI 反馈']);
    return res.json(JSON.parse(text.trim()));
  } catch (err: any) {
    console.error('AI retro feedback error:', err);
    return res.json(['无法获取 AI 反馈']);
  }
});

// POST /api/ai/diagnose-resume
router.post('/diagnose-resume', async (req: Request, res: Response) => {
  try {
    const { resumeContent } = req.body;
    const ai = getAI();
    const prompt = `你是一位顶级互联网公司招聘专家。请对以下简历内容进行诊断并提供修改建议。\n在 marketValue 字段中，请提供该候选人的市场价值预估（例如：30k-50k），请确保使用货币单位而不是距离单位。\n简历内容:\n${resumeContent}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketValue: { type: Type.STRING },
          },
          required: ['score', 'strengths', 'weaknesses', 'suggestions', 'marketValue'],
        },
      },
    });
    const text = response.text;
    if (!text) return res.status(500).json({ error: 'AI 返回为空' });
    return res.json(JSON.parse(text.trim()));
  } catch (err: any) {
    console.error('AI diagnose resume error:', err);
    return res.status(500).json({ error: '诊断失败: ' + err.message });
  }
});

export default router;
