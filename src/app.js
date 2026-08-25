import {
  caseImageAssets,
  caseVideoAssets,
  concepts,
  documents,
  ideationRounds,
  initialTasks,
  lampTasks,
  lampTimelineClips,
  lampVideoAssets,
  quickQuestions,
  romanceTasks,
  seededAssets,
  timelineClips
} from './demo-data.js';

const app = document.querySelector('#app');

const state = {
  view: 'report',
  activeTool: 'docs',
  activeDoc: 'brief',
  stageMode: 'document',
  leftSection: 'docs',
  workspaceFixed: false,
  freshWorkspace: false,
  previewItem: null,
  libraryWidth: 258,
  copilotWidth: 500,
  focusMode: 'auto',
  intent: 'work',
  copilotMode: 'clarify',
  selections: {},
  selectedConcept: 'direct',
  docs: structuredClone(documents),
  importedAssets: [],
  tasks: structuredClone(initialTasks),
  chatSessions: [
    { id: 'main', title: '视频方案', meta: '主创作对话' },
    { id: 'release', title: '发布与版本规划', meta: '独立讨论' }
  ],
  activeSession: 'main',
  sessionMenuOpen: false,
  retrySeen: false,
  elapsed: 0,
  toast: '',
  savedAt: '刚刚',
  running: false,
  complete: false,
  ideaStep: 0,
  ideaAnswers: [],
  ideaTyping: false,
  planGenerating: false,
  workspaceEntering: false,
  projectType: 'romance',
  analysisStep: 0,
  analysisComplete: false,
  demoEntering: false,
  playbackTime: 0,
  playbackClipIndex: 0,
  previewPlaying: false
};

const persistedStateKey = 'medeo-product-demo-state-v1';
try {
  const restoredState = JSON.parse(sessionStorage.getItem(persistedStateKey) || 'null');
  if (restoredState && typeof restoredState === 'object') {
    Object.assign(state, restoredState, {
      importedAssets: [],
      previewItem: null,
      ideaTyping: false,
      planGenerating: false,
      workspaceEntering: false,
      demoEntering: false,
      previewPlaying: false
    });
  }
} catch {
  sessionStorage.removeItem(persistedStateKey);
}

let runTimer = null;
let analysisTimer = null;
let toastTimer = null;

const projectProfiles = {
  romance: {
    title: '美女教你谈恋爱',
    docId: 'video-plan',
    docTitle: '美女教你谈恋爱 · 视频方案 v1',
    duration: '00:40',
    currentTime: '00:08.12',
    clips: timelineClips,
    videos: caseVideoAssets,
    tasks: romanceTasks,
    audioName: 'Home Bar 暖色氛围 BGM',
    output: '40 秒 · 9:16',
    ruler: ['00:00', '00:10', '00:25', '00:40']
  },
  lamp: {
    title: '便携户外灯 · 电商产品片',
    docId: 'lamp-plan',
    docTitle: '户外氛围灯 · 产品视频方案 v1',
    duration: '00:25',
    currentTime: '00:04.08',
    clips: lampTimelineClips,
    videos: lampVideoAssets,
    tasks: lampTasks,
    audioName: '轻户外暖光 BGM · 生成中',
    output: '25 秒 · 9:16',
    ruler: ['00:00', '00:06', '00:14', '00:25']
  }
};

const activeProject = () => projectProfiles[state.projectType] || projectProfiles.romance;

const recipeItems = [
  { title: '舞蹈角色互换', used: '2.2k', image: './assets/recipes/dance-character-swap.webp' },
  { title: '鼠标乱入', used: '6.4k', image: './assets/recipes/annoying-mouse.webp' },
  { title: '屏幕入侵拉扯', used: '2.2k', image: './assets/recipes/screen-invasion.webp' },
  { title: '火柴人逻辑', used: '7.3k', image: './assets/recipes/stickman-logic.webp' },
  { title: '涂鸦视角魔法', used: '1.3k', image: './assets/recipes/doodle-pov.webp' }
];

const icon = (name) => {
  const names = {
    spark: 'ri-sparkling-fill',
    doc: 'ri-file-text-line',
    media: 'ri-image-line',
    audio: 'ri-volume-up-line',
    timeline: 'ri-timeline-view',
    task: 'ri-checkbox-circle-line',
    chat: 'ri-chat-3-line',
    upload: 'ri-upload-cloud-2-line',
    play: 'ri-play-fill',
    pause: 'ri-pause-fill',
    aspect: 'ri-smartphone-line',
    chevron: 'ri-arrow-right-s-line',
    close: 'ri-close-line',
    activity: 'ri-pulse-line',
    focus: 'ri-fullscreen-line',
    plus: 'ri-add-line',
    arrow: 'ri-arrow-right-line',
    back: 'ri-arrow-left-line',
    more: 'ri-more-2-fill',
    previous: 'ri-skip-back-mini-fill',
    next: 'ri-skip-forward-mini-fill',
    undo: 'ri-arrow-go-back-line',
    redo: 'ri-arrow-go-forward-line',
    minus: 'ri-subtract-line'
  };
  return `<i class="svg-icon ui-icon ${names[name] || names.spark}" aria-hidden="true"></i>`;
};

const brandMark = () => '<img class="medeo-logo" src="./assets/brand/medeo-logo.svg" alt="" />';

const button = (label, action, variant = 'primary', extra = '') =>
  `<button class="button ${variant}" data-action="${action}" ${extra}>${label}</button>`;

const escapeHTML = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function persistState() {
  try {
    sessionStorage.setItem(persistedStateKey, JSON.stringify({ ...state, importedAssets: [], previewItem: null, demoEntering: false }));
  } catch {
    // The demo remains usable even when browser storage is unavailable.
  }
}

function showToast(message) {
  state.toast = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toast = '';
    render();
  }, 2200);
}

