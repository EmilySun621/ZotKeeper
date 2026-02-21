# Data & pipelines

- **`raw/`** — 原始数据：CSV、下载的 JSON 等。把要处理的 CSV 放这里。
- **`processed/`** — 处理后的输出：生成的 JSON、SQLite 等 database 文件，供前端或 API 使用。

Python 数据处理脚本放在项目根下的 **`scripts/`**（与现有 `load_epicurious.py` 一致），例如：

- `scripts/process_csv_to_db.py` — 读 `data/raw/xxx.csv`，写 `data/processed/` 或 `src/data/`。
- 运行：`python scripts/process_csv_to_db.py`（或在 IDE 里直接跑）。

若 CSV 或数据库很大，可在 `.gitignore` 里加上 `data/raw/*.csv`、`data/processed/*.db` 等，避免提交大文件。

**本地 vs 云端**：导入脚本默认只写入 1 万条（防卡机）。要把全量数据放云端时，在云主机上跑导入并跑后端即可，见 **`docs/data-cloud-options.md`**。

**前端接后端**：搜索 / Feed / 食谱详情已改为请求本项目的 **recipe ranking 后端**。需先启动后端：`pip install fastapi uvicorn`，再 `uvicorn scripts.serve_recipes:app --port 8000`。前端默认请求 `http://localhost:8000`，可通过 `.env` 中 `VITE_RECIPE_API_URL` 修改。
