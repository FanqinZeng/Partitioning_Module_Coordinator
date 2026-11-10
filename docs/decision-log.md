# 决策记录

- 2026-11-03：全站默认中文，英文镜像；纯静态、相对路径、本地字体、本地 Pyodide；GitHub Pages 为交付目标。
- 2026-11-03：保留原作者署名与固定提交；统一重写课程叙事，不拼接 iframe 页面。
- 2026-11-03：公共图 G01 用于同输入比较。KL 保持每侧节点数，FM 用节点数差窗口；面积指标单独显示，绝不混称。
- 2026-11-03：KL/FM 使用已许可的 Learning Clustering 引擎并增加统一适配与输入防护；谱方法使用实时 Jacobi 特征分解。递归二分在当前子图上重新计算谱切割。
- 2026-11-03：跨组交换改进明确命名为 swap refinement，不称作完整多路 FM。
- 2026-11-03：原提交影片保留链接，新讲义、练习与实验由本课程引擎验证。四片式、长篇讲义等上游制作目标与本版实际交付分别记录。
- 2026-11-03：首页先完成独立的中英导论片。沿用上游 Prompt 12 与二维电影风格，以真实 G01 引擎轨迹生成画面；无旁白、原创程序配乐，不引入第三方音乐授权依赖。两版共用 190 秒时间轴；分镜、字体来源哈希、渲染源与编码后检查可追溯。

- 2026-11-03：总首页升级为 Learning EDA 双语课程门户。按用户要求，Clustering 以原站链接接入；Partitioning 课程首页移至 courses/partitioning/index.html，原课时路径与进度存储保持兼容。课程目录由 content/courses.json 生成，现阶段不汇总外站进度。

- 2026-11-03：Courses 单独承载选课；通用功能导航取代逐门课程导航。课程地图为建议起点，不把 Clustering 强制设为 Partitioning 先修；外站进度不汇总。

- 2026-11-10（阶段三，本周第 1 轮）：同图比较新增可复制链接。链接记录最近一次成功计算所用的图、组数与容量，打开后用现有引擎重算。设计参考 [EDA Algorithms Platform 的共享实验](https://github.com/yongfu-li/eda-learning/blob/main/platform/README.md) 与 [Desmos 的快照分享](https://help.desmos.com/hc/en-us/articles/4405901719309-Saving-and-Sharing-Your-Work)。实测把 AB 权重设为 1、容量设为 1.5 后，在新标签页还原了同一组结果，切换英文也能读取链接。损坏链接保留当前结果。375px 宽度无横向溢出。