function renderReport() {
  const problems = [
    ['01', '一句话可能触发长任务', '首页的视频入口不够明确，通用 Chat 又可能把一句模糊表达直接解释为生成任务，带来等待、token 与 credits 消耗。'],
    ['02', '缺少专业创作工作流', '产品更像一键生成工具。已有大量素材的剪辑师，缺少让 Agent 阅读内容、理解方向并协助剪辑与后期的入口。'],
    ['03', '界面层次碎，注意力没有主次', '边框、容器和颜色层级过多；对话和工作区始终同时争夺空间，也没有根据当前意图调整布局。'],
    ['04', '长任务占满对话', '工具过程层层嵌套在右侧。首版生成期间，用户很难继续讨论修改、下一版或发布计划。'],
    ['05', '文档没有成为项目上下文', 'AI 视频创作需要稳定的目标、素材判断和版本记录。文档数量应克制，但必须真正参与后续执行。']
  ];
  const thoughts = [
    ['执行需要确认门', 'AI 视频任务成本高、耗时长，模糊意图不能直接进入执行。'],
    ['用户有两种起点', '轻量用户从想法开始；专业用户从已有素材开始。'],
    ['生成不是终点', '文档、任务状态和后续对话必须贯穿首版与下一版。']
  ];
  const solutions = [
    ['聚焦方案对话', '三轮确定观点、镜头和传播动作，确认后才生成。'],
    ['素材驱动空间', 'Agent 阅读素材、判断方向并规划旁白、BGM、字幕与粗剪。'],
    ['稳定三栏工作区', '左侧文档与资产，中间播放器与时间线，右侧 Agent。'],
    ['任务与对话分离', '右侧保留任务状态，并支持独立 Session 讨论 V2。'],
    ['一份核心文档', '视频方案持续连接镜头、任务与时间线。']
  ];
  return `
    <main class="report-shell">
      <header class="report-topbar">
        <div class="report-brand"><span class="brand-mark">${brandMark()}</span><span>Medeo</span><small>PRODUCT REDESIGN</small></div>
        <button class="report-demo-button" data-action="enter-demo"><span>查看 Demo</span>${icon('arrow')}</button>
      </header>

      <section class="report-page report-problems">
        <header><span>A</span><h1>问题</h1></header>
        <div class="report-item-list">${problems.map(([number, title, detail]) => `<article><span>${number}</span><div><h3>${title}</h3><p>${detail}</p></div></article>`).join('')}</div>
      </section>

      <section class="report-page report-thinking">
        <header><span>B</span><h1>思考</h1></header>
        <div class="report-item-list">${thoughts.map(([title, detail], index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${title}</h3><p>${detail}</p></div></article>`).join('')}</div>
      </section>

      <section class="report-page report-solutions">
        <header><span>C</span><h1>解法</h1></header>
        <div class="report-item-list">${solutions.map(([title, detail], index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${title}</h3><p>${detail}</p></div></article>`).join('')}</div>
      </section>

      <footer class="report-footer">Designed by Jiazhao Xu</footer>
    </main>`;
}

function renderHome() {
  return `
    <main class="home-shell">
      <aside class="home-nav">
        <div class="brand"><span class="brand-mark">${brandMark()}</span><span>Medeo</span><small>PRO</small></div>
        <nav class="home-nav-links" aria-label="主导航">
          <button class="home-nav-link active">${icon('spark')}<span>开始创作</span></button>
          <button class="home-nav-link">${icon('media')}<span>创作空间</span><em>4</em></button>
          <button class="home-nav-link">${icon('doc')}<span>模板与灵感</span></button>
        </nav>
        <div class="home-spacer"></div>
        <div class="usage-card">
          <div><span class="eyebrow">本月用量</span><strong>726</strong><span> credits</span></div>
          <div class="usage-bar"><i></i></div>
          <p>专业计划 · 8 天试用期</p>
        </div>
        <button class="profile-row"><span class="avatar">JX</span><span><strong>Jiazhao Xu</strong><small>个人空间</small></span><span class="push">${icon('more')}</span></button>
      </aside>

      <section class="home-main">
        <header class="home-header">
          <div>
            <h1>今天想推进什么？</h1>
          </div>
        </header>

        <section class="start-grid">
          <button class="start-card idea" data-action="start-idea">
            <span class="start-icon">${icon('spark')}</span>
            <strong>从一个想法开始</strong>
            <p>与 Agent 对话，把初步想法逐步整理成可执行的视频方案。</p>
            <span class="start-cta">开始讨论 ${icon('arrow')}</span>
          </button>
          <button class="start-card import" data-action="start-import">
            <span class="start-icon">${icon('upload')}</span>
            <strong>从素材创建空间</strong>
            <p>导入图片、视频或音频，让 Agent 理解素材并搭建创作空间。</p>
            <span class="start-cta">开始分析 ${icon('arrow')}</span>
          </button>
        </section>

        <section class="recent-section">
          <div class="section-title"><div><h2>继续你的创作</h2></div></div>
          <div class="space-list">
            ${[
              ['美女教你谈恋爱', 'Cut v1 · 40 秒', '刚刚', 'romance', caseVideoAssets[0].poster, 'image'],
              ['便携户外灯 · 电商产品片', 'Cut v1 · 25 秒', '今天', 'lamp', lampVideoAssets[1].url, 'video']
            ].map(([title, meta, date, project, thumbnail, thumbnailKind]) => `
              <button class="space-row" data-action="open-space" data-project="${project}">
                <span class="space-thumb">${thumbnailKind === 'video' ? `<video src="${thumbnail}" muted playsinline preload="auto"></video>` : `<img src="${thumbnail}" alt=""/>`}</span>
                <span class="space-copy"><strong>${title}</strong><small>${meta}</small></span>
                <span class="space-date">${date}</span>
                <span class="space-arrow">${icon('chevron')}</span>
              </button>`).join('')}
          </div>
        </section>

        <section class="recipes-section">
          <div class="section-title"><div><h2>灵感配方</h2></div></div>
          <div class="recipe-grid">
            ${recipeItems.map(item => `
              <article class="recipe-card">
                <span class="recipe-thumb"><img src="${item.image}" alt="" loading="lazy" /></span>
                <strong>${item.title}</strong>
                <span class="recipe-used">已使用 ${item.used} 次</span>
              </article>`).join('')}
          </div>
        </section>
      </section>
    </main>`;
}

function renderIdeation() {
  const currentRound = ideationRounds[state.ideaStep];
  const outcome = state.ideaAnswers.find(answer => answer.id === 'outcome')?.value || '等待确认';
  const source = state.ideaAnswers.find(answer => answer.id === 'source')?.value || '等待确认';
  const response = state.ideaAnswers.find(answer => answer.id === 'response')?.value || '等待确认';

  return `
    <main class="ideation-shell">
      <header class="ideation-topbar">
        <button class="icon-button" data-action="go-home" aria-label="返回首页">${icon('back')}</button>
        <div class="brand ideation-brand"><span class="brand-mark">${brandMark()}</span><span>Medeo</span><small>PRO</small></div>
        <div class="ideation-progress"><span>视频方案对话</span><div>${ideationRounds.map((_, index) => `<i class="${index < state.ideaStep ? 'done' : index === state.ideaStep ? 'active' : ''}"></i>`).join('')}</div><strong>${Math.min(state.ideaStep + 1, 3)} / 3</strong></div>
        <button class="text-button" data-action="skip-ideation">跳过，进入工作区</button>
      </header>

      <section class="focus-chat-layout">
        <div class="focus-conversation">
          <div class="conversation-thread">
            <div class="focus-message user"><p>帮我生成一个可以在抖音爆火的情感解说类美女视频，告诉男生怎么追女生的。角色要是高跟鞋御姐，背景在一个环境很好的 Home Bar。</p></div>
            <div class="focus-message ai"><span class="agent-avatar">${icon('spark')}</span><div><strong>Creative Copilot</strong><p>先确定核心观点，再规划四段 Home Bar 镜头。</p></div></div>
            ${state.ideaAnswers.map((answer, index) => `
              <div class="focus-message ai compact"><span class="agent-avatar">${String(index + 1).padStart(2, '0')}</span><div><strong>${ideationRounds[index].eyebrow}</strong><p>${ideationRounds[index].prompt}</p></div></div>
              <div class="focus-message user"><p>${escapeHTML(answer.reply)}</p></div>
              ${index < state.ideaStep ? `<div class="focus-message ai reflection"><span class="agent-avatar">${icon('spark')}</span><div><strong>创作判断</strong><p>${ideationRounds[index].reflection}</p></div></div>` : ''}
            `).join('')}
            ${state.ideaTyping ? `<div class="focus-message ai typing"><span class="agent-avatar">${icon('spark')}</span><div><span>正在整理</span><i></i><i></i><i></i></div></div>` : ''}
          </div>

          ${currentRound && !state.ideaTyping ? `
            <section class="focus-question">
              <div class="question-copy"><span>${currentRound.eyebrow}</span><h2>${currentRound.prompt}</h2></div>
              <div class="focus-options">
                ${currentRound.options.map(option => `<button data-action="idea-answer" data-value="${option.value}" data-reply="${option.reply}"><span>${option.value}</span>${icon('arrow')}</button>`).join('')}
              </div>
            </section>` : ''}

        </div>

        ${currentRound ? `<div class="focus-composer-dock ${state.ideaTyping ? 'thinking' : ''}"><div class="focus-freeform"><textarea id="idea-input" rows="2" placeholder="${state.ideaTyping ? 'Creative Copilot 正在整理…' : '用自己的方式表达…'}" ${state.ideaTyping ? 'disabled' : ''}></textarea><div><span>${state.ideaTyping ? '正在形成下一步建议' : 'Enter 发送 · Shift + Enter 换行'}</span><button class="send-button" data-action="idea-send" aria-label="发送想法" ${state.ideaTyping ? 'disabled' : ''}>${icon('arrow')}</button></div></div></div>` : ''}

        ${state.ideaStep >= ideationRounds.length && !state.planGenerating ? `<section class="idea-ready"><div><h2>视频方案已就绪</h2><p>四段视频、旁白、字幕和 BGM 将在确认后开始生成。</p></div>${button('确认并开始制作', 'generate-video-plan', 'primary')}</section>` : ''}

        ${state.planGenerating ? `<section class="plan-generating"><span class="plan-spinner">${icon('doc')}</span><div><strong>正在进入工作区</strong></div></section>` : ''}

        <aside class="live-brief">
          <header><span>视频方案</span><strong>正在形成</strong></header>
          <div class="brief-signal ${outcome !== '等待确认' ? 'filled' : ''}"><span>核心判断</span><strong>${outcome}</strong></div>
          <div class="brief-signal ${source !== '等待确认' ? 'filled' : ''}"><span>素材策略</span><strong>${source}</strong></div>
          <div class="brief-signal ${response !== '等待确认' ? 'filled' : ''}"><span>传播动作</span><strong>${response}</strong></div>
          <div class="brief-boundary"><span>${icon('doc')}</span><p><strong>生成视频方案</strong></p></div>
        </aside>
      </section>
    </main>`;
}

const importAnalysisSteps = [
  {
    label: '读取视觉内容',
    title: '4 段视频已完成镜头级理解',
    detail: '识别到后备箱取物、湖边晚餐、多人露营桌与帐篷阅读四个连续使用场景。'
  },
  {
    label: '识别产品与卖点',
    title: '主体是一盏便携式户外氛围灯',
    detail: '高频视觉线索：金属提手、柔和暖光、轻量便携，以及从黄昏延伸到夜晚的照明能力。'
  },
  {
    label: '推断创作意图',
    title: '建议制作线上电商产品宣传短片',
    detail: '现有素材已经覆盖“携带—用餐—聚会—睡前”场景，适合 25 秒 9:16 种草结构。'
  },
  {
    label: '规划自动任务',
    title: '旁白、BGM、卖点字幕和粗剪已排好依赖',
    detail: '不生成新产品画面；优先使用真实素材，完成配音、音乐、字幕和节奏组装。'
  }
];

function renderImportAnalysis() {
  const completed = Math.min(state.analysisStep, importAnalysisSteps.length);
  return `
    <main class="ideation-shell import-analysis-shell">
      <header class="ideation-topbar">
        <button class="icon-button" data-action="go-home" aria-label="返回首页">${icon('back')}</button>
        <div class="brand ideation-brand"><span class="brand-mark">${brandMark()}</span><span>Medeo</span><small>PRO</small></div>
        <div class="ideation-progress"><span>素材理解</span><div>${importAnalysisSteps.map((_, index) => `<i class="${index < completed ? 'done' : index === completed ? 'active' : ''}"></i>`).join('')}</div><strong>${completed} / 4</strong></div>
        <span class="analysis-auto-label"><i></i>Agent 自动分析</span>
      </header>

      <section class="focus-chat-layout import-focus-layout">
        <div class="focus-conversation">
          <div class="import-source-strip">
            ${lampVideoAssets.map((asset, index) => `<article><div><video src="${asset.url}" muted playsinline preload="auto"></video><span>${String(index + 1).padStart(2, '0')}</span></div><strong>${asset.name.replace('.mp4', '')}</strong><small>${asset.duration} · 9:16</small></article>`).join('')}
          </div>

          <div class="analysis-sequence">
            ${importAnalysisSteps.map((step, index) => `<article class="analysis-result ${index < completed ? 'done' : index === completed && !state.analysisComplete ? 'active' : 'pending'}"><span class="analysis-index">${index < completed ? '✓' : String(index + 1).padStart(2, '0')}</span><div><small>${step.label}</small><strong>${step.title}</strong><p>${step.detail}</p></div>${index === completed && !state.analysisComplete ? '<i class="analysis-spinner"></i>' : ''}</article>`).join('')}
          </div>

          ${state.analysisComplete ? `<section class="import-confirm-card"><div class="confirm-copy"><h2>25 秒电商产品片方案已就绪</h2></div><div class="import-confirm-summary"><div><span>产品</span><strong>便携式户外氛围灯</strong></div><div><span>输出</span><strong>25 秒 · 9:16 · 电商种草</strong></div><div><span>素材</span><strong>使用全部 4 段原素材</strong></div></div><div class="import-task-preview">${lampTasks.slice(1).map(task => `<span>${icon(task.id === 'voice' ? 'chat' : task.id === 'bgm' ? 'audio' : task.id === 'caption' ? 'doc' : 'timeline')}<b>${task.title}</b></span>`).join('')}</div>${button('确认并开始制作', 'confirm-import-plan', 'primary')}</section>` : `<div class="analysis-waiting"><span></span><p><strong>正在分析素材</strong></p></div>`}
        </div>

        <aside class="live-brief analysis-brief">
          <header><span>素材分析</span><strong>${state.analysisComplete ? '方案已就绪' : '进行中'}</strong></header>
          <div class="brief-signal ${completed >= 1 ? 'filled' : ''}"><span>素材</span><strong>${completed >= 1 ? '4 段 · 27 秒 · 9:16' : '读取中'}</strong></div>
          <div class="brief-signal ${completed >= 2 ? 'filled' : ''}"><span>产品</span><strong>${completed >= 2 ? '便携式户外氛围灯' : '识别中'}</strong></div>
          <div class="brief-signal ${completed >= 3 ? 'filled' : ''}"><span>方向</span><strong>${completed >= 3 ? '线上电商产品宣传' : '推断中'}</strong></div>
          <div class="brief-signal ${completed >= 4 ? 'filled' : ''}"><span>制作方式</span><strong>${completed >= 4 ? '已有素材 + AI 后期' : '规划中'}</strong></div>
          <div class="brief-boundary"><span>${icon('task')}</span><p><strong>${state.analysisComplete ? '等待确认' : '正在生成方案'}</strong></p></div>
        </aside>
      </section>
    </main>`;
}

const demoAudio = [
  { id: 'room-tone', name: 'HomeBar_RoomTone.wav', type: 'Ambient audio', duration: '00:42', tone: 'mint' },
  { id: 'music-bed', name: 'Warm_Minimal_Bed.mp3', type: 'BGM draft', duration: '01:18', tone: 'plum' }
];

function getWorkspaceItems(section = state.leftSection) {
  if (section === 'docs') {
    const docs = state.freshWorkspace ? state.docs.filter(doc => doc.id === activeProject().docId) : state.docs;
    return docs.length ? docs : state.docs.slice(0, 1);
  }
  if (section === 'tasks') return state.tasks;
  if (section === 'activity') return [];
  if (section === 'video') {
    const shotTask = state.tasks.find(task => task.id === 'shots');
    const visibleVideos = state.projectType === 'romance' && shotTask?.state !== 'done'
      ? activeProject().videos.slice(0, Math.floor(shotTask.progress / 25))
      : activeProject().videos;
    return [...state.importedAssets.filter(asset => asset.kind === 'video'), ...visibleVideos, ...(state.freshWorkspace ? [] : seededAssets.filter(asset => !['Audio', 'Reference'].includes(asset.type)))];
  }
  if (section === 'audio') {
    const generatedAudio = { id: `${state.projectType}-generated-audio`, name: activeProject().audioName, type: state.running ? 'AI audio · 生成中' : 'AI audio', duration: activeProject().duration, tone: 'mint' };
    return [...state.importedAssets.filter(asset => asset.kind === 'audio'), generatedAudio, ...(state.freshWorkspace ? [] : seededAssets.filter(asset => asset.type === 'Audio')), ...(state.projectType === 'romance' ? demoAudio : [])];
  }
  return [...state.importedAssets.filter(asset => asset.kind === 'image'), ...(state.projectType === 'romance' ? caseImageAssets : [])];
}

function renderWorkspaceLibrary() {
  const config = {
    docs: '文档',
    tasks: '任务',
    activity: 'Activity',
    video: '视频',
    audio: '音频',
    images: '图片'
  }[state.leftSection];
  if (state.leftSection === 'activity') {
    const project = activeProject();
    const runningTask = state.tasks.find(task => task.state === 'running');
    return `
      <div class="library-head"><div><h2>${config}</h2></div><span class="activity-live-dot"></span></div>
      <div class="inline-activity-list">
        <article><span class="activity-time">${formatTime(state.elapsed)}</span><div><strong>${state.complete ? 'Cut v1 已组装' : runningTask ? `${runningTask.title}进行中` : '正在检查任务依赖'}</strong><p>${state.complete ? project.output : `${state.tasks.filter(task => task.state === 'done').length}/${state.tasks.length} 已完成`}</p></div></article>
        <article><span class="activity-time">00:02</span><div><strong>${state.projectType === 'lamp' ? '产品片方案已确认' : '视频方案已确认'}</strong><p>${state.projectType === 'lamp' ? '4 段户外灯素材' : '开始生成 4 段 Home Bar 视频'}</p></div></article>
        <article><span class="activity-time">00:00</span><div><strong>开始制作</strong><p>${project.tasks.length - 1} 个任务</p></div></article>
      </div>`;
  }
  const items = getWorkspaceItems();
  return `
    <div class="library-head"><div><h2>${config}</h2></div><button class="icon-button small" aria-label="添加${config}">${icon('plus')}</button></div>
    <div class="project-browser-list">
      ${items.map((item, index) => renderProjectBrowserItem(item, index)).join('')}
    </div>`;
}

function renderProjectBrowserItem(item, index) {
  if (state.leftSection === 'docs') {
    return `<button class="project-browser-item document" data-action="preview-item" data-kind="docs" data-id="${item.id}"><span class="doc-monogram">${item.icon}</span><span><strong>${item.title}</strong><small>${item.meta}</small></span><i>${icon('focus')}</i></button>`;
  }
  if (state.leftSection === 'tasks') {
    const status = item.state === 'done' ? '已完成' : item.state === 'running' ? '进行中' : item.state === 'blocked' ? '等待依赖' : '待开始';
    return `<button class="project-browser-item task ${item.state}" data-action="preview-item" data-kind="tasks" data-id="${item.id}"><span class="browser-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${item.title}</strong><small>${status} · ${item.cost} credits</small></span><i>${icon('focus')}</i></button>`;
  }
  const kind = state.leftSection;
  const preview = item.url && item.kind === 'image'
    ? `<img src="${item.url}" alt=""/>`
    : item.poster && item.kind === 'video'
      ? `<img src="${item.poster}" alt=""/>`
      : item.url && item.kind === 'video'
        ? `<video src="${item.url}" muted playsinline preload="auto"></video>`
      : `<span>${kind === 'audio' ? icon('audio') : kind === 'video' ? icon('play') : String(index + 1).padStart(2, '0')}</span>`;
  return `<button class="project-browser-item media" data-action="preview-item" data-kind="${kind}" data-id="${item.id}"><span class="browser-thumb ${item.tone || 'blue'}">${preview}</span><span><strong>${item.name}</strong><small>${item.type || kind} · ${item.duration || '参考'}</small></span><i>${icon('focus')}</i></button>`;
}

function findPreviewItem(kind, id) {
  return getWorkspaceItems(kind).find(entry => entry.id === id);
}

function renderPreviewLayer() {
  if (!state.previewItem) return '';
  const { kind, item } = state.previewItem;
  let body = '';
  if (kind === 'docs') {
    if (item.id === 'lamp-plan') {
      body = `<div class="preview-document lamp-proposal"><span class="doc-type">产品视频方案 · V1</span><h2>一盏灯，点亮每一次出发</h2><p>抖音商城 / Reels · 25 秒 · 9:16</p><div><section><span>产品</span><strong>便携式户外氛围灯</strong></section><section><span>卖点</span><strong>便携提手 · 柔和暖光 · 多场景</strong></section><section><span>制作</span><strong>已有素材 + AI 旁白/BGM/字幕</strong></section></div><div class="proposal-video-strip">${lampVideoAssets.map((asset, index) => `<figure><video src="${asset.url}" muted playsinline preload="auto"></video><figcaption>${String(index + 1).padStart(2, '0')} · ${asset.name.replace('.mp4', '')}</figcaption></figure>`).join('')}</div><ol><li><b>00–05</b> 从后备箱随手提走：轻松带到任何地方</li><li><b>05–11</b> 湖边晚餐：柔和暖光让餐桌更有氛围</li><li><b>11–18</b> 露营聚会：成为夜晚自然的视觉中心</li><li><b>18–25</b> 帐篷阅读：从聚会陪伴到一个人的安静时刻</li></ol></div>`;
    } else {
      const answer = id => escapeHTML(state.ideaAnswers.find(entry => entry.id === id)?.value || '待补充');
      body = `<div class="preview-document"><span class="doc-type">视频方案 · V1</span><h2>别急着追：高跟鞋御姐的关系判断</h2><p>抖音 · 40 秒 · 9:16 · Home Bar</p><div><section><span>核心判断</span><strong>${answer('outcome')}</strong></section><section><span>素材策略</span><strong>${answer('source')}</strong></section><section><span>传播动作</span><strong>${answer('response')}</strong></section></div><div class="proposal-visual-strip"><figure><img src="${caseImageAssets[0].url}" alt="林雨婕角色设定"/><figcaption>人物参考</figcaption></figure>${caseVideoAssets.map((asset, index) => `<figure><img src="${asset.poster}" alt="镜头 ${index + 1}"/><figcaption>${String(index + 1).padStart(2, '0')} · ${asset.name.replace('.mp4', '')}</figcaption></figure>`).join('')}</div><ol><li><b>00–05</b> “你越用力追，她为什么越想躲？”</li><li><b>05–15</b> 先让人舒服，再谈让人心动</li><li><b>15–28</b> 尊重边界，并让自己的生活有吸引力</li><li><b>28–40</b> 好的靠近，是让她也愿意向你走一步</li></ol></div>`;
    }
  } else if (kind === 'video') {
    body = item.url
      ? `<div class="preview-video real-media"><video src="${item.url}" poster="${item.poster || ''}" controls playsinline preload="metadata"></video></div>`
      : `<div class="preview-video ${item.tone || 'blue'}"><span class="preview-orb"></span><button class="preview-play">${icon('play')}</button><small>00:00 / ${item.duration || '00:24'}</small></div>`;
  } else if (kind === 'audio') {
    body = `<div class="preview-audio"><button class="preview-play">${icon('play')}</button><div class="large-waveform">${Array.from({ length: 76 }, (_, i) => `<i style="--h:${18 + ((i * 23) % 72)}%"></i>`).join('')}</div><div><span>00:00</span><span>${item.duration || '00:42'}</span></div></div>`;
  } else if (kind === 'images') {
    body = item.url
      ? `<div class="preview-image real-media"><img src="${item.url}" alt="${escapeHTML(item.name)}"/><small>${escapeHTML(item.name)}</small></div>`
      : `<div class="preview-image ${item.tone || 'blue'}"><span>${escapeHTML(item.type || 'VISUAL REFERENCE')}</span><div class="preview-figure"><i></i><b></b></div><small>${escapeHTML(item.name)}</small></div>`;
  } else {
    body = `<div class="preview-task"><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(item.detail)}</p><div><span>状态</span><strong>${item.state === 'done' ? '已完成' : item.state === 'running' ? '进行中' : '等待开始'}</strong></div><div class="node-progress"><i style="width:${item.progress}%"></i></div><small>${item.cost} credits</small></div>`;
  }
  return `<div class="preview-layer"><button class="preview-scrim" data-action="close-preview" aria-label="关闭预览"></button><section class="preview-dialog" role="dialog" aria-modal="true" aria-label="${escapeHTML(item.title || item.name)}"><header><div><strong>${escapeHTML(item.title || item.name)}</strong></div><button class="icon-button" data-action="close-preview" aria-label="关闭预览">${icon('close')}</button></header><div class="preview-body">${body}</div></section></div>`;
}

function renderLibrary() {
  if (state.workspaceFixed) return renderWorkspaceLibrary();
  if (state.activeTool === 'docs') {
    return `
      <div class="library-head"><div><span class="eyebrow">PROJECT KNOWLEDGE</span><h2>文档</h2></div><button class="icon-button small" data-action="new-doc" aria-label="新建文档">${icon('plus')}</button></div>
      <p class="library-intro">Agent 与你共同维护的项目上下文。</p>
      <div class="doc-list">
        ${state.docs.map(doc => `
          <button class="doc-row ${state.activeDoc === doc.id ? 'active' : ''}" data-action="select-doc" data-id="${doc.id}">
            <span class="doc-monogram">${doc.icon}</span>
            <span><strong>${doc.title}</strong><small>${doc.meta}</small></span>
            ${doc.status === 'draft' ? '<em>草稿</em>' : ''}
          </button>`).join('')}
      </div>
      ${state.stageMode === 'editor' && state.activeDoc === 'video-plan' ? `<div class="docked-plan"><span>${icon('doc')}</span><div><strong>视频方案</strong></div><button data-action="open-active-doc">查看</button></div>` : ''}`;
  }

  if (state.activeTool === 'media') {
    const count = seededAssets.length + state.importedAssets.length;
    return `
      <div class="library-head"><div><span class="eyebrow">SOURCE LIBRARY</span><h2>素材</h2></div><label class="icon-button small file-label" role="button" tabindex="0" aria-label="导入素材">${icon('plus')}<input id="asset-input" type="file" accept="video/*,image/*,audio/*,.pdf" multiple /></label></div>
      <p class="library-intro">${count} 个素材 · AI 分析完成</p>
      <div class="asset-filter"><button class="active">全部</button><button>视频</button><button>音频</button></div>
      <div class="mini-asset-list">
        ${[...state.importedAssets, ...seededAssets].slice(0, 8).map(asset => miniAsset(asset)).join('')}
      </div>
      <label class="drop-compact file-label" role="button" tabindex="0">${icon('upload')}<span>添加本地素材<small>文件只在浏览器中预览</small></span><input id="asset-input-secondary" type="file" accept="video/*,image/*,audio/*,.pdf" multiple /></label>`;
  }

  if (state.activeTool === 'timeline') {
    return `
      <div class="library-head"><div><span class="eyebrow">EDIT STRUCTURE</span><h2>镜头</h2></div><button class="icon-button small">${icon('plus')}</button></div>
      <p class="library-intro">40 秒 · 4 个段落 · 4 段已有素材</p>
      <div class="shot-outline">
        ${timelineClips.map((clip, i) => `<button class="shot-row"><span>${String(i + 1).padStart(2, '0')}</span><i class="${clip.tone}"></i><strong>${clip.title}</strong><small>${clip.range}</small></button>`).join('')}
      </div>`;
  }

  return `
    <div class="library-head"><div><span class="eyebrow">AGENT RUN</span><h2>任务</h2></div></div>
    <p class="library-intro">一个统一的执行状态。</p>
    <div class="run-summary"><strong>${state.complete ? '6 / 6' : `${state.tasks.filter(t => t.state === 'done').length} / 6`}</strong><span>${state.complete ? '已完成' : '正在执行'}</span></div>
    <div class="cost-summary"><span>预计成本</span><strong>${state.tasks.reduce((sum, task) => sum + task.cost, 0)} credits</strong><span>已使用 ${state.tasks.filter(t => t.state === 'done').reduce((sum, t) => sum + t.cost, 0)}</span></div>`;
}

function miniAsset(asset) {
  const media = asset.url && asset.kind === 'image'
    ? `<img src="${asset.url}" alt="" />`
    : asset.url && asset.kind === 'video'
      ? `<video src="${asset.url}" muted preload="metadata"></video>`
      : `<span>${asset.type?.slice(0, 1) || 'M'}</span>`;
  return `<button class="mini-asset"><span class="mini-preview ${asset.tone || 'blue'}">${media}</span><span><strong>${asset.name}</strong><small>${asset.type || asset.kind} · ${asset.duration || '本地'}</small></span><i class="status-dot"></i></button>`;
}

function renderStage() {
  if (state.workspaceFixed) return renderTimelineStage(true);
  if (state.activeTool === 'docs') return state.stageMode === 'editor' ? renderTimelineStage(true) : renderDocument();
  if (state.activeTool === 'media') return renderMediaStage();
  if (state.activeTool === 'timeline') return renderTimelineStage();
  return renderTaskStage();
}

function renderDocument() {
  if (state.activeDoc === 'concepts') return renderConcepts();
  const doc = state.docs.find(item => item.id === state.activeDoc) || state.docs[0];
  const answerValue = id => state.ideaAnswers.find(answer => answer.id === id)?.value || '待确认';
  const content = {
    'video-plan': `
      <div class="doc-hero plan-document-hero">
        <span class="doc-type">视频方案 · V1</span>
        <h1 contenteditable="true">别急着追：高跟鞋御姐的关系判断</h1>
        <p contenteditable="true">林雨婕在暖色 Home Bar 直视镜头，用四个递进动作讲清楚：真正有效的追求，不是更用力地证明自己，而是让对方舒服、有选择，并愿意向你走一步。</p>
        <div class="plan-origin">${icon('chat')}<span>创作对话</span></div>
      </div>
      <div class="proposal-summary">
        <section><span>核心判断</span><strong>${escapeHTML(answerValue('outcome'))}</strong><p>前 3 秒用“越追越远”的反差建立停留理由。</p></section>
        <section><span>镜头策略</span><strong>${escapeHTML(answerValue('source'))}</strong><p>生成四段角色一致的 Home Bar 镜头。</p></section>
        <section><span>传播动作</span><strong>${escapeHTML(answerValue('response'))}</strong><p>用三个可复述判断承接收藏，并用问题邀请评论。</p></section>
      </div>
      <section class="proposal-assets"><div><h2>角色与镜头计划</h2></div><div class="proposal-asset-grid"><figure class="character"><img src="${caseImageAssets[0].url}" alt="林雨婕角色设定"/><figcaption><strong>林雨婕 · 25</strong><span>冷静、优雅、克制 · 高跟鞋御姐</span></figcaption></figure>${caseVideoAssets.map((asset, index) => `<figure><img src="${asset.poster}" alt="${asset.name}"/><figcaption><strong>${String(index + 1).padStart(2, '0')} · ${asset.type.replace('Home Bar · ', '')}</strong><span>${asset.duration}</span></figcaption></figure>`).join('')}</div></section>
      <section class="proposal-structure"><div><h2>40 秒结构</h2></div><div class="proposal-beats"><article><b>00–05</b><span><strong>微笑中近景 · 反常识开场</strong><p>“你越用力追，她为什么越想躲？”</p></span></article><article><b>05–15</b><span><strong>举杯 · 第一层判断</strong><p>先让一个人觉得舒服，再谈让她心动。</p></span></article><article><b>15–28</b><span><strong>指向镜头 · 两个行动原则</strong><p>尊重边界；把自己的生活过得有吸引力。</p></span></article><article><b>28–40</b><span><strong>吧台全景 · 留白收束</strong><p>好的靠近，是让她也愿意向你走一步。你认同吗？</p></span></article></div></section>
      <section class="proposal-next"><div><h2>剪辑约束</h2></div><ul><li><span>01</span>只从四段原素材选取动作最完整的区间</li><li><span>02</span>字幕每屏不超过两行，关键词使用低饱和紫色</li><li><span>03</span>保留 Home Bar 环境声；观点停顿处留 6–10 帧呼吸</li></ul></section>`,
    'lamp-plan': `
      <div class="doc-hero plan-document-hero">
        <span class="doc-type">产品视频方案 · V1</span>
        <h1 contenteditable="true">一盏灯，点亮每一次出发</h1>
        <p contenteditable="true">用四段真实户外生活素材建立“随手带走—点亮晚餐—陪伴聚会—安静阅读”的使用路径，把便携、暖光和多场景转成一条 25 秒电商种草短片。</p>
        <div class="plan-origin">${icon('spark')}<span>素材分析</span></div>
      </div>
      <div class="proposal-summary"><section><span>识别产品</span><strong>便携式户外氛围灯</strong><p>金属提手、柔和暖光、露营与湖边场景形成稳定识别。</p></section><section><span>发布方向</span><strong>线上电商产品宣传</strong><p>抖音商城 / Reels · 9:16 · 25 秒自然种草。</p></section><section><span>制作方式</span><strong>已有素材 + AI 后期</strong><p>不新增产品镜头；生成旁白、BGM、字幕并完成粗剪。</p></section></div>
      <section class="proposal-assets"><div><h2>素材</h2></div><div class="proposal-asset-grid lamp-assets">${lampVideoAssets.map((asset, index) => `<figure><video src="${asset.url}" muted playsinline preload="auto"></video><figcaption><strong>${String(index + 1).padStart(2, '0')} · ${asset.name.replace('.mp4', '')}</strong><span>${asset.duration}</span></figcaption></figure>`).join('')}</div></section>
      <section class="proposal-structure"><div><h2>25 秒结构</h2></div><div class="proposal-beats">${lampTimelineClips.map((clip, index) => `<article><b>${clip.range.replaceAll('00:', '')}</b><span><strong>${clip.title}</strong><p>${['从后备箱随手提走，建立轻巧便携的第一印象。','暖光落在湖边餐桌上，把功能转成可感知的氛围。','多人露营桌展示它可以成为夜晚自然的视觉中心。','帐篷阅读收束到安静陪伴，留下“一盏灯，多种夜晚”。'][index]}</p></span></article>`).join('')}</div></section>
      <section class="proposal-next"><div><h2>制作任务</h2></div><ul><li><span>01</span>生成 25 秒自然种草旁白</li><li><span>02</span>生成轻户外木吉他 BGM</li><li><span>03</span>生成三组卖点字幕并完成粗剪混音</li></ul></section>`,
    brief: `
      <div class="doc-hero">
        <span class="doc-type">CREATIVE BRIEF · V1</span>
        <h1 contenteditable="true">让观众主动靠近：30 秒关系建议短片</h1>
        <p contenteditable="true">用一个克制、专业的镜头前表达，讲清楚“追求不是说服，而是创造被靠近的理由”。</p>
      </div>
      <div class="brief-grid">
        <section><span>目标</span><h3>提高完播率</h3><p>前 3 秒建立反常识观点，结尾留下可转发的句子。</p></section>
        <section><span>受众</span><h3 contenteditable="true">20–35 岁都市用户</h3><p>对关系沟通、个人成长内容感兴趣。</p></section>
        <section><span>发布</span><h3>抖音 / Reels</h3><p>9:16 · 30 秒 · 中文字幕</p></section>
        <section><span>素材策略</span><h3>已有素材 + AI 补镜头</h3><p>优先使用已导入素材，只生成 3 个缺失镜头。</p></section>
      </div>
      <section class="decision-block"><div><span class="eyebrow">CORE DECISION</span><h2>创作约束</h2></div><ul><li>不使用夸张“爆款”视觉语言</li><li>人物语气冷静、可信，避免说教</li><li>环境声保留，BGM 控制在 -12dB</li></ul></section>`,
    insights: `
      <div class="doc-hero"><span class="doc-type">MATERIAL INTELLIGENCE</span><h1>素材洞察</h1><p>Agent 已从画面、语音和品牌资料中提取可用于剪辑的事实。</p></div>
      <div class="insight-list"><article><b>01</b><div><h3>最强开场在 Interview_A 00:42</h3><p>一句完整观点，停顿自然，可直接作为前 3 秒 hook。</p></div><em>92%</em></article><article><b>02</b><div><h3>HomeBar_Wide 可建立统一空间</h3><p>色温和品牌参考接近，适合承接 3 个 AI 补充镜头。</p></div><em>88%</em></article><article><b>03</b><div><h3>现有素材缺少明确收尾动作</h3><p>建议生成一个看向镜头的近景，不需要重做整条视频。</p></div><em>建议补拍</em></article></div>`,
    script: `
      <div class="doc-hero"><span class="doc-type">SCRIPT · DRAFT</span><h1>旁白与分镜脚本</h1><p>40 秒结构；每一句都与现有素材的动作和景别保持关联。</p></div>
      <div class="script-table"><div class="script-row head"><span>时间</span><span>画面</span><span>旁白</span></div>${timelineClips.map((clip, index) => `<div class="script-row"><span>${clip.range.replace('00:', '')}</span><span>${clip.title}<br/><i>@${caseVideoAssets[index].name}</i></span><p contenteditable="true">${['你越用力追，她为什么越想躲？','第一，先让她觉得舒服，再谈让她心动。','第二，尊重她的边界。第三，别把全部价值都放在“追到她”这件事上。','好的靠近，是让她也愿意向你走一步。你认同吗？'][index]}</p></div>`).join('')}</div>`,
    'edit-plan': `
      <div class="doc-hero"><span class="doc-type">EDIT PLAN · V1</span><h1>粗剪计划</h1><p>把 AI 行为变成可审阅的剪辑决策，而不是不可读的工具日志。</p></div>
      <div class="edit-plan-list">${timelineClips.map((clip, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${clip.title}</h3><p>${clip.range} · ${index === 0 ? '已有素材' : '已有素材 + AI 补镜头'}</p></div><button>在时间线打开</button></article>`).join('')}</div>`,
    'v2-plan': `
      <div class="doc-hero"><span class="doc-type">NEXT ITERATION</span><h1>V2 品牌片方向</h1><p>由独立对话 Session 保存，不影响当前版本。</p></div>
      <div class="decision-block"><div><span class="eyebrow">DIRECTION</span><h2>16:9 品牌叙事版</h2></div><ul><li>保留同一人物与空间，扩展为 60 秒</li><li>增加幕后素材和真实制作过程</li><li>面向 B 站与官网，语气更专业</li></ul></div>`
  };
  return `
    <article class="document-stage">
      <header class="stage-toolbar"><div><span class="breadcrumb">Docs / ${doc.type}</span><strong>${doc.title}</strong></div><div class="stage-actions"><span class="save-state">✓ 已保存 · ${state.savedAt}</span><button class="icon-button small">${icon('more')}</button></div></header>
      <div class="document-page" data-edit-surface>${content[doc.id] || content.brief}</div>
    </article>`;
}

function renderConcepts() {
  return `
    <article class="concept-stage">
      <header class="stage-toolbar"><div><span class="breadcrumb">Brief / Creative directions</span><strong>选择一个创作方向</strong></div><span class="save-state">低成本草案 · 未执行生成</span></header>
      <div class="concept-intro"><span class="eyebrow">AGENT PROPOSAL</span><h1>三个可以继续发展的方向</h1><p>方向来自当前 Brief 和素材，不会在选择前消耗视频生成 credits。</p></div>
      <div class="concept-grid">
        ${concepts.map(concept => `<button class="concept-card ${state.selectedConcept === concept.id ? 'selected' : ''}" data-action="select-concept" data-id="${concept.id}"><div class="concept-visual ${concept.id}"><span>${concept.label}</span><strong>${concept.score}</strong></div><div class="concept-copy"><h3>${concept.title}</h3><p>${concept.description}</p><div>${concept.tags.map(tag => `<span>${tag}</span>`).join('')}</div></div><i class="radio-mark"></i></button>`).join('')}
      </div>
      <footer class="concept-footer"><p><strong>下一步：</strong>确认方向后，Agent 会生成可审阅的任务拆解和成本预估。</p>${button('使用这个方向', 'show-confirm', 'primary')}</footer>
    </article>`;
}

function renderMediaStage() {
  const assets = [...state.importedAssets, ...seededAssets];
  return `
    <section class="media-stage">
      <header class="stage-toolbar"><div><span class="breadcrumb">Workspace / Media</span><strong>素材地图</strong></div><div class="stage-actions"><button class="button quiet small-button">按场景</button><button class="button quiet small-button">按人物</button></div></header>
      <div class="media-summary"><div><span class="eyebrow">AI UNDERSTANDING</span><h1>${assets.length} 个素材已经可以被检索</h1><p>人物、场景、语音和可用镜头已完成模拟分析。点击“用于 Brief”不会启动生成。</p></div><label class="button primary file-label">${icon('upload')} 导入你的素材<input id="asset-input-main" type="file" accept="video/*,image/*,audio/*,.pdf" multiple /></label></div>
      <div class="media-board">
        ${assets.map(asset => {
          const preview = asset.url && asset.kind === 'image' ? `<img src="${asset.url}" alt="${asset.name}" />` : asset.url && asset.kind === 'video' ? `<video src="${asset.url}" muted preload="metadata"></video>` : `<div class="generated-preview ${asset.tone || 'blue'}"><span>${asset.type?.toUpperCase() || asset.kind?.toUpperCase()}</span><i></i></div>`;
          return `<article class="asset-card">${preview}<div><span>${asset.type || asset.kind}</span><strong>${asset.name}</strong><small>${asset.duration || '本地文件'} · <b>AI 已理解</b></small></div><button class="icon-button small">${icon('more')}</button></article>`;
        }).join('')}
        <label class="asset-add file-label">${icon('plus')}<strong>添加素材</strong><small>视频、图片、音频或文档</small><input id="asset-input-board" type="file" accept="video/*,image/*,audio/*,.pdf" multiple /></label>
      </div>
    </section>`;
}

function renderTimelineStage(asWorkspace = false) {
  const project = activeProject();
  const segments = playbackSegments(project);
  const totalDuration = parseTimecode(project.duration);
  const playbackTime = Math.min(totalDuration, Math.max(0, state.playbackTime));
  const activeSegment = segments.find(segment => playbackTime < segment.end) || segments.at(-1);
  const activeClipIndex = Math.min(project.videos.length - 1, Math.max(0, state.playbackClipIndex ?? activeSegment?.index ?? 0));
  const primaryVideo = project.videos[activeClipIndex] || project.videos[0];
  const shotTask = state.tasks.find(task => task.id === 'shots');
  const isGeneratingShots = state.projectType === 'romance' && shotTask && shotTask.state !== 'done';
  const generatedShotCount = isGeneratingShots ? Math.min(project.clips.length, Math.floor(shotTask.progress / 25)) : project.clips.length;
  const playheadLabel = formatPlaybackTime(playbackTime);
  const playheadPosition = totalDuration ? playbackTime / totalDuration * 100 : 0;
  const playerContent = isGeneratingShots
    ? `<div class="video-generation-state"><div class="generation-character"><img src="${caseImageAssets[0].url}" alt="林雨婕角色设定"/><span>角色参考</span></div><div class="generation-copy"><span>正在生成视频</span><h2>四段 Home Bar 镜头</h2><p>角色一致性 · 9:16 · 40 秒</p><div class="generation-progress"><i style="width:${shotTask.progress}%"></i></div><strong data-generation-progress>${Math.round(shotTask.progress)}%</strong></div><div class="generation-shot-grid">${project.clips.map((clip, index) => `<span data-generation-shot="${index}" class="${index < generatedShotCount ? 'ready' : index === generatedShotCount ? 'working' : 'pending'}">${index < generatedShotCount ? `<img src="${clip.poster}" alt=""/>` : icon('spark')}<small>${index < generatedShotCount ? '已生成' : index === generatedShotCount ? '生成中' : '等待'}</small></span>`).join('')}</div></div>`
    : `<video class="workspace-preview-video" src="${primaryVideo.url}" ${primaryVideo.poster ? `poster="${primaryVideo.poster}"` : ''} data-sequence-index="${activeClipIndex}" playsinline preload="auto" aria-label="四段视频顺序预览"></video>`;
  const timelineClipsMarkup = project.clips.map((clip, index) => {
    if (!isGeneratingShots) return `<div class="timeline-clip ${clip.tone} ${index === activeClipIndex ? 'is-active' : ''}" data-playback-clip="${index}" style="--clip-width:${clip.width}%"><span class="clip-thumb">${clip.poster ? `<img src="${clip.poster}" alt=""/>` : `<video src="${clip.source}" muted playsinline preload="auto"></video>`}</span><strong>${clip.title}</strong><small>${clip.range}</small></div>`;
    const status = index < generatedShotCount ? 'ready' : index === generatedShotCount ? 'working' : 'pending';
    return `<div class="timeline-clip generation-slot ${status}" data-generation-clip="${index}" style="--clip-width:${clip.width}%"><span class="clip-thumb">${status === 'ready' ? `<img src="${clip.poster}" alt=""/>` : icon('spark')}</span><strong>${status === 'ready' ? clip.title : `镜头 ${String(index + 1).padStart(2, '0')}`}</strong><small>${status === 'ready' ? clip.range : status === 'working' ? '生成中' : '等待生成'}</small></div>`;
  }).join('');
  return `
    <section class="timeline-stage ${asWorkspace ? 'workspace-edit-stage' : ''}">
      ${asWorkspace ? '' : `<header class="stage-toolbar"><div><span class="breadcrumb">Workspace / Cut v1</span><strong>${project.duration.replace('00:', '')} 秒粗剪</strong></div><div class="stage-actions"><span class="save-state">9:16 · 1080 × 1920</span><button class="button quiet small-button">预览</button></div></header>`}
      <div class="player-area"><div class="player-frame"><div class="video-viewport ${isGeneratingShots ? 'is-generating' : ''}">${playerContent}</div><div class="viewer-controls"><span class="viewer-time">${isGeneratingShots ? '生成中' : `<b data-playback-current>${formatPlaybackTime(playbackTime, true)}</b> <i>/ ${project.duration}.00</i>`}</span>${isGeneratingShots ? '<span></span>' : `<button class="viewer-play ${state.previewPlaying ? 'is-playing' : ''}" data-action="toggle-preview-play" aria-label="${state.previewPlaying ? '暂停预览' : '播放预览'}">${icon(state.previewPlaying ? 'pause' : 'play')}</button>`}<span class="viewer-format" aria-label="画面比例 9:16"><span class="viewer-static-icon">${icon('focus')}</span><span class="viewer-static-icon">${icon('aspect')}</span><strong>9:16</strong></span></div></div></div>
      <div class="timeline-editor" ${isGeneratingShots ? '' : 'data-playback-timeline="true"'}><div class="timeline-head"><div><span class="timeline-status ${state.running ? 'working' : ''}"></span><strong>Cut v1</strong><small>${isGeneratingShots ? '正在生成镜头' : state.running ? 'Agent 正在组装' : '已保存'}</small></div><div><button title="撤销" aria-label="撤销">${icon('undo')}</button><button title="重做" aria-label="重做">${icon('redo')}</button><span></span><button aria-label="缩小时间线">${icon('minus')}</button><i></i><button aria-label="放大时间线">${icon('plus')}</button></div></div><div class="time-ruler">${project.ruler.map(time => `<span>${time}</span>`).join('')}</div><div class="track"><b>V1</b><div class="clip-row">${timelineClipsMarkup}</div></div><div class="track audio"><b>A1</b><div class="waveform ${state.running && !isGeneratingShots ? 'is-generating' : 'is-pending'}">${Array.from({ length: 58 }, (_, i) => `<i style="--h:${18 + ((i * 17) % 58)}%"></i>`).join('')}</div></div>${isGeneratingShots ? '' : `<div class="timeline-playback-layer"><div class="playhead" style="left:${playheadPosition}%"><span>${playheadLabel}</span></div></div>`}</div>
    </section>`;
}

function renderTaskStage() {
  const done = state.tasks.filter(task => task.state === 'done').length;
  const project = activeProject();
  const totalCost = state.tasks.reduce((sum, task) => sum + task.cost, 0);
  return `
    <section class="task-stage">
      <header class="stage-toolbar"><div><span class="breadcrumb">Agent run / Production</span><strong>${state.complete ? '制作完成' : '正在执行已确认任务'}</strong></div><div class="stage-actions"><span class="save-state">${formatTime(state.elapsed)} · ${totalCost} credits 预计</span><button class="button quiet small-button" data-action="toggle-activity">Activity</button></div></header>
        <div class="run-header"><div><h1>${state.complete ? '成片已准备好审阅' : '正在制作'}</h1><p>${state.complete ? project.output : '旁白、音乐、字幕和粗剪按顺序推进。'}</p></div><div class="run-ring" style="--progress:${Math.round(done / state.tasks.length * 100)}"><strong>${done}<small>/${state.tasks.length}</small></strong><span>完成</span></div></div>
      <div class="task-graph">
        ${state.tasks.map((task, index) => `<article class="task-node ${task.state}"><div class="node-index">${task.state === 'done' ? '✓' : String(index + 1).padStart(2, '0')}</div><div class="node-copy"><span>${task.state === 'running' ? '正在执行' : task.state === 'done' ? '已完成' : task.state === 'blocked' ? '等待依赖' : '已排队'}</span><h3>${task.title}</h3><p>${task.detail} · ${task.cost} credits</p><div class="node-progress"><i style="width:${task.progress}%"></i></div></div></article>`).join('')}
      </div>
      <div class="run-bottom"><div><span class="pulse-dot"></span><p><strong>${state.complete ? '制作完成' : `${done}/${state.tasks.length} 已完成`}</strong></p></div><div>${button('新建对话', 'new-chat-session', 'secondary')} ${state.complete ? button('审阅时间线', 'open-timeline', 'primary') : ''}</div></div>
    </section>`;
}

function renderCopilot() {
  const isCollapsed = state.intent === 'work' && state.focusMode === 'auto';
  const activeSession = state.chatSessions.find(session => session.id === state.activeSession) || state.chatSessions[0];
  if (isCollapsed) {
    return `<aside class="copilot collapsed"><button class="copilot-expand" data-action="focus-chat" aria-label="打开 Copilot">${icon('spark')}<span>Copilot</span><em class="copilot-count">${state.chatSessions.length}</em></button><button class="copilot-new-session" data-action="new-chat-session" aria-label="新建对话">${icon('plus')}<span>新建对话</span></button></aside>`;
  }

  return `
    <aside class="copilot ${state.intent === 'chat' ? 'focused' : ''}">
      <header class="copilot-head">
        <div class="session-head"><span class="agent-avatar">${icon('spark')}</span><button class="session-trigger ${state.sessionMenuOpen ? 'open' : ''}" data-action="toggle-session-menu"><span><strong>${escapeHTML(activeSession.title)}</strong><small>${escapeHTML(activeSession.meta)}</small></span>${icon('chevron')}</button></div>
        <div class="copilot-head-actions"><button class="icon-button small" data-action="new-chat-session" aria-label="新建对话">${icon('plus')}</button><button class="icon-button small" data-action="focus-work" aria-label="收起 Copilot">${icon('chevron')}</button></div>
        ${state.sessionMenuOpen ? `<div class="session-dropdown"><span class="eyebrow">CONVERSATIONS</span>${state.chatSessions.map(session => `<button class="${session.id === state.activeSession ? 'active' : ''}" data-action="switch-chat-session" data-id="${session.id}"><span><strong>${escapeHTML(session.title)}</strong><small>${escapeHTML(session.meta)}</small></span>${session.id === state.activeSession ? '<i>✓</i>' : ''}</button>`).join('')}<button class="session-create" data-action="new-chat-session">${icon('plus')}<span><strong>新建对话</strong><small>讨论新的方向或版本</small></span></button></div>` : ''}
      </header>
      <div class="copilot-body">
        ${renderCopilotContent()}
      </div>
      ${state.copilotMode !== 'confirm' ? `<footer class="composer"><textarea id="main-composer" aria-label="继续讨论" placeholder="继续讨论…"></textarea><div><button class="icon-button small" aria-label="添加附件">${icon('plus')}</button><span></span><button class="send-button" data-action="composer-send" aria-label="发送消息">${icon('arrow')}</button></div></footer>` : ''}
    </aside>`;
}

function renderCopilotContent() {
  if (state.activeSession !== 'main') {
    const session = state.chatSessions.find(item => item.id === state.activeSession);
    const isRelease = session?.id === 'release';
    return `<div class="session-welcome"><h2>${isRelease ? '规划下一版' : '新对话'}</h2></div><div class="session-suggestions">${(isRelease ? ['规划一个 16:9 版本', '讨论三个发布标题', '梳理发布节奏'] : ['发展一个新的创意方向', '讨论当前粗剪的问题', '规划下一版']).map(text => `<button data-action="session-suggest" data-value="${text}">${icon('chat')}<span>${text}</span>${icon('chevron')}</button>`).join('')}</div>`;
  }
  if (state.copilotMode === 'clarify') {
    const answered = Object.keys(state.selections).length;
    return `
      <div class="copilot-message"><span class="message-label">COPILOT</span><h2>从你的想法开始。</h2><p>告诉我你想做的内容、手头的素材，或者你希望观众记住什么。</p></div>
      <div class="question-stack">
        ${quickQuestions.map((question, index) => `<section class="question-block"><div><span>${String(index + 1).padStart(2, '0')}</span><strong>${question.label}</strong></div><div class="option-row">${question.options.map(option => `<button class="option-chip ${state.selections[question.id] === option ? 'selected' : ''}" data-action="answer" data-question="${question.id}" data-value="${option}">${option}</button>`).join('')}</div></section>`).join('')}
      </div>
      <div class="copilot-next"><span>${answered}/3 已确认</span>${button('生成创意方向', 'make-concepts', answered === 3 ? 'primary' : 'disabled', answered === 3 ? '' : 'disabled')}</div>`;
  }

  if (state.copilotMode === 'concepts') {
    const choice = concepts.find(item => item.id === state.selectedConcept);
    return `<div class="copilot-message"><span class="message-label">DIRECTION READY</span><h2>这是方案，不是执行结果。</h2><p>我基于 Brief 和已有素材整理了三个方向。你可以在工作区比较它们，再选择一个继续。</p></div><div class="context-callout"><span>当前选择</span><strong>${choice.title}</strong><p>${choice.description}</p></div><div class="copilot-actions">${button('查看执行预估', 'show-confirm', 'primary')}<button class="text-button">继续调整 Brief</button></div>`;
  }

  if (state.copilotMode === 'plan-ready') {
    return `<div class="copilot-message"><h2>视频方案已保存</h2></div><div class="context-callout"><span>当前文档</span><strong>美女教你谈恋爱 · 视频方案 v1</strong><p>4 个生成镜头 · 40 秒</p></div><div class="next-actions"><button data-action="set-library" data-id="video">${icon('play')}<span><strong>查看生成镜头</strong></span>${icon('chevron')}</button><button data-action="preview-item" data-kind="docs" data-id="video-plan">${icon('doc')}<span><strong>审阅视频方案</strong></span>${icon('chevron')}</button></div>`;
  }

  if (state.copilotMode === 'confirm') {
    return `<div class="confirm-panel"><span class="message-label">EXECUTION GATE</span><h2>批准后 Agent 才会开始制作</h2><p>执行单只包含旁白、音乐、字幕和粗剪，不生成额外人物或产品镜头。</p><div class="confirm-stats"><div><span>任务</span><strong>${state.tasks.length - 1} 个制作任务</strong></div><div><span>预计成本</span><strong>${state.tasks.reduce((sum, task) => sum + task.cost, 0)} credits</strong></div><div><span>输出</span><strong>${activeProject().output}</strong></div></div><div class="confirm-list">${state.tasks.map(task => `<div><span class="check">✓</span><p><strong>${task.title}</strong><small>${task.detail}</small></p><em>${task.cost || '—'}</em></div>`).join('')}</div><label class="confirm-checkbox"><input type="checkbox" id="approval-check"/><span>我已检查方案、任务和预计消耗</span></label><div class="confirm-actions">${button('返回修改', 'cancel-confirm', 'quiet')} ${button('批准并开始', 'start-run', 'primary', 'disabled id="approve-button"')}</div></div>`;
  }

  if (state.copilotMode === 'running') {
    const done = state.tasks.filter(task => task.state === 'done').length;
    const running = state.tasks.filter(task => task.state === 'running');
    const project = activeProject();
    const shots = state.tasks.find(task => task.id === 'shots');
    const headline = state.projectType === 'lamp' ? '正在制作电商短片' : shots?.state !== 'done' ? '正在生成四段 Home Bar 视频' : '正在制作第一版粗剪';
    return `<div class="copilot-message compact"><h2>${headline}</h2></div><div class="live-summary"><div><span class="live-dot"></span><p><strong>${done} / ${state.tasks.length} 已完成</strong><small>${formatTime(state.elapsed)} · ${running.length ? `${running.length} 个任务并行` : '正在检查依赖'}</small></p></div><button data-action="open-tasks">查看任务</button></div><div class="copilot-task-stream">${state.tasks.slice(1).map(task => `<article class="${task.state}"><span>${task.state === 'done' ? '✓' : task.state === 'running' ? '<i></i>' : '·'}</span><div><strong>${task.title}</strong><small>${task.state === 'done' ? '已完成' : task.state === 'running' ? `${Math.round(task.progress)}%` : task.state === 'blocked' ? '等待依赖' : '已排队'}</small><em><i style="width:${task.progress}%"></i></em></div></article>`).join('')}</div><div class="next-actions"><button data-action="new-chat-session">${icon('chat')}<span><strong>讨论下一版</strong></span>${icon('chevron')}</button><button data-action="preview-item" data-kind="docs" data-id="${project.docId}">${icon('doc')}<span><strong>查看视频方案</strong></span>${icon('chevron')}</button></div>`;
  }

  const project = activeProject();
  return `<div class="copilot-message"><h2>成片已就绪</h2></div><div class="completion-card"><span>✓</span><div><strong>Cut v1 · ${project.duration}</strong><small>9:16 · ${project.clips.length} 个段落 · ${state.tasks.reduce((sum, task) => sum + task.cost, 0)} credits</small></div></div><div class="copilot-actions">${button('审阅时间线', 'open-timeline', 'primary')} ${button('规划 V2', 'new-chat-session', 'secondary')}</div>`;
}

function renderWorkspace() {
  const project = activeProject();
  const done = state.tasks.filter(task => task.state === 'done').length;
  return `
    <main class="workspace focus-${state.intent} mode-${state.focusMode} ${state.workspaceEntering ? 'workspace-entering' : ''}" style="--library-width:${state.libraryWidth}px;--copilot-width:${state.copilotWidth}px">
      <header class="workspace-topbar">
        <div class="topbar-left"><button class="icon-button" data-action="go-home" aria-label="返回首页">${icon('back')}</button><div><strong>${project.title}</strong><small>${state.running ? '正在制作' : state.complete ? 'Cut v1 · 已完成' : '视频方案 v1'}</small></div></div>
        <div class="topbar-right"><button class="status-pill ${state.running ? 'live' : ''}" data-action="open-tasks"><span></span>${state.complete ? '制作完成' : state.running ? `${done}/${state.tasks.length} 运行中` : '方案阶段'}</button><button class="credit-pill">⚡ 726</button><button class="button quiet">分享</button><button class="button ${state.complete ? 'primary' : 'disabled'}" ${state.complete ? '' : 'disabled'}>导出</button></div>
      </header>
      <div class="workspace-body">
        <nav class="tool-rail" aria-label="创作工具">
          ${[['docs', 'doc', '文档'], ['tasks', 'task', '任务']].map(([id, ico, label]) => `<button class="tool-button ${state.leftSection === id ? 'active' : ''}" data-action="set-library" data-id="${id}" aria-label="${label}" aria-pressed="${state.leftSection === id}" title="${label}">${icon(ico)}<span>${label}</span>${id === 'tasks' && state.running ? '<em class="tool-status-dot"></em>' : ''}</button>`).join('')}
          <button class="tool-button ${state.leftSection === 'activity' ? 'active' : ''}" data-action="set-library" data-id="activity" aria-label="Activity" aria-pressed="${state.leftSection === 'activity'}" title="Activity">${icon('activity')}<span>Activity</span></button>
          <div class="tool-rail-divider"></div>
          ${[['video', 'play', '视频'], ['images', 'media', '图片'], ['audio', 'audio', '音频']].map(([id, ico, label]) => `<button class="tool-button ${state.leftSection === id ? 'active' : ''}" data-action="set-library" data-id="${id}" aria-label="${label}" aria-pressed="${state.leftSection === id}" title="${label}">${icon(ico)}<span>${label}</span></button>`).join('')}
          <div class="rail-spacer"></div>
        </nav>
        <aside class="library-panel">${renderLibrary()}</aside>
        <div class="panel-resizer library-resizer" data-resize-panel="library" role="separator" aria-label="调整左侧栏宽度"></div>
        <section class="stage-wrap" data-action="focus-work">${renderStage()}</section>
        ${renderCopilot()}
        <div class="panel-resizer copilot-resizer" data-resize-panel="copilot" role="separator" aria-label="调整右侧栏宽度"></div>
      </div>
      ${renderPreviewLayer()}
    </main>`;
}

function refreshWorkspaceLibrary() {
  const panel = document.querySelector('.library-panel');
  if (panel) panel.innerHTML = renderWorkspaceLibrary();
  document.querySelectorAll('[data-action="set-library"]').forEach(button => {
    const isActive = button.dataset.id === state.leftSection;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  persistState();
}

function refreshCopilotPanel() {
  const workspace = document.querySelector('.workspace');
  if (workspace) workspace.className = `workspace focus-${state.intent} mode-${state.focusMode}`;
  const copilot = document.querySelector('.copilot');
  if (copilot) copilot.outerHTML = renderCopilot();
  persistState();
}

function startPanelResize(event, panel, handle) {
  const workspace = document.querySelector('.workspace');
  if (!workspace || !handle) return;
  const startX = event.clientX;
  const startWidth = panel === 'library' ? state.libraryWidth : state.copilotWidth;
  const min = panel === 'library' ? 190 : 340;
  const railWidth = Number.parseFloat(getComputedStyle(document.querySelector('.workspace-body')).getPropertyValue('--rail-width')) || 64;
  const otherPanelWidth = panel === 'library'
    ? document.querySelector('.copilot')?.getBoundingClientRect().width || 72
    : document.querySelector('.library-panel')?.getBoundingClientRect().width || state.libraryWidth;
  const available = workspace.clientWidth - railWidth - otherPanelWidth - 500;
  const max = Math.max(min, Math.min(panel === 'library' ? 360 : 620, available));
  const property = panel === 'library' ? '--library-width' : '--copilot-width';
  document.body.classList.add('is-resizing-panels');
  handle.classList.add('is-resizing');
  if (event.pointerId !== undefined && handle.setPointerCapture) {
    handle.setPointerCapture(event.pointerId);
  }

  const move = moveEvent => {
    const delta = panel === 'library' ? moveEvent.clientX - startX : startX - moveEvent.clientX;
    const nextWidth = Math.round(Math.min(max, Math.max(min, startWidth + delta)));
    if (panel === 'library') state.libraryWidth = nextWidth;
    else state.copilotWidth = nextWidth;
    workspace.style.setProperty(property, `${nextWidth}px`);
  };
  const stop = stopEvent => {
    document.body.classList.remove('is-resizing-panels');
    handle.classList.remove('is-resizing');
    persistState();
    if (stopEvent?.pointerId !== undefined && handle.hasPointerCapture?.(stopEvent.pointerId)) {
      handle.releasePointerCapture(stopEvent.pointerId);
    }
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
    window.removeEventListener('blur', stop);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop);
  window.addEventListener('pointercancel', stop);
  window.addEventListener('blur', stop);
}

function createChatSession() {
  const sessionNumber = state.chatSessions.length + 1;
  const session = { id: `session-${Date.now()}`, title: `新对话 ${sessionNumber}`, meta: '独立讨论' };
  state.chatSessions.push(session);
  state.activeSession = session.id;
  state.sessionMenuOpen = false;
  state.intent = 'chat';
  state.focusMode = 'auto';
  refreshCopilotPanel();
  requestAnimationFrame(() => document.querySelector('#main-composer')?.focus());
}

function openPreview(kind, id) {
  const item = findPreviewItem(kind, id);
  if (!item) return;
  state.previewItem = { kind, item };
  document.querySelector('.preview-layer')?.remove();
  document.querySelector('.workspace')?.insertAdjacentHTML('beforeend', renderPreviewLayer());
}

function render() {
  const ideationScroll = document.querySelector('.ideation-shell')?.scrollTop || 0;
  const homeScroll = document.querySelector('.home-main')?.scrollTop || 0;
  if (state.view === 'report') {
    app.innerHTML = renderReport();
  } else {
    const demoView = state.view === 'home' ? renderHome() : state.view === 'ideation' ? renderIdeation() : state.view === 'import-analysis' ? renderImportAnalysis() : renderWorkspace();
    app.innerHTML = `<div class="demo-runtime ${state.demoEntering ? 'demo-entering' : ''}">${demoView}</div><button class="demo-exit-button" data-action="exit-demo">${icon('back')}<span>退出 Demo</span></button>`;
  }
  if (state.toast) app.insertAdjacentHTML('beforeend', `<div class="toast" role="status" aria-live="polite">${state.toast}</div>`);
  bindInputs();
  bindTimelinePlayback();
  if (state.view === 'ideation' || state.view === 'import-analysis') {
    const shell = document.querySelector('.ideation-shell');
    if (shell) shell.scrollTop = ideationScroll;
  }
  if (state.view === 'home') {
    const main = document.querySelector('.home-main');
    if (main) main.scrollTop = homeScroll;
  }
  persistState();
  if (state.demoEntering) {
    setTimeout(() => {
      state.demoEntering = false;
      document.querySelector('.demo-runtime')?.classList.remove('demo-entering');
      persistState();
    }, 520);
  }
}

function bindInputs() {
  document.querySelectorAll('input[type="file"]').forEach(input => input.addEventListener('change', handleFiles, { once: true }));
  document.querySelectorAll('.file-label[tabindex="0"]').forEach(label => label.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    label.querySelector('input[type="file"]')?.click();
  }));
  const ideaInput = document.querySelector('#idea-input');
  ideaInput?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    submitIdeaAnswer(ideaInput.value);
  });
  const approval = document.querySelector('#approval-check');
  approval?.addEventListener('change', () => {
    const approve = document.querySelector('#approve-button');
    approve.disabled = !approval.checked;
    approve.classList.toggle('disabled', !approval.checked);
  });
  document.querySelectorAll('[contenteditable="true"]').forEach(element => element.addEventListener('blur', () => {
    state.savedAt = '现在';
    showToast('已保存到本地 Demo 状态');
  }, { once: true }));
}

function updatePlaybackUI() {
  const totalDuration = parseTimecode(activeProject().duration);
  const safeTime = Math.min(totalDuration, Math.max(0, state.playbackTime));
  const progress = totalDuration ? safeTime / totalDuration * 100 : 0;
  const current = document.querySelector('[data-playback-current]');
  const playhead = document.querySelector('.timeline-playback-layer .playhead');
  const playheadLabel = playhead?.querySelector('span');
  const control = document.querySelector('.viewer-play');
  const controlIcon = control?.querySelector('.ui-icon');
  if (current) current.textContent = formatPlaybackTime(safeTime, true);
  if (playhead) playhead.style.left = `${progress}%`;
  if (playheadLabel) playheadLabel.textContent = formatPlaybackTime(safeTime);
  document.querySelectorAll('[data-playback-clip]').forEach(clip => {
    clip.classList.toggle('is-active', Number(clip.dataset.playbackClip) === state.playbackClipIndex);
  });
  if (control) {
    control.classList.toggle('is-playing', state.previewPlaying);
    control.setAttribute('aria-label', state.previewPlaying ? '暂停预览' : '播放预览');
  }
  if (controlIcon) {
    controlIcon.classList.toggle('ri-play-fill', !state.previewPlaying);
    controlIcon.classList.toggle('ri-pause-fill', state.previewPlaying);
  }
}

function setSequenceSource(video, clipIndex, localTime, shouldPlay) {
  const project = activeProject();
  const asset = project.videos[clipIndex];
  if (!video || !asset) return;
  const nextUrl = new URL(asset.url, document.baseURI).href;
  const sourceChanged = video.currentSrc !== nextUrl && video.src !== nextUrl;
  const loadToken = `${Date.now()}-${Math.random()}`;
  video.dataset.loadToken = loadToken;
  video.dataset.sequenceIndex = String(clipIndex);
  video.muted = false;
  video.volume = 1;

  const applyPosition = () => {
    if (video.dataset.loadToken !== loadToken) return;
    video.dataset.transitioning = 'false';
    const maxTime = Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.04) : localTime;
    try { video.currentTime = Math.min(Math.max(0, localTime), maxTime); } catch { /* metadata is still settling */ }
    if (shouldPlay) {
      state.previewPlaying = true;
      video.play().catch(() => {
        state.previewPlaying = false;
        updatePlaybackUI();
      });
    }
    updatePlaybackUI();
  };

  if (sourceChanged) {
    video.src = asset.url;
    if (asset.poster) video.poster = asset.poster;
    else video.removeAttribute('poster');
    video.addEventListener('loadedmetadata', applyPosition, { once: true });
    video.load();
  } else if (video.readyState >= 1) {
    applyPosition();
  } else {
    video.addEventListener('loadedmetadata', applyPosition, { once: true });
  }
}

function seekSequence(globalTime, shouldPlay = state.previewPlaying) {
  const segments = playbackSegments();
  const totalDuration = parseTimecode(activeProject().duration);
  const safeTime = Math.min(totalDuration, Math.max(0, globalTime));
  const segment = segments.find(item => safeTime < item.end) || segments.at(-1);
  if (!segment) return;
  state.playbackTime = safeTime;
  state.playbackClipIndex = segment.index;
  const localTime = Math.min(segment.duration, Math.max(0, safeTime - segment.start));
  setSequenceSource(document.querySelector('.workspace-preview-video'), segment.index, localTime, shouldPlay);
  updatePlaybackUI();
}

function advanceSequence(video) {
  if (!state.previewPlaying || video.dataset.transitioning === 'true') return;
  video.dataset.transitioning = 'true';
  const segments = playbackSegments();
  const currentIndex = Number(video.dataset.sequenceIndex || state.playbackClipIndex);
  const next = segments[currentIndex + 1];
  if (next) {
    state.playbackTime = next.start;
    state.playbackClipIndex = next.index;
    setSequenceSource(video, next.index, 0, true);
    return;
  }
  state.playbackTime = parseTimecode(activeProject().duration);
  state.previewPlaying = false;
  video.dataset.transitioning = 'false';
  video.pause();
  updatePlaybackUI();
  persistState();
}

function bindTimelinePlayback() {
  const video = document.querySelector('.workspace-preview-video');
  if (!video) return;
  video.muted = false;
  video.volume = 1;
  const segments = playbackSegments();
  const currentIndex = Math.min(segments.length - 1, Math.max(0, Number(video.dataset.sequenceIndex) || 0));
  const segment = segments[currentIndex];
  const desiredLocalTime = Math.max(0, state.playbackTime - segment.start);
  const restorePosition = () => {
    if (Math.abs(video.currentTime - desiredLocalTime) > .08) {
      try { video.currentTime = Math.min(desiredLocalTime, Math.max(0, video.duration - .04)); } catch { /* wait for metadata */ }
    }
  };
  if (video.readyState >= 1) restorePosition();
  else video.addEventListener('loadedmetadata', restorePosition, { once: true });
  video.addEventListener('play', () => {
    state.previewPlaying = true;
    updatePlaybackUI();
  });
  video.addEventListener('timeupdate', () => {
    const index = Math.min(segments.length - 1, Math.max(0, Number(video.dataset.sequenceIndex) || 0));
    const active = segments[index];
    if (!active) return;
    state.playbackClipIndex = index;
    state.playbackTime = Math.min(active.end, active.start + video.currentTime);
    updatePlaybackUI();
    if (state.previewPlaying && video.currentTime >= active.duration - .06) advanceSequence(video);
  });
  video.addEventListener('ended', () => advanceSequence(video));
  updatePlaybackUI();
}

function toggleSequencePlayback() {
  const video = document.querySelector('.workspace-preview-video');
  if (!video) return;
  const totalDuration = parseTimecode(activeProject().duration);
  if (state.previewPlaying && !video.paused) {
    state.previewPlaying = false;
    video.pause();
    updatePlaybackUI();
    persistState();
    return;
  }
  state.previewPlaying = true;
  if (state.playbackTime >= totalDuration - .04) {
    seekSequence(0, true);
  } else {
    video.muted = false;
    video.volume = 1;
    video.play().catch(() => {
      state.previewPlaying = false;
      updatePlaybackUI();
    });
  }
  updatePlaybackUI();
}

function timelineTimeAtPointer(event, timeline) {
  const bounds = timeline.getBoundingClientRect();
  const start = bounds.left + 88;
  const end = bounds.right - 12;
  const ratio = Math.min(1, Math.max(0, (event.clientX - start) / Math.max(1, end - start)));
  return ratio * parseTimecode(activeProject().duration);
}

function startTimelineSeek(event, timeline) {
  if (event.target.closest('button')) return;
  const wasPlaying = state.previewPlaying;
  document.querySelector('.workspace-preview-video')?.pause();
  state.previewPlaying = false;
  timeline.classList.add('is-scrubbing');
  const move = moveEvent => seekSequence(timelineTimeAtPointer(moveEvent, timeline), false);
  const stop = stopEvent => {
    move(stopEvent);
    timeline.classList.remove('is-scrubbing');
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
    if (wasPlaying) {
      state.previewPlaying = true;
      seekSequence(state.playbackTime, true);
    }
    persistState();
  };
  move(event);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop);
  window.addEventListener('pointercancel', stop);
}

function handleFiles(event) {
  const files = [...event.target.files];
  if (!files.length) return;
  state.importedAssets.unshift(...files.map((file, index) => ({
    id: `local-${Date.now()}-${index}`,
    name: file.name,
    kind: file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : 'document',
    type: file.type.startsWith('video') ? 'Local video' : file.type.startsWith('image') ? 'Local image' : file.type.startsWith('audio') ? 'Local audio' : 'Local document',
    duration: file.size > 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${Math.ceil(file.size / 1000)} KB`,
    tone: ['plum', 'blue', 'gold', 'mint'][index % 4],
    url: URL.createObjectURL(file),
    status: 'local'
  })));
  state.activeTool = 'media';
  state.intent = 'work';
  showToast(`${files.length} 个本地素材已加入；没有上传到网络`);
  render();
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function parseTimecode(value) {
  const [minutes = 0, seconds = 0] = String(value).split(':').map(Number);
  return minutes * 60 + seconds;
}

