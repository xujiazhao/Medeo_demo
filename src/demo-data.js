export const documents = [
  {
    id: 'brief',
    icon: 'B',
    type: 'Brief',
    title: '短视频创作 Brief',
    meta: '刚刚更新',
    status: 'active'
  },
  {
    id: 'insights',
    icon: 'I',
    type: 'Research',
    title: '素材洞察',
    meta: '12 个素材 · 8 个主题',
    status: 'ready'
  },
  {
    id: 'script',
    icon: 'S',
    type: 'Script',
    title: '旁白与分镜脚本',
    meta: 'v1 · 30 秒',
    status: 'draft'
  },
  {
    id: 'edit-plan',
    icon: 'E',
    type: 'Edit plan',
    title: '粗剪计划',
    meta: '3 个段落 · 9 个镜头',
    status: 'draft'
  }
];

export const seededAssets = [
  { id: 'a1', name: 'Interview_A.mp4', type: 'Interview', duration: '02:14', tone: 'warm', status: 'analysed' },
  { id: 'a2', name: 'City_Broll_03.mp4', type: 'B-roll', duration: '00:18', tone: 'blue', status: 'analysed' },
  { id: 'a3', name: 'Product_Closeup.mov', type: 'Product', duration: '00:11', tone: 'gold', status: 'analysed' },
  { id: 'a4', name: 'HomeBar_Wide.mp4', type: 'Location', duration: '00:24', tone: 'plum', status: 'analysed' },
  { id: 'a5', name: 'Voice_take_02.wav', type: 'Audio', duration: '00:38', tone: 'mint', status: 'analysed' },
  { id: 'a6', name: 'Brand_reference.pdf', type: 'Reference', duration: '12p', tone: 'paper', status: 'analysed' }
];

export const caseVideoAssets = [
  {
    id: 'yj-shot-01',
    name: '01_微笑开场.mp4',
    type: 'Home Bar · 中近景',
    kind: 'video',
    duration: '00:15',
    tone: 'plum',
    url: './assets/demo/Video%202.mp4',
    poster: './assets/demo/Image.png',
    status: 'analysed'
  },
  {
    id: 'yj-shot-02',
    name: '02_举杯观点.mp4',
    type: 'Home Bar · 酒杯动作',
    kind: 'video',
    duration: '00:15',
    tone: 'gold',
    url: './assets/demo/Video%203.mp4',
    poster: './assets/demo/Image%201.png',
    status: 'analysed'
  },
  {
    id: 'yj-shot-03',
    name: '03_指向镜头.mp4',
    type: 'Home Bar · 强调动作',
    kind: 'video',
    duration: '00:15',
    tone: 'blue',
    url: './assets/demo/Video%204.mp4',
    poster: './assets/demo/Image%202.png',
    status: 'analysed'
  },
  {
    id: 'yj-shot-04',
    name: '04_吧台全景.mp4',
    type: 'Home Bar · 环境收束',
    kind: 'video',
    duration: '00:15',
    tone: 'mint',
    url: './assets/demo/Video%205.mp4',
    poster: './assets/demo/Image%203.png',
    status: 'analysed'
  }
];

export const caseImageAssets = [
  {
    id: 'yj-character',
    name: '林雨婕 · 角色设定图',
    type: 'Character reference',
    kind: 'image',
    tone: 'plum',
    url: './assets/demo/Character%20Reference%20Sheet%20-%20Yu-Jie%20Elegant%20Woman%20(1).png',
    status: 'analysed'
  },
  ...caseVideoAssets.map((asset, index) => ({
    id: `yj-frame-${index + 1}`,
    name: `${String(index + 1).padStart(2, '0')} · ${['微笑中近景', '举杯近景', '直视强调', '吧台全景'][index]}`,
    type: 'First frame',
    kind: 'image',
    tone: asset.tone,
    url: asset.poster,
    status: 'analysed'
  }))
];

export const lampVideoAssets = [
  {
    id: 'lamp-shot-01',
    name: '01_后备箱取灯.mp4',
    type: '便携展示 · 提手特写',
    kind: 'video',
    duration: '00:07',
    tone: 'plum',
    url: './assets/demo/Video%208.mp4',
    status: 'analysed'
  },
  {
    id: 'lamp-shot-02',
    name: '02_湖边晚餐.mp4',
    type: '场景展示 · 暖光餐桌',
    kind: 'video',
    duration: '00:06',
    tone: 'gold',
    url: './assets/demo/Video%209.mp4',
    status: 'analysed'
  },
  {
    id: 'lamp-shot-03',
    name: '03_露营聚会.mp4',
    type: '场景展示 · 多人露营',
    kind: 'video',
    duration: '00:08',
    tone: 'blue',
    url: './assets/demo/Video%2010.mp4',
    status: 'analysed'
  },
  {
    id: 'lamp-shot-04',
    name: '04_帐篷阅读.mp4',
    type: '场景展示 · 睡前陪伴',
    kind: 'video',
    duration: '00:06',
    tone: 'mint',
    url: './assets/demo/Video%2011.mp4',
    status: 'analysed'
  }
];

export const concepts = [
  {
    id: 'direct',
    label: '方向 A',
    title: '镜头前的真心话',
    description: '人物直视镜头，以三个反常识观点建立记忆点。节奏清晰，适合抖音。',
    tags: ['人物驱动', '30s', '9:16'],
    score: 92
  },
  {
    id: 'story',
    label: '方向 B',
    title: '一次没说出口的约会',
    description: '用微剧情和环境细节推进观点，情绪更强，制作复杂度略高。',
    tags: ['微剧情', '45s', '9:16'],
    score: 86
  },
  {
    id: 'editorial',
    label: '方向 C',
    title: '关系观察室',
    description: '专业访谈与图文包装结合，适合品牌栏目和多平台复用。',
    tags: ['栏目感', '60s', '多画幅'],
    score: 81
  }
];

