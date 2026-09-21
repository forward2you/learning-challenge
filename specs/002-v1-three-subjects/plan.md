# V1技术方案

- `data/v1-content.js`：静态、版本化、可离线加载的审核内容包。
- `src/content.js`：纯函数校验、筛选、洗牌抽题、选择题判分和历史清洗，同时支持浏览器与Node测试。
- `src/app.js`：在现有口算状态机上增加首页学科入口、选择题答题与结果状态；沿用统一的自动推进定时器。
- 口算历史继续使用 `learning-challenge.history.v1`；三科历史使用独立的 `learning-challenge.quiz-history.v1`。
- 所有资源本地加载，不引用CDN、在线接口或云端语音。

内容题目为基于教材知识点的原创改写，并保留来源定位。V1中的`reviewStatus: approved`表示本项目已根据当前教材页面进行内部核对，不表示出版社审定或教育效果验证。