function formatPlaybackTime(seconds, precise = false) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60).toString().padStart(2, '0');
  const wholeSeconds = Math.floor(safe % 60).toString().padStart(2, '0');
  if (!precise) return `${minutes}:${wholeSeconds}`;
  const hundredths = Math.floor((safe % 1) * 100).toString().padStart(2, '0');
  return `${minutes}:${wholeSeconds}.${hundredths}`;
}

function playbackSegments(project = activeProject()) {
  return project.clips.map((clip, index) => {
    const [startCode, endCode] = clip.range.split('–');
    const start = parseTimecode(startCode);
    const end = parseTimecode(endCode);
    return { index, start, end, duration: Math.max(0, end - start) };
  });
}

function resetPlayback() {
  state.playbackTime = 0;
  state.playbackClipIndex = 0;
  state.previewPlaying = false;
}

function configureRun(projectType) {
  state.projectType = projectType;
  resetPlayback();
  state.tasks = structuredClone(projectProfiles[projectType].tasks);
  state.copilotMode = 'running';
  state.running = true;
  state.complete = false;
  state.retrySeen = false;
  state.elapsed = 0;
  state.intent = 'chat';
  state.focusMode = 'auto';
}

function refreshRunSurfaces() {
  refreshCopilotPanel();
  if (state.leftSection === 'tasks' || state.leftSection === 'activity' || state.leftSection === 'audio' || state.leftSection === 'video') refreshWorkspaceLibrary();
  const status = document.querySelector('.status-pill');
  if (status) {
    const done = state.tasks.filter(task => task.state === 'done').length;
    status.classList.toggle('live', state.running);
    status.innerHTML = `<span></span>${state.complete ? '制作完成' : `${done}/${state.tasks.length} 运行中`}`;
  }
  const timelineState = document.querySelector('.timeline-head small');
  const shotTask = state.tasks.find(task => task.id === 'shots');
  if (timelineState) timelineState.textContent = shotTask && shotTask.state !== 'done' ? '正在生成镜头' : state.running ? 'Agent 正在组装' : '已保存';
  if (shotTask && shotTask.state !== 'done') {
    const generatedCount = Math.min(activeProject().clips.length, Math.floor(shotTask.progress / 25));
    const progressBar = document.querySelector('.generation-progress i');
    const progressLabel = document.querySelector('[data-generation-progress]');
    if (progressBar) progressBar.style.width = `${shotTask.progress}%`;
    if (progressLabel) progressLabel.textContent = `${Math.round(shotTask.progress)}%`;
    document.querySelectorAll('[data-generation-shot]').forEach((item, index) => {
      const status = index < generatedCount ? 'ready' : index === generatedCount ? 'working' : 'pending';
      item.className = status;
      item.innerHTML = status === 'ready'
        ? `<img src="${activeProject().clips[index].poster}" alt=""/><small>已生成</small>`
        : `${icon('spark')}<small>${status === 'working' ? '生成中' : '等待'}</small>`;
    });
    document.querySelectorAll('[data-generation-clip]').forEach((item, index) => {
      const status = index < generatedCount ? 'ready' : index === generatedCount ? 'working' : 'pending';
      item.className = `timeline-clip generation-slot ${status}`;
      const thumb = item.querySelector('.clip-thumb');
      const title = item.querySelector('strong');
      if (thumb) thumb.innerHTML = status === 'ready' ? `<img src="${activeProject().clips[index].poster}" alt=""/>` : icon('spark');
      if (title) title.textContent = status === 'ready' ? activeProject().clips[index].title : `镜头 ${String(index + 1).padStart(2, '0')}`;
      const small = item.querySelector('small');
      if (small) small.textContent = status === 'ready' ? activeProject().clips[index].range : status === 'working' ? '生成中' : '等待生成';
    });
  }
  persistState();
}