export const romanceTasks = [
  { id: 'analyse', title: '确认角色与视频方案', detail: '高跟鞋御姐 · Home Bar · 40 秒', state: 'done', progress: 100, cost: 0 },
  { id: 'shots', title: '生成四段 Home Bar 视频', detail: '角色一致性 · 4 个动作段落', state: 'running', progress: 4, cost: 80 },
  { id: 'voice', title: '生成旁白与 BGM', detail: '克制御姐语气 · 暖色低频', state: 'queued', progress: 0, cost: 14 },
  { id: 'caption', title: '生成重点字幕', detail: '4 个观点段落 · 抖音安全区', state: 'queued', progress: 0, cost: 3 },
  { id: 'assembly', title: '组装 40 秒粗剪', detail: '画面、旁白、字幕与混音', state: 'blocked', progress: 0, cost: 4 }
];

export const lampTasks = [
  { id: 'analyse', title: '分析四段产品素材', detail: '产品、场景、动作与可用区间', state: 'done', progress: 100, cost: 0 },
  { id: 'voice', title: '生成电商旁白', detail: '25 秒 · 自然种草语气', state: 'running', progress: 6, cost: 8 },
  { id: 'bgm', title: '生成轻户外 BGM', detail: '木吉他与环境氛围 · 25 秒', state: 'running', progress: 4, cost: 10 },
  { id: 'caption', title: '生成卖点字幕', detail: '便携、暖光、多场景', state: 'queued', progress: 0, cost: 3 },
  { id: 'assembly', title: '组装产品宣传粗剪', detail: '25 秒 · 9:16 电商短片', state: 'blocked', progress: 0, cost: 4 }
];

export const initialTasks = romanceTasks;

export const timelineClips = [
  { id: 'c1', title: '反常识开场', range: '00:00–00:05', tone: 'plum', width: 18, poster: './assets/demo/Image.png' },
  { id: 'c2', title: '先让她舒服', range: '00:05–00:15', tone: 'gold', width: 23, poster: './assets/demo/Image%201.png' },
  { id: 'c3', title: '边界与吸引力', range: '00:15–00:28', tone: 'blue', width: 29, poster: './assets/demo/Image%202.png' },
  { id: 'c4', title: '让她也走一步', range: '00:28–00:40', tone: 'mint', width: 27, poster: './assets/demo/Image%203.png' }
];

export const lampTimelineClips = [
  { id: 'l1', title: '随手带走', range: '00:00–00:05', tone: 'plum', width: 20, source: './assets/demo/Video%208.mp4' },
  { id: 'l2', title: '点亮晚餐', range: '00:05–00:11', tone: 'gold', width: 23, source: './assets/demo/Video%209.mp4' },
  { id: 'l3', title: '聚会氛围', range: '00:11–00:18', tone: 'blue', width: 27, source: './assets/demo/Video%2010.mp4' },
  { id: 'l4', title: '睡前陪伴', range: '00:18–00:25', tone: 'mint', width: 27, source: './assets/demo/Video%2011.mp4' }
];

export const quickQuestions = [
  {
    id: 'platform',
    label: '主要发布到哪里？',
    options: ['抖音 / Reels', 'B 站', 'YouTube', '多平台']
  },
  {
    id: 'material',
    label: '这次从什么开始？',
    options: ['使用已有素材', 'AI 补充镜头', '完全生成', '先写脚本']
  },
  {
    id: 'goal',
    label: '最重要的结果是什么？',
    options: ['提高完播率', '建立品牌感', '解释一个观点', '测试创意方向']
  }
];

export const ideationRounds = [
  {
    id: 'outcome',
    eyebrow: '先锁定核心判断',
    prompt: '你想让观众记住哪一句关系判断？',
    hint: '',
    reflection: '可以用“越用力追，距离反而越远”的反差开场，再落到舒适、边界和双向靠近。',
    options: [
      { value: '让她愿意靠近', reply: '真正有效的追求，是让她也愿意向你靠近。' },
      { value: '先尊重边界', reply: '先理解她的边界，再谈主动和表达。' },
      { value: '别用力证明自己', reply: '有吸引力的人，不会一直用力证明自己。' }
    ]
  },
  {
    id: 'source',
    eyebrow: '再决定镜头策略',
    prompt: '四段 Home Bar 镜头应该怎样生成？',
    hint: '',
    reflection: '微笑、举杯、指向镜头和吧台全景，可以组成“亲近—判断—强调—收束”的动作递进，并保持同一角色与空间。',
    options: [
      { value: '生成 40 秒观点片', reply: '生成四个连续镜头，组成一条 40 秒观点短片。' },
      { value: '直视镜头表达为主', reply: '让她始终直视镜头，动作自然，重点突出表达。' },
      { value: '先生成四个动作镜头', reply: '按微笑、举杯、强调和全景收束生成四段镜头。' }
    ]
  },
  {
    id: 'response',
    eyebrow: '最后确定传播动作',
    prompt: '观众看完后，最理想的反应是什么？',
    hint: '',
    reflection: '主体给出三个容易记住的判断，结尾用开放问题承接收藏和评论。',
    options: [
      { value: '收藏三个判断', reply: '希望男生收藏这三个判断，之后真的能用上。' },
      { value: '评论自己的经验', reply: '希望他们在评论区说说自己什么时候开始放弃“硬追”。' },
      { value: '转发给总在用力追的人', reply: '希望这句话值得转发给那个总在用力追的人。' }
    ]
  }
];
