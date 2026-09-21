# 知识小冒险 · 小学生学习助手

面向小学一至六年级的离线知识闯关项目。当前包含三年级上册语文、数学、英语全单元精选练习及原口算，采用规格驱动开发。

## 立即运行

双击本目录 `index.html` 即可离线玩；不需要安装依赖、不需要网络。支持浏览器数字键、退格键和 Enter，以及屏幕数字面板。

开发预览：在本目录运行 `python3 -m http.server 8000`，访问 http://localhost:8000。测试：`node --test tests/*.test.cjs`。

## 当前版本

模块化和年级/学期/单元选择已完成。语文8单元115题、数学8单元加实践与复习175题、英语6单元加Revision100题，共390题、27个学习范围。第一单元各10题，其余范围各15题，每轮随机抽10题并打乱选项。84项程序测试及Chrome280题回归通过。详见[最新验收报告](docs/validation/full-semester-report.md)与[教材覆盖清单](docs/content/full-semester-coverage.md)。

结构：`src/content/`管理内容注册，`src/core/`管理选择题会话，`src/platform/`处理存储，`src/features/`提供视图，`styles/`分层管理样式；`src/app.js`协调交互，`src/engine.js`保留口算生成。

支持自动跳题、错题复盘和独立成绩，同时保留口算练习/挑战。当前是有限内容试玩版，尚未接入语音包、教材导入或安装包。

- [产品分析档案](docs/analysis/README.md)
- [十阶段路线与逐阶段验证方案](docs/roadmap/README.md)
- [最终产品状态](docs/roadmap/final-product.md)
- [项目当前状态](docs/roadmap/current-state.md)
- [跨平台目标与验收矩阵](docs/roadmap/platforms.md)
- [产品愿景与阶段路线](docs/product.md)
- [第一阶段规格](specs/001-arithmetic/spec.md)
- [第一阶段最新验收报告](docs/validation/phase01-report.md)
- [V1规格](specs/002-v1-three-subjects/spec.md)
- [V1内容核对](docs/content/v1-content-audit.md)
- [V1 Alpha验证报告](docs/validation/v1-alpha-report.md)
- [技术方案](specs/001-arithmetic/plan.md)
- [任务与验证记录](specs/001-arithmetic/tasks.md)

## 开发流程

1. 新建一轮分析记录，保存需求、判断、变更原因及待确认事项。
2. 为功能创建/更新 `specs/编号-功能/spec.md`，写出可验证的验收条件。
3. 更新 `plan.md` 和 `tasks.md`，再实现代码。
4. 执行验收，记录通过项和未验证项。

尚未实现：教材上传、其他年级/学期、内置离线语音包、手写、昆虫与生活题、跨设备同步、离线安装包和正式发布。章节精选题不覆盖全部词表、听说读写及动手活动，具体见覆盖清单。发布前需要确定教材及媒体的使用范围，并完成目标设备验证。