function startRunTimer() {
  clearInterval(runTimer);
  runTimer = setInterval(tickRun, 900);
}

function startRun() {
  configureRun(state.projectType);
  render();
  startRunTimer();
}

function tickRun() {
  state.elapsed += 1;
  const shots = state.tasks.find(task => task.id === 'shots');
  const shotsWereDone = shots?.state === 'done';
  const bgm = state.tasks.find(task => task.id === 'bgm');
  const voice = state.tasks.find(task => task.id === 'voice');
  const caption = state.tasks.find(task => task.id === 'caption');
  const assembly = state.tasks.find(task => task.id === 'assembly');

  if (state.projectType === 'lamp' && bgm?.state === 'queued') bgm.state = 'running';
  if (state.projectType === 'romance' && voice?.state === 'queued' && state.elapsed >= 2) voice.state = 'running';
  if (caption?.state === 'queued' && state.elapsed >= 4) caption.state = 'running';

  for (const task of state.tasks) {
    if (task.state !== 'running') continue;
    const speed = task.id === 'assembly' ? 25 : task.id === 'caption' ? 8 : 7;
    task.progress = Math.min(100, task.progress + speed);
    if (task.progress >= 100) task.state = 'done';
  }

  const productionReady = state.tasks.filter(task => !['analyse', 'assembly'].includes(task.id)).every(task => task.state === 'done');
  if (productionReady && assembly?.state === 'blocked') assembly.state = 'running';

  if (state.tasks.every(task => task.state === 'done')) {
    clearInterval(runTimer);
    state.running = false;
    state.complete = true;
    state.copilotMode = 'done';
    render();
    return;
  }
  if (shots && !shotsWereDone && shots.state === 'done') {
    render();
    return;
  }
  refreshRunSurfaces();
}

