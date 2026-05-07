import { applicationsApi, activitiesApi, profileApi, resumesApi } from '../services/apiClient';

export const injectDemoData = async () => {
  try {
    // 1. Update Profile
    await profileApi.update({
      name: '张小明 (Demo)',
      status: '面试中',
      location: '上海',
      goal: '斩获 50W+ 优质 Offer',
      goal_current: 2,
      goal_total: 5
    });

    // 2. Create Resume with Diagnosis
    const resume = await resumesApi.create({
      fileName: '张小明_资深产品经理简历_2026.pdf',
      fileType: 'pdf',
      text: '张小明\n资深产品经理\n\n拥有 5 年互联网大厂产品经验，主导过日活千万级产品的从0到1商业化落地。\n熟悉 AI 与大模型应用架构，具有出色的数据分析与团队管理能力。',
    });

    await resumesApi.update(resume.id, {
      diagnosis: {
        score: 88,
        strengths: ['丰富的从0到1大厂产品经验', '熟悉当下热门的AI与大模型应用', '具备商业化和数据分析能力'],
        weaknesses: ['缺少具体的项目数据指标支撑（如提升了多少转化率）', '未体现跨部门协调的具体困难与解决策略'],
        suggestions: ['建议在简历中使用STAR法则细化过往主导项目的业务成果。', '补充AI应用架构落地的具体技术指标和商业收益。'],
        marketValue: '40k - 60k'
      }
    });

    // 3. Create Applications
    const appsData = [
      {
        company: '字节跳动',
        role: 'AI 产品专家',
        location: '上海',
        salary: '45k-65k',
        stage: 'interviewing',
        link: 'https://jobs.bytedance.com/',
        jdSummary: '负责大语言模型相关的C端产品设计，需要有极强的商业敏锐度。',
        aiMatchingScore: 92,
        timeline: { applied: '2026-04-15', test: '2026-04-20', interview: '2026-04-28' }
      },
      {
        company: '腾讯',
        role: '高级商业化产品经理',
        location: '深圳',
        salary: '40k-55k',
        stage: 'test',
        link: 'https://careers.tencent.com/',
        jdSummary: '负责商业化变现与广告策略产品。',
        aiMatchingScore: 85,
        timeline: { applied: '2026-04-18', test: '2026-05-02' }
      },
      {
        company: '阿里巴巴',
        role: '资深产品经理 (创新业务)',
        location: '杭州',
        salary: '50k-70k',
        stage: 'offer',
        link: 'https://talent.alibaba.com/',
        jdSummary: '探索AI创新应用，要求有极强自驱力。',
        aiMatchingScore: 95,
        timeline: { applied: '2026-03-10', test: '2026-03-20', interview: '2026-04-05', offer: '2026-04-25' }
      },
      {
        company: '美团',
        role: '用户体验产品经理',
        location: '北京',
        salary: '35k-50k',
        stage: 'applied',
        link: '',
        jdSummary: '优化核心交易链路的用户体验。',
        aiMatchingScore: 78,
        timeline: { applied: '2026-05-01' }
      }
    ];

    for (const app of appsData) {
      await applicationsApi.create(app);
    }

    // 4. Create Activities
    const activitiesData = [
      {
        title: '阿里四面通过',
        type: 'status',
        date: '2026-04-25',
        description: '顺利拿到 Offer！薪资符合预期。'
      },
      {
        title: '字节跳动三面',
        type: 'interview',
        date: '2026-04-28',
        description: '面试官主要问了AI落地场景的商业化考量，感觉回答得不错。'
      },
      {
        title: '提交了腾讯的性格测试',
        type: 'milestone',
        date: '2026-05-02',
        description: '题量很大，希望能顺利通过。'
      }
    ];

    for (const act of activitiesData) {
      await activitiesApi.create(act);
    }

    return true;
  } catch (error) {
    console.error('Failed to inject demo data:', error);
    throw error;
  }
};
