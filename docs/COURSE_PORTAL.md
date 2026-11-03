# Learning EDA 课程门户

总首页：`site/index.html` / `site/en/index.html`。

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

运行 `python3 scripts/build.py` 后，课程卡、课程数量、总学习单元数与课程切换器自动更新；新增本站课程的内容页面需单独制作。总体介绍与学习路线为编辑内容，应随课程覆盖范围扩展而调整。

普通 CI 会验证课程 ID 唯一、双语目录覆盖、外站 HTTPS 入口和本站课程落地页。外站内容与学习记录由原站维护，没有声称已经统一搜索、迁移内容或同步进度。

预览：`python3 scripts/serve.py`。部署继续使用原 GitHub Pages 工作流。