function enterWorkspace(mode) {
  state.projectType = 'romance';
  resetPlayback();
  state.view = 'workspace';
  state.activeTool = mode === 'import' ? 'media' : 'docs';
  state.activeDoc = 'brief';
  state.stageMode = 'document';
  state.leftSection = 'docs';
  state.workspaceFixed = true;
  state.freshWorkspace = false;
  state.previewItem = null;
  state.activeSession = 'main';
  state.sessionMenuOpen = false;
  state.copilotMode = 'plan-ready';
  state.intent = 'chat';
  state.focusMode = 'auto';
  render();
}

function enterIdeation() {
  clearInterval(analysisTimer);
  state.projectType = 'romance';
  resetPlayback();
  state.view = 'ideation';
  state.ideaStep = 0;
  state.ideaAnswers = [];
  state.ideaTyping = false;
  state.planGenerating = false;
  render();
}

function startAnalysisTimer() {
  clearInterval(analysisTimer);
  analysisTimer = setInterval(() => {
    state.analysisStep += 1;
    if (state.analysisStep >= importAnalysisSteps.length) {
      state.analysisStep = importAnalysisSteps.length;
      state.analysisComplete = true;
      clearInterval(analysisTimer);
    }
    render();
  }, 720);
}

function enterImportAnalysis() {
  clearInterval(runTimer);
  clearInterval(analysisTimer);
  state.projectType = 'lamp';
  resetPlayback();
  state.view = 'import-analysis';
  state.analysisStep = 0;
  state.analysisComplete = false;
  state.running = false;
  state.complete = false;
  render();
  startAnalysisTimer();
}

