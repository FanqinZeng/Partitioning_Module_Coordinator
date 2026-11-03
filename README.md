# Learning Partitioning · 划分与取舍

整合 [eda-learning #10–#16](https://github.com/yongfu-li/eda-learning/issues) 的七份 Partitioning 提交，对应协调任务 [#17](https://github.com/yongfu-li/eda-learning/issues/17)。默认中文，英文镜像，纯静态 GitHub Pages 站点。

**网站：** https://fanqinzeng.github.io/Partitioning_Module_Coordinator/

| Lesson | 主题 | 原提交作者 |
| --- | --- | --- |
| 02 | 割代价与平衡 | GateUltra |
| 03 | 初始二分 | Capeur |
| 04 | Kernighan–Lin 二分 | muranfei |
| 05 | Fiduccia–Mattheyses 二分 | stephQ-lab |
| 06 | 谱二分 | thy031 |
| 07 | 递归二分 | xingguangyaoyu |
| 08 | 多路划分 | FanqinZeng |

保留 [Learning Clustering](https://su3037.github.io/learning-clustering/) 的暖纸色、衬线标题、深青色与深色技术实验区。新增随文实验、双向步进、候选/锁定/前缀表、伪代码联动、同图比较与精确小图校准、49 道带两级提示的挑战、浏览器 Python、搜索、草稿与可移植学习记录。

## 本地运行

```sh
python3 scripts/serve.py
# http://127.0.0.1:8790/Partitioning_Module_Coordinator/
```

仓库包含本地字体与 Pyodide，不依赖 CDN。不要直接双击 HTML，浏览器模块与 worker 需要 HTTP。下载站点离线包后也可用其中的 serve.py 启动；外部原作者媒体仍需要网络。

## 构建与验证

需要 Python 3.9+、Node.js 20+；构建与测试无 npm 依赖。

```sh
python3 scripts/build.py
node --test tests/*.test.mjs
python3 tests/check_site.py
python3 tests/check_python.py
```

构建更新 `site/`、每章网页课件源及下载包。`site/downloads/*.zip` 不跟踪，GitHub Actions 构建后包含在 Pages 中。部署采用 `.github/workflows/pages.yml`。

## 目录

- `content/`：双语讲义、课程元数据、课件源。
- `site/engines/`：统一算法契约、图工具、KL/FM、实时谱求解、递归与多路算法。
- `site/assets/`：设计系统、实验、挑战、Python worker、进度与搜索。
- `python/`：每章两个函数的 starter/reference 与独立检查器。
- `tests/`：算法不变量、精确解、独立 Python pass 对照、站点链接与练习验证。
- `course-playbook/`：Su3037 的原制作手册（CC BY 4.0，保留署名）。
- `skills/partitioning-course/`：适用于本仓库的维护 skill 与交互规范。
- `docs/`：来源审计、实施记录、交付与验证报告。

## 交付边界

本版整合七章双语课程、真实实验、挑战和 Python，提供每章 12 页网页课件及原作者媒体入口。上游 playbook 的每章四部全新双语影片与原生 PDF/PPTX 并未在本版声称完成。原作素材未统一许可，因此保留原作者链接，不复制并重新授权。详情见 [完成报告](docs/COMPLETION_REPORT.md)。

新代码 MIT，新教材 CC BY 4.0。改编代码、字体、运行时与原作者贡献见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
