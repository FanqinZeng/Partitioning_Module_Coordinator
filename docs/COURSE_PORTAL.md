# Learning EDA 课程门户

总首页：`site/index.html` / `site/en/index.html`。

独立 Courses：`site/courses/index.html` / `site/en/courses/index.html`。包括推荐基础与并列课程地图、跨课程/课时搜索、方向/接入方式/状态/语言筛选、可展开大纲、本地进度和继续学习。固定顶栏不再逐门追加课程名称。

- Clustering：链接到 Su3037 原课程站，保留原作者身份；英文入口使用原站英文镜像。
- Partitioning：`site/courses/partitioning/index.html` / `site/en/courses/partitioning/index.html`。七章原有 `modules/` 链接、学习记录与电影资产保持兼容。
- 旧总首页的 `#intro` 与 `#curriculum` 由 `assets/portal.js` 定位至新的 Partitioning 首页。无 JavaScript 时仍可使用门户中的课程和导论片链接。

## 添加课程

编辑 `content/courses.json`，为每门课增加独立记录：

- `id`：唯一、稳定的课程标识。
- `title`：课程名称。
- `subtitle`、`description`、`prerequisites`：按中文、英文排列的两元素数组。
- `entry`：按中文、英文排列的入口；外站用完整 HTTPS URL，本站用相对语言根目录的路径。
- `external`：是否为作者托管的外站。
- `units`、`author`、`topics`、`languages`：学习单元数、作者、主题与支持语言。
- `status`：`ready` / `building` / `planned`，与 external 接入方式分别记录。
- `outcomes`、`keywords`、`outline`：双语学习目标、搜索词，以及课时标题和中英入口。
- `recommendedPrerequisites` / `requiredPrerequisites`：建议基础与必需先修，当前两课均无另一门课程的必修要求。
- `progress`：本站 Partitioning 使用兼容旧存储的适配器（lessonIds）；外站 provider 为 external，不生成虚假的完成百分比。

运行 `python3 scripts/build.py` 后，课程卡、课程数量、总学习单元数与课程切换器自动更新；新增本站课程的内容页面需单独制作。总体介绍与学习路线为编辑内容，应随课程覆盖范围扩展而调整。

普通 CI 会验证课程 ID 唯一、双语目录覆盖、外站 HTTPS 入口和本站课程落地页。外站内容与学习记录由原站维护，目录搜索覆盖已登记的课程元数据与课时标题，不检索外站全文，也不迁移内容或同步外站进度。

预览：`python3 scripts/serve.py`。部署继续使用原 GitHub Pages 工作流。