function ensureProjectDocument(projectType) {
  const project = projectProfiles[projectType];
  if (state.docs.some(doc => doc.id === project.docId)) return;
  state.docs.unshift({
    id: project.docId,
    icon: projectType === 'lamp' ? 'L' : 'P',
    type: projectType === 'lamp' ? 'Product video proposal' : 'Video proposal',
    title: project.docTitle,
    meta: projectType === 'romance' ? `${project.videos.length} 个 AI 镜头 · ${project.duration.replace('00:', '')} 秒 · 刚刚` : `${project.videos.length} 段素材 · ${project.duration.replace('00:', '')} 秒 · 刚刚`,
    status: 'active'
  });
}

function enterProjectWorkspace(projectType) {
  const project = projectProfiles[projectType];
  ensureProjectDocument(projectType);
  const applyWorkspace = () => {
    configureRun(projectType);
    state.planGenerating = false;
    state.view = 'workspace';
    state.activeTool = 'docs';
    state.activeDoc = project.docId;
    state.stageMode = 'editor';
    state.leftSection = 'docs';
    state.workspaceFixed = true;
    state.freshWorkspace = true;
    state.previewItem = null;
    state.activeSession = 'main';
    state.sessionMenuOpen = false;
    state.workspaceEntering = true;
    render();
  };
  if (document.startViewTransition) {
    const transition = document.startViewTransition(applyWorkspace);
    transition.finished.finally(() => {
      state.workspaceEntering = false;
      document.querySelector('.workspace')?.classList.remove('workspace-entering');
    });
  } else {
    applyWorkspace();
    setTimeout(() => {
      state.workspaceEntering = false;
      document.querySelector('.workspace')?.classList.remove('workspace-entering');
    }, 1000);
  }
  startRunTimer();
}

