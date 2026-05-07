import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  FileText,
  User,
  Plus,
  Bell,
  Search,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  MonitorPlay,
  MessageCircle,
  Lightbulb,
  Check,
  FileSearch,
  BarChart3,
  BrainCircuit,
  MessageSquareQuote,
  Star,
  Target,
  FolderOpen,
  ArrowLeft,
  RefreshCw,
  MoreVertical,
  Pencil,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  ChevronLeft,
  ChevronDown,
  Inbox,
  Trash2,
  Camera,
  Image,
  AlertTriangle,
  Clipboard,
  FileUp,
  Eye,
  File,
  DollarSign,
  Settings,
  LogOut,
  HelpCircle,
  X,
  XCircle,
  PlusCircle,
  Heart,
  Quote
} from 'lucide-react';

export type ViewType = 'overview' | 'applications' | 'schedule' | 'details' | 'profile';

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected' | 'test';
  stage: string;
  updatedAt: string;
  logoUrl?: string;
  jdSummary?: string;
  aiPrep?: any;
  interviews?: Interview[];
  notes?: string[];
  aiMatchingScore?: number;
  source?: string;
  retrospectives?: any[];
  financing?: string;
  size?: string;
  website?: string;
  timeline?: {
    applied?: string;
    test?: string;
    interview?: string;
    offer?: string;
  };
}

export interface Interview {
  id: string;
  type: string;
  time: string;
  duration: string;
  platform: string;
  meetingLink?: string;
  interviewer?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1',
    company: 'ByteDance',
    role: '高级产品经理 (AI 平台)',
    location: '北京 · 创意园',
    salary: '45k - 70k · 16薪',
    status: 'interviewing',
    stage: '第 2/4 轮',
    updatedAt: '2小时前',
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=100&h=100&fit=crop',
    jdSummary: '负责抖音 AI 创作工具的产品规划与落地，协调算法团队优化生成式模型在短视频场景的表现。要求 5 年以上产品经验，熟悉 LLM/AIGC 行业。',
    aiMatchingScore: 92,
    financing: '未上市 (Late Stage)',
    size: '100,000+ 人',
    website: 'bytedance.com',
    timeline: {
      applied: '2026-05-10',
      test: '2026-05-15',
      interview: '2026-05-20'
    },
    interviews: [
      {
        id: 'i1',
        type: '软件开发 (三面)',
        time: '2026-05-24 14:30',
        duration: '1小时',
        platform: '钉钉会议',
        interviewer: '李经理',
        status: 'upcoming'
      }
    ]
  },
  {
    id: '2',
    company: 'Alibaba Group',
    role: '前端开发专家',
    location: '杭州',
    salary: '40k - 65k',
    status: 'applied',
    stage: '筛选简历中',
    updatedAt: '3小时前',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    aiMatchingScore: 85,
    financing: '已上市 (NYSE: BABA)',
    size: '200,000+ 人',
    website: 'alibabagroup.com',
    timeline: {
      applied: '2026-05-18'
    }
  },
  {
    id: '3',
    company: 'Tencent',
    role: '产品经理',
    location: '北京',
    salary: '35k - 60k',
    status: 'test',
    stage: '笔试中',
    updatedAt: '1天前',
    logoUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=100&h=100&fit=crop',
    aiMatchingScore: 78,
    financing: '已上市 (0700.HK)',
    size: '100,000+ 人',
    website: 'tencent.com',
    timeline: {
      applied: '2026-05-12',
      test: '2026-05-16'
    }
  },
  {
    id: '4',
    company: 'Meituan',
    role: '算法工程师',
    location: '上海',
    salary: '30k - 50k',
    status: 'applied',
    stage: '筛选简历中',
    updatedAt: '2天前',
    logoUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop',
    aiMatchingScore: 88,
    financing: '已上市 (3690.HK)',
    size: '100,000+ 人',
    website: 'meituan.com',
    timeline: {
      applied: '2026-05-15'
    }
  },
  {
    id: '5',
    company: 'Xiaohongshu',
    role: '社区搜索产品经理',
    location: '上海',
    salary: '35k+',
    status: 'rejected',
    stage: '已终止',
    updatedAt: '1周前',
    logoUrl: 'https://images.unsplash.com/photo-1522071823991-b9671f30142f?w=100&h=100&fit=crop',
    aiMatchingScore: 95,
    financing: 'E轮及以后',
    size: '5000-10000 人',
    website: 'xiaohongshu.com',
    timeline: {
      applied: '2026-04-20',
      interview: '2026-04-28'
    }
  }
];

export const ICONS = {
  Overview: LayoutDashboard,
  Briefcase,
  Calendar,
  FileText,
  User,
  Plus,
  Bell,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  TrendingUp,
  MapPin,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  MonitorPlay,
  MessageCircle,
  Lightbulb,
  Check,
  FileSearch,
  BarChart3,
  BrainCircuit,
  MessageSquareQuote,
  Star,
  Target,
  FolderOpen,
  ArrowLeft,
  RefreshCw,
  MoreVertical,
  Pencil,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  Inbox,
  Trash2,
  Camera,
  Image,
  AlertTriangle,
  Clipboard,
  FileUp,
  Eye,
  File,
  Salary: DollarSign,
  Settings,
  LogOut,
  HelpCircle,
  X,
  XCircle,
  PlusCircle,
  Heart,
  Quote
};
