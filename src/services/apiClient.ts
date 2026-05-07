/**
 * API Client — 混合架构
 * - CRUD 操作：直接使用 Supabase 客户端
 * - AI 操作：通过 Express 后端代理（保护 Gemini API Key）
 */

import { supabase } from './supabaseClient';

// ============================================
// Auth (Supabase Auth 直连)
// ============================================

export const authApi = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  register: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ============================================
// Profile (Supabase 直连)
// ============================================

export const profileApi = {
  get: async () => {
    const user = await authApi.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) return { id: user.id, name: user.user_metadata?.name || '新用户' };
    return data;
  },

  update: async (updates: any) => {
    const user = await authApi.getUser();
    if (!user) throw new Error('未登录');
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};

// ============================================
// Applications (Supabase 直连)
// ============================================

function mapAppFromDb(row: any) {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    location: row.location,
    salary: row.salary,
    status: row.status,
    stage: row.stage,
    updatedAt: formatTimeAgo(row.updated_at),
    logoUrl: row.logo_url,
    jdSummary: row.jd_summary,
    aiMatchingScore: row.ai_matching_score,
    source: row.source,
    financing: row.financing,
    size: row.size,
    website: row.website,
    timeline: row.timeline || {},
    aiPrep: row.ai_prep,
    interviews: row.interviews || [],
    notes: row.notes || [],
    retrospectives: row.retrospectives || [],
  };
}

function mapAppToDb(app: any) {
  const row: any = {};
  if (app.company !== undefined) row.company = app.company;
  if (app.role !== undefined) row.role = app.role;
  if (app.location !== undefined) row.location = app.location;
  if (app.salary !== undefined) row.salary = app.salary;
  if (app.status !== undefined) row.status = app.status;
  if (app.stage !== undefined) row.stage = app.stage;
  if (app.logoUrl !== undefined) row.logo_url = app.logoUrl;
  if (app.jdSummary !== undefined) row.jd_summary = app.jdSummary;
  if (app.aiMatchingScore !== undefined) row.ai_matching_score = app.aiMatchingScore;
  if (app.source !== undefined) row.source = app.source;
  if (app.financing !== undefined) row.financing = app.financing;
  if (app.size !== undefined) row.size = app.size;
  if (app.website !== undefined) row.website = app.website;
  if (app.timeline !== undefined) row.timeline = app.timeline;
  if (app.aiPrep !== undefined) row.ai_prep = app.aiPrep;
  if (app.interviews !== undefined) row.interviews = app.interviews;
  if (app.notes !== undefined) row.notes = app.notes;
  if (app.retrospectives !== undefined) row.retrospectives = app.retrospectives;
  return row;
}

export const applicationsApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapAppFromDb);
  },

  create: async (app: any) => {
    const user = await authApi.getUser();
    if (!user) throw new Error('未登录');
    const { data, error } = await supabase
      .from('applications')
      .insert({ user_id: user.id, ...mapAppToDb(app) })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapAppFromDb(data);
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('applications')
      .update(mapAppToDb(updates))
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapAppFromDb(data);
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ============================================
// Activities (Supabase 直连)
// ============================================

export const activitiesApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(a => ({
      id: a.id, title: a.title, date: a.date, time: a.time,
      endTime: a.end_time, type: a.type, location: a.location,
      isCompleted: a.is_completed, applicationId: a.application_id,
    }));
  },

  create: async (activity: any) => {
    const user = await authApi.getUser();
    if (!user) throw new Error('未登录');
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id, title: activity.title, date: activity.date,
        time: activity.time || '10:00', end_time: activity.endTime || '',
        type: activity.type || 'other', location: activity.location || '',
        is_completed: activity.isCompleted || false,
        application_id: activity.applicationId && activity.applicationId !== 'none' ? activity.applicationId : null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id, title: data.title, date: data.date, time: data.time,
      endTime: data.end_time, type: data.type, location: data.location,
      isCompleted: data.is_completed, applicationId: data.application_id,
    };
  },

  update: async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
    if (updates.applicationId !== undefined) {
      dbUpdates.application_id = updates.applicationId && updates.applicationId !== 'none' ? updates.applicationId : null;
    }
    const { data, error } = await supabase
      .from('activities').update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return {
      id: data.id, title: data.title, date: data.date, time: data.time,
      endTime: data.end_time, type: data.type, location: data.location,
      isCompleted: data.is_completed, applicationId: data.application_id,
    };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ============================================
// Resumes (Supabase 直连)
// ============================================

export const resumesApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('resumes').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(r => ({
      id: r.id, fileName: r.file_name, fileType: r.file_type,
      text: r.text, diagnosis: r.diagnosis, createdAt: new Date(r.created_at).getTime(),
    }));
  },

  create: async (resume: any) => {
    const user = await authApi.getUser();
    if (!user) throw new Error('未登录');
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id, file_name: resume.fileName,
        file_type: resume.fileType || 'txt', text: resume.text || '',
      })
      .select().single();
    if (error) throw new Error(error.message);
    return {
      id: data.id, fileName: data.file_name, fileType: data.file_type,
      text: data.text, diagnosis: data.diagnosis, createdAt: new Date(data.created_at).getTime(),
    };
  },

  update: async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.fileName !== undefined) dbUpdates.file_name = updates.fileName;
    if (updates.text !== undefined) dbUpdates.text = updates.text;
    if (updates.diagnosis !== undefined) dbUpdates.diagnosis = updates.diagnosis;
    const { data, error } = await supabase
      .from('resumes').update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return {
      id: data.id, fileName: data.file_name, fileType: data.file_type,
      text: data.text, diagnosis: data.diagnosis, createdAt: new Date(data.created_at).getTime(),
    };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('resumes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ============================================
// Feedback (Supabase 直连)
// ============================================

export const feedbackApi = {
  submit: async (type: string, content: string) => {
    const user = await authApi.getUser();
    if (!user) throw new Error('未登录');
    const { error } = await supabase
      .from('feedbacks')
      .insert({ user_id: user.id, type, content });
    if (error) throw new Error(error.message);
  },
};

// ============================================
// AI API (通过 Express 后端代理)
// ============================================

async function aiRequest<T>(path: string, body: any): Promise<T> {
  const session = await authApi.getSession();
  const res = await fetch(`/api/ai${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

export const aiApi = {
  interviewStrategy: (role: string, company: string, jd: string, userResume?: string) =>
    aiRequest<any>('/interview-strategy', { role, company, jd, userResume }),

  retroFeedback: (keeps: string[], problems: string[]) =>
    aiRequest<string[]>('/retro-feedback', { keeps, problems }),

  diagnoseResume: (resumeContent: string) =>
    aiRequest<any>('/diagnose-resume', { resumeContent }),
};

// ============================================
// Helpers
// ============================================

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '刚刚';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return `${Math.floor(days / 7)}周前`;
}