function resumeProjectWorkspace(projectType) {
  clearInterval(runTimer);
  clearInterval(analysisTimer);
  const project = projectProfiles[projectType];
  ensureProjectDocument(projectType);
  state.projectType = projectType;
  resetPlayback();
  state.tasks = structuredClone(project.tasks).map(task => ({ ...task, state: 'done', progress: 100 }));
  state.elapsed = projectType === 'romance' ? 18 : 17;
  state.running = false;
  state.complete = true;
  state.copilotMode = 'done';
  state.planGenerating = false;
  state.view = 'workspace';
  state.activeTool = 'docs';
  state.activeDoc = project.docId;
  state.stageMode = 'editor';
  state.leftSection = 'docs';
  state.workspaceFixed = true;
  state.freshWorkspace = true;
  state.previewItem = null;
  state.activeSession = 'main';
  state.sessionMenuOpen = false;
  state.intent = 'chat';
  state.focusMode = 'auto';
  state.workspaceEntering = false;
  render();
}

function submitIdeaAnswer(rawValue, displayValue = rawValue) {
  const value = String(rawValue || '').trim();
  const reply = String(displayValue || '').trim();
  if (!value || state.ideaTyping || state.ideaStep >= ideationRounds.length) return;
  const round = ideationRounds[state.ideaStep];
  state.ideaAnswers.push({ id: round.id, value, reply: reply || value });
  state.ideaTyping = true;
  render();
  setTimeout(() => {
    state.ideaStep += 1;
    state.ideaTyping = false;
    render();
    requestAnimationFrame(() => document.querySelector('#idea-input')?.focus());
  }, 520);
}

