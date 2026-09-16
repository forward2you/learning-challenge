# 知识小冒险 · 小学生学习助手

面向小学一至六年级的离线知识闯关项目，首版以三年级口算为起点，采用规格驱动开发。

## 立即运行

双击本目录 `index.html` 即可离线玩；不需要安装依赖、不需要网络。支持浏览器数字键、退格键和 Enter，以及屏幕数字面板。

开发预览：在本目录运行 `python3 -m http.server 8000`，访问 http://localhost:8000。测试：`node --test tests/*.test.cjs`。

## 当前版本

第一阶段：每轮10题，三种题型、练习/挑战模式、错题解析与本地最近成绩。挑战记录总用时，不设置淘汰倒计时。存储不可用时仍可正常完成游戏。直接打开文件时成绩保存能力取决于浏览器，稳定使用建议固定本地服务地址。

- [产品分析档案](docs/analysis/README.md)
- [十阶段路线与逐阶段验证方案](docs/roadmap/README.md)
- [最终产品状态](docs/roadmap/final-product.md)
- [项目当前状态](docs/roadmap/current-state.md)
- [跨平台目标与验收矩阵](docs/roadmap/platforms.md)
- [产品愿景与阶段路线](docs/product.md)
- [第一阶段规格](specs/001-arithmetic/spec.md)
- [第一阶段最新验收报告](docs/validation/phase01-report.md)
- [技术方案](specs/001-arithmetic/plan.md)
- [任务与验证记录](specs/001-arithmetic/tasks.md)

## 开发流程

1. 新建一轮分析记录，保存需求、判断、变更原因及待确认事项。
2. 为功能创建/更新 `specs/编号-功能/spec.md`，写出可验证的验收条件。
3. 更新 `plan.md` 和 `tasks.md`，再实现代码。
4. 执行验收，记录通过项和未验证项。

尚未实现：教材上传、语文英语题库、音频、手写、昆虫与生活题、跨设备同步、正式部署。发布前需要确定教材及媒体的使用范围，并完成目标设备验证。
