/**
 * @deprecated AI services have been migrated to the backend.
 * Use `aiApi` from `./apiClient.ts` instead.
 * 
 * This file is kept as a placeholder to prevent import errors during transition.
 * All Gemini AI calls now go through:
 *   - POST /api/ai/interview-strategy
 *   - POST /api/ai/retro-feedback  
 *   - POST /api/ai/diagnose-resume
 */

export async function generateInterviewStrategy(..._args: any[]) {
  console.warn('geminiService is deprecated. Use aiApi.interviewStrategy() instead.');
  return null;
}

export async function generateRetroFeedback(..._args: any[]) {
  console.warn('geminiService is deprecated. Use aiApi.retroFeedback() instead.');
  return ['AI 服务已迁移至后端'];
}

export async function diagnoseResume(..._args: any[]) {
  console.warn('geminiService is deprecated. Use aiApi.diagnoseResume() instead.');
  return null;
}
