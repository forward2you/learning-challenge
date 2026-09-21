# 017 · GitHub Pages 自动校验与部署

日期：2026-09-21。

## 用户需求

为当前项目创建 GitHub Actions 步骤，在变更进入主分支前执行校验，并把通过校验的静态站点部署到 GitHub Pages。

## 产品假设

- GitHub Pages 是当前网页版的可选试玩和分享渠道，不替代路线中的离线安装包，也不改变“日常使用可离线”的产品目标。
- 仓库默认分支为 `main`，发布内容来自该分支；拉取请求只校验，不发布。
- GitHub 仓库允许 Actions 使用 Pages；首次使用时需由仓库管理员在 Settings → Pages 中选择 GitHub Actions 作为发布源。

## 实现决定

- 使用 GitHub 官方 Pages Actions，授予最小的 `contents: read`、`pages: write` 与 `id-token: write` 权限。
- PR、`main` 推送均运行全部 Node 测试；只有 `main` 推送和从 `main` 手动触发时才部署。
- 发布包只包含 `index.html`、`src/`、`styles/`、`data/` 与 `.nojekyll`，不发布测试、规格、截图或仓库元数据。
- 新增静态发布校验，确认 HTML 的本地脚本、样式和站内链接存在，且运行页面没有 HTTP(S) 资源依赖；相对路径保证项目站点子路径可用。
- 同一分支的重复发布使用并发组串行化，避免并行部署互相覆盖。

## 范围变化与原因

此前路线把公网网页列为可选项。本轮应用户要求增加 GitHub Pages 试玩渠道和持续部署自动化；这不是阶段10离线安装包、应用商店上架或正式多平台发行的完成证明。

## 验证事实

工作流实现完成。`node --test tests/*.test.cjs` 86/86通过；YAML 可解析；临时发布包共19个文件，并从 `/learning-challenge/` 子路径通过首页和样式 HTTP 冒烟检查。当前预期线上地址仍返回404，GitHub 托管工作流与公开 URL 尚未验证，详见[验证报告](../validation/github-pages-report.md)。