function generateVideoPlan() {
  state.planGenerating = true;
  render();
  setTimeout(() => {
    enterProjectWorkspace('romance');
  }, 1100);
}

app.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'enter-demo') {
    state.demoEntering = true;
    state.view = 'home';
    render();
    return;
  }
  if (action === 'exit-demo') {
    clearInterval(analysisTimer);
    clearInterval(runTimer);
    state.view = 'report';
    state.running = false;
    state.previewItem = null;
    state.demoEntering = false;
    render();
    return;
  }

  if (action === 'start-idea') return enterIdeation();
  if (action === 'start-import') return enterImportAnalysis();
  if (action === 'open-space') return resumeProjectWorkspace(target.dataset.project === 'lamp' ? 'lamp' : 'romance');
  if (action === 'go-home') {
    clearInterval(analysisTimer);
    clearInterval(runTimer);
    state.view = 'home';
    state.running = false;
    return render();
  }

  if (action === 'idea-answer') {
    return submitIdeaAnswer(target.dataset.value, target.dataset.reply);
  }

  if (action === 'idea-send') {
    return submitIdeaAnswer(document.querySelector('#idea-input')?.value);
  }

  if (action === 'generate-video-plan') {
    generateVideoPlan();
    return;
  }

  if (action === 'confirm-import-plan') {
    enterProjectWorkspace('lamp');
    return;
  }

  if (action === 'set-library') {
    state.leftSection = target.dataset.id;
    refreshWorkspaceLibrary();
    return;
  }

  if (action === 'preview-item') {
    openPreview(target.dataset.kind, target.dataset.id);
    return;
  }

  if (action === 'close-preview') {
    state.previewItem = null;
    document.querySelector('.preview-layer')?.remove();
    return;
  }

  if (action === 'toggle-preview-play') {
    toggleSequencePlayback();
    return;
  }

  if (action === 'new-chat-session') {
    createChatSession();
    return;
  }

  if (action === 'toggle-session-menu') {
    state.sessionMenuOpen = !state.sessionMenuOpen;
    refreshCopilotPanel();
    return;
  }

  if (action === 'switch-chat-session') {
    state.activeSession = target.dataset.id;
    state.sessionMenuOpen = false;
    refreshCopilotPanel();
    return;
  }

  if (action === 'session-suggest') {
    const input = document.querySelector('#main-composer');
    if (input) { input.value = target.dataset.value; input.focus(); }
    return;
  }

  if (state.workspaceFixed && action === 'focus-chat') {
    state.intent = 'chat';
    state.sessionMenuOpen = false;
    refreshCopilotPanel();
    return;
  }

  if (state.workspaceFixed && action === 'focus-work') {
    state.intent = 'work';
    state.sessionMenuOpen = false;
    refreshCopilotPanel();
    return;
  }

  if (action === 'skip-ideation') {
    enterWorkspace('existing');
    return;
  }

  if (action === 'set-tool') {
    state.activeTool = target.dataset.id;
    state.stageMode = target.dataset.id === 'docs' ? 'document' : 'editor';
    state.intent = 'work';
  } else if (action === 'select-doc') {
    state.activeTool = 'docs';
    state.activeDoc = target.dataset.id;
    state.stageMode = 'document';
    state.intent = 'work';
  } else if (action === 'open-active-doc') {
    state.stageMode = 'document';
    state.intent = 'work';
  } else if (action === 'answer') {
    state.selections[target.dataset.question] = target.dataset.value;
    state.intent = 'chat';
  } else if (action === 'make-concepts') {
    if (Object.keys(state.selections).length < 3) return;
    state.copilotMode = 'concepts';
    state.activeTool = 'docs';
    state.activeDoc = 'concepts';
    state.stageMode = 'document';
    state.intent = 'work';
  } else if (action === 'select-concept') {
    state.selectedConcept = target.dataset.id;
  } else if (action === 'show-confirm') {
    state.copilotMode = 'confirm';
    state.intent = 'chat';
  } else if (action === 'cancel-confirm') {
    state.copilotMode = 'concepts';
    state.intent = 'work';
  } else if (action === 'start-run') {
    if (target.disabled) return;
    startRun();
  } else if (action === 'focus-chat') {
    state.intent = 'chat';
  } else if (action === 'focus-work') {
    state.intent = 'work';
  } else if (action === 'set-focus') {
    state.focusMode = target.dataset.value;
    state.intent = target.dataset.value === 'manual-chat' ? 'chat' : target.dataset.value === 'manual-work' ? 'work' : state.intent;
  } else if (action === 'toggle-activity') {
    state.leftSection = 'activity';
  } else if (action === 'open-tasks') {
    state.leftSection = 'tasks';
    refreshWorkspaceLibrary();
    return;
  } else if (action === 'open-timeline') {
    state.activeTool = 'timeline';
    state.intent = 'work';
  } else if (action === 'new-doc') {
    if (!state.docs.some(doc => doc.id === 'v2-plan')) state.docs.push({ id: 'v2-plan', icon: 'N', type: 'Note', title: '无标题创作文档', meta: '刚刚创建', status: 'draft' });
    state.activeDoc = 'v2-plan';
    state.stageMode = 'document';
  } else if (action === 'composer-send') {
    state.intent = 'chat';
    showToast('已发送');
  }
  render();
});

app.addEventListener('pointerdown', event => {
  const handle = event.target.closest('[data-resize-panel]');
  if (handle) {
    event.preventDefault();
    startPanelResize(event, handle.dataset.resizePanel, handle);
    return;
  }
  const timeline = event.target.closest('[data-playback-timeline="true"]');
  if (timeline) {
    event.preventDefault();
    startTimelineSeek(event, timeline);
  }
});

window.addEventListener('beforeunload', persistState);

render();
if (state.view === 'workspace' && state.running) startRunTimer();
if (state.view === 'import-analysis' && !state.analysisComplete) startAnalysisTimer();
