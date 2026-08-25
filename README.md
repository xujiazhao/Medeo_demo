# Medeo Pro Workspace Demo

一套无后端的 AI 视频创作空间前端 Demo。它基于 Medeo 现有页面语言，但把产品重心从“一句话触发生成”调整为“文档驱动、逐步确认、素材优先和长任务不中断协作”。

在线 Demo：<https://xujiazhao.github.io/Medeo_demo/>

## 运行

```bash
npm install
npm run dev
```

打开：<http://127.0.0.1:4173>

语法检查：

```bash
npm run check
```

## 推荐演示路径

1. 首页选择“从一个想法开始”，进入独立的聚焦对话。
2. 使用快捷方向或自由输入，模拟三轮创作对话。
3. 确认《视频方案》；对话滑向右侧、文档落入左栏，中间工作区同步展开，Agent 立即开始旁白、字幕、BGM 和粗剪任务。
4. 在左侧看到唯一的《美女教你谈恋爱 · 视频方案 v1》；Agent 会在约 20 秒内生成四段 Home Bar 视频，再完成旁白、字幕、BGM 和粗剪。
5. 生成完成后切换到“视频”，查看四段 Home Bar AI 视频结果；点击任意镜头即可预览。
6. 右侧默认保持展开，可以观察 Agent 的并行任务，也可以创建独立对话 Session。

第二条演示路径从首页选择“从素材创建空间”。Demo 会直接读取 4 段预置户外灯素材，自动完成场景、产品和用途判断，形成一份 25 秒电商产品片执行单；用户只需要在最后确认一次，随后进入同一工作台并看到 Agent 自动开工。主流程不包含真实上传步骤。

## 当前案例素材

[`assets/demo/`](/Users/xux/Documents/Projects/Medeo_demo/assets/demo) 目前承载两套完整 Mock：4 段 9:16 Home Bar 人物视频及对应首帧/角色图，以及 4 段便携户外灯产品视频。映射、方案文档、任务与时间线数据集中维护在 `src/demo-data.js`。

## 品牌与界面资源

- Medeo 官方公开 mark 已本地保存到 `assets/brand/medeo-logo.svg`，来源记录见同目录 README。
- 界面功能图标统一使用本地 `remixicon` 依赖，不依赖 CDN。
- 字体继续使用基线中捕获的 Nohemi 与 Manrope；可见界面文字最小为 `10px`。

## 关键文件

- [`docs/WORKPLAN.md`](/Users/xux/Documents/Projects/Medeo_demo/docs/WORKPLAN.md)：产品策略、流程、演示脚本和验收标准。
- [`src/app.js`](/Users/xux/Documents/Projects/Medeo_demo/src/app.js)：全部视图、交互和确定性任务模拟。
- [`src/demo-data.js`](/Users/xux/Documents/Projects/Medeo_demo/src/demo-data.js)：文档、素材、方向、任务和时间线数据。
- [`src/styles.css`](/Users/xux/Documents/Projects/Medeo_demo/src/styles.css)：视觉系统、自适应焦点和全部响应式布局。
- [`reference/medeo-baseline/`](/Users/xux/Documents/Projects/Medeo_demo/reference/medeo-baseline)：原站 DOM/CSS/Token 参考。

## 交互状态

- `ideation`：通过快捷方向或自由输入逐步形成创意方案。
- `material-analysis`：自动理解预置素材并形成可确认执行单。
- `confirm`：两个入口都只在最后进入一次明确确认门。
- `running`：并行任务、恢复状态、Activity 和多对话 Session。
- `done`：任务完成、时间线审阅和 Export 解锁。

所有状态均保存在当前浏览器会话中，刷新后会回到原来的页面和任务进度；自由输入只用于更新前端演示状态，不包含语义解析、模型请求或后端消息处理。
