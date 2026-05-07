-- ============================================
-- OfferFlow Supabase Database Schema
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '新用户',
  title TEXT DEFAULT '',
  status TEXT DEFAULT '求职中',
  location TEXT DEFAULT '',
  tag TEXT DEFAULT '',
  goal TEXT DEFAULT '斩获优质 Offer',
  goal_current INTEGER DEFAULT 0,
  goal_total INTEGER DEFAULT 5,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 求职申请表
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT DEFAULT '',
  salary TEXT DEFAULT '',
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied','interviewing','offer','rejected','test')),
  stage TEXT DEFAULT '筛选简历中',
  logo_url TEXT DEFAULT '',
  jd_summary TEXT DEFAULT '',
  ai_matching_score INTEGER DEFAULT 0,
  source TEXT DEFAULT '',
  financing TEXT DEFAULT '',
  size TEXT DEFAULT '',
  website TEXT DEFAULT '',
  timeline JSONB DEFAULT '{}',
  ai_prep JSONB DEFAULT NULL,
  interviews JSONB DEFAULT '[]',
  notes JSONB DEFAULT '[]',
  retrospectives JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 日程活动表
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT DEFAULT '10:00',
  end_time TEXT DEFAULT '',
  type TEXT DEFAULT 'other' CHECK (type IN ('interview','test','other')),
  location TEXT DEFAULT '',
  is_completed BOOLEAN DEFAULT FALSE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 简历表
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT DEFAULT 'txt',
  text TEXT DEFAULT '',
  diagnosis JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 反馈表
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'other',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- profiles: 用户只能操作自己的资料
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- applications: 用户只能操作自己的申请
CREATE POLICY "applications_select_own" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "applications_insert_own" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "applications_update_own" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "applications_delete_own" ON applications FOR DELETE USING (auth.uid() = user_id);

-- activities: 用户只能操作自己的日程
CREATE POLICY "activities_select_own" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activities_insert_own" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_update_own" ON activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activities_delete_own" ON activities FOR DELETE USING (auth.uid() = user_id);

-- resumes: 用户只能操作自己的简历
CREATE POLICY "resumes_select_own" ON resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "resumes_insert_own" ON resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resumes_update_own" ON resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "resumes_delete_own" ON resumes FOR DELETE USING (auth.uid() = user_id);

-- feedbacks: 用户只能插入自己的反馈
CREATE POLICY "feedbacks_insert_own" ON feedbacks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 触发器: 用户注册时自动创建 profile
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', '新用户'),
    'https://api.dicebear.com/7.x/micah/svg?seed=' || NEW.id || '&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 更新 updated_at 字段的触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
