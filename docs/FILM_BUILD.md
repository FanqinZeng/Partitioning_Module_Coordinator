# 首页导论片：构建与复核

成片：`site/media/home/intro.zh.mp4` 与 `intro.en.mp4`，各 190 秒、1920×1080、30fps，H.264 yuv420p + AAC，faststart。中文画面为中文主字幕加英文小字；英文版切换画面标签与字幕。两版共用时间轴。

## 叙事与数据

16 个场景、30 条字幕：两组分工 → 容量 → 定义 → 芯片 → 公共图 → cut 12 → cut 3 → 面积约束 → 15/10 种二分 → 100 节点三十位候选数 → 初始构造 → KL/FM → 谱扫描 → 递归 → 多路比较 → Lesson 02 邀请。

- `video/home/storyboard.json`：中英分镜、字幕、章节与时长。
- `scripts/film/export_intro_data.mjs`：直接运行站点引擎，导出 `video/home/data.json`。
- `video/home/scenes.py`：动画绘制与数字断言，不使用手写替代轨迹。
- 枚举说明明确是非空、忽略左右命名，且未加平衡约束；五节点限定二/三人数时另行显示 10。
- 芯片布线图与开场分工图标为示意，不声称来自真实网表或物理布线结果。

## 可复现构建

影片依赖单独安装，不影响站点构建：

```sh
python3 -m venv .venv-film
.venv-film/bin/pip install pillow numpy imageio-ffmpeg
python3 scripts/film/fetch_fonts.py
node scripts/film/export_intro_data.mjs
.venv-film/bin/python scripts/film/render_intro.py --stills
.venv-film/bin/python scripts/film/render_intro.py --sample 60 98 --lang zh
.venv-film/bin/python scripts/film/render_intro.py --lang both
.venv-film/bin/python scripts/film/validate_intro.py
python3 scripts/build.py
```

字体从固定的 Learning Clustering 版本获取到 `.cache/film-fonts/`，OFL 许可已在站点字体目录保留。渲染使用完整字体，不用浏览器的子集字体替代新字。缓存与审片图不进入 Git。

原始配乐《Boundaries / 边界》由 `scripts/film/score.py` 程序合成，没有第三方录音或采样。音频实际 PCM 的 RMS、峰值、削波数和事件时间保存在 `.cache/film/boundaries.json`；发行元数据含级别结果。成片中的动画、字幕与配乐按 CC BY 4.0，代码按 MIT。

## 审片

`--stills` 输出两版 contact sheet，以及每个场景入场、中段、出场三帧。`--sample 60 98` 输出 38 秒代表样片，覆盖实际割边累计、分组移动与面积约束。审片产物在 `.qa/intro/`。

完成渲染后运行 `scripts/film/validate_intro.py` 检查完整解码、分辨率/帧率、AAC、faststart、时长、字幕时序与数据断言。`tests/film.test.mjs` 在普通 CI 中检查电影数据与当前引擎一致、阅读时间和分发资产。
