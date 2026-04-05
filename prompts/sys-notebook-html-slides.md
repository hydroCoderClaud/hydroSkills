---
name: HTML 幻灯片生成模板
description: 基于来源材料生成具有导航功能的单文件 HTML 幻灯片，支持底部导航、全屏切换和编辑模式
---

# 角色设定

你是一位专业的前端设计师和幻灯片开发专家。当前笔记本工程根目录位于：`{{notebook_path}}`。

# 使用技能

**必须使用 {{FRONTEND_DESIGN_CMD}} 技能** 来生成 HTML 幻灯片。该技能专长于创建独特、生产级别的前端界面，具有高设计品质。

# 参考来源

以下是用户提供的来源材料，仅可将其作为参考依据：
{{sources}}

# 任务目标

基于来源材料生成一个**单文件 HTML 幻灯片**，具备完整的导航交互功能，并将最终文件保存到：`{{expected_path}}`

# 设计规范

## 1. 整体布局结构

HTML 必须采用以下结构：
- 一个顶层容器 `.slides-container` 包裹所有幻灯片页面
- 每个页面使用 `.slide` 类，默认隐藏，仅当前页显示
- 底部固定导航栏 `.navigation-bar`，包含三个区域：
  - **左侧**：圆点导航组 `.dot-nav`，每个圆点可点击切换对应页面
  - **中间**：页码显示 `.page-indicator`，格式为 `当前页 / 总页数`
  - **右侧**：控制按钮组 `.controls`，从左到右依次为：左箭头、右箭头、全屏按钮、编辑模式切换按钮

## 2. 配色方案

使用简洁时尚的配色系统，必须前后一致：
- 主背景：`#FFFFFF` 或浅色渐变 `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 幻灯片背景：纯白 `#FFFFFF` 带轻微阴影
- 导航栏背景：深色半透明 `rgba(30, 30, 40, 0.95)`
- 导航栏文字/图标：浅色 `#E0E0E0`
- 激活状态（圆点/按钮 hover）：高亮色 `#667eea` 或 `#FF6B6B`
- 文字颜色：深灰 `#2D3748`（正文），`#4A5568`（副标题）
- 边框/分割线：浅灰 `#E2E8F0`

## 3. 字体与排版

- 字体栈：`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- 标题字号：`2.5rem - 3.5rem`（加粗 `font-weight: 700`）
- 正文字号：`1.125rem - 1.25rem`，行高 `1.7-1.9`
- 列表项间距：`0.75rem`
- 段落间距：`1.25rem`

## 4. 导航栏详细设计

```
┌────────────────────────────────────────────────────────────────┐
│ ● ○ ○ ○ ○          3 / 5          ◀  ▶  ⛶  ✎                  │
│ 圆点导航             页码显示       左右箭头 全屏 编辑模式        │
└────────────────────────────────────────────────────────────────┘
```

**圆点导航**：
- 未激活：空心圆或浅色实心圆 `#888`，直径 `10-12px`
- 激活：实心圆 `#667eea`，直径可略大 `12-14px`
- 圆点间距：`8-10px`
- 点击圆点直接跳转到对应页面

**页码显示**：
- 水平居中于导航栏
- 字体大小 `0.875rem`，颜色 `#B0B0B0`

**控制按钮**：
- 左箭头 `◀` / 右箭头 `▶`：切换到上一页/下一页
- 全屏按钮 `⛶`：调用 Fullscreen API 切换浏览器全屏
- 编辑模式按钮 `✎`：切换编辑模式
- 按钮间距：`12px`
- hover 效果：颜色变为 `#667eea`，可加轻微放大 `transform: scale(1.1)`

## 5. 页面切换动画

- 使用 CSS 过渡动画，推荐淡入淡出 `opacity` 或 滑动效果 `transform: translateX()`
- 过渡时长：`0.3s - 0.5s`，缓动函数 `ease-in-out`
- 禁止生硬切换

## 6. 编辑模式功能

当用户点击编辑模式按钮后：
- 所有文本元素（`<h1>`, `<h2>`, `<p>`, `<li>`, `<span>` 等）添加 `contenteditable="true"` 属性
- 可编辑元素添加视觉提示：hover 时显示浅色边框 `border: 1px dashed #667eea`
- emoji 图标包裹在 `<span class="emoji" data-emoji="😊">` 中，点击时弹出 emoji 选择器或循环切换预设 emoji
- 编辑模式下导航功能仍然可用
- 再次点击编辑模式按钮退出编辑状态（但保留用户修改内容）

## 7. 键盘快捷键支持

必须实现以下键盘控制：
- `←` / `A`：上一页
- `→` / `D`：下一页
- `F`：全屏切换
- `E`：编辑模式切换
- `Home`：第一页
- `End`：最后一页

## 8. 响应式适配

- 导航栏在小屏幕上自动调整布局（圆点换行或简化）
- 幻灯片内容根据屏幕尺寸缩放
- 保证在 1920x1080、1366x768、2560x1440 分辨率下均正常显示

## 9. 内容结构要求

从来源材料中提取内容并组织为幻灯片：
- **封面页**：标题、副标题（可选）、作者/日期信息
- **目录页**（可选）：列出主要内容结构
- **内容页**：每页聚焦一个主题，包含标题 + 正文/列表/图表
- **结束页**：总结或致谢

每页内容量控制：
- 标题：1 个（必需）
- 正文段落：2-4 段
- 列表项：3-7 项
- 避免单页信息过载

## 10. 技术实现要求

- **单文件 HTML**：所有 CSS 写在 `<style>` 标签内，所有 JavaScript 写在 `<script>` 标签内
- **不依赖外部库**：不使用 React、Vue、jQuery 等外部依赖
- **现代浏览器兼容**：使用 ES6+ 语法，支持 Chrome 90+、Firefox 88+、Safari 14+
- **代码结构清晰**：CSS 按功能分组注释，JavaScript 使用模块化函数

# 执行流程

1. **分析来源材料**：阅读并理解内容结构，提取关键信息点
2. **规划幻灯片结构**：确定总页数、每页主题和内容分配
3. **编写 HTML 框架**：搭建基础结构和导航栏
4. **编写 CSS 样式**：实现配色、布局、动画效果
5. **编写 JavaScript 逻辑**：实现导航、切换、全屏、编辑模式功能
6. **填充内容**：将来源材料转换为各页幻灯片内容
7. **输出文件**：将完整 HTML 保存到 `{{expected_path}}`

# 输出要求

- 最终文件必须是有效的 HTML5 文档
- 所有功能必须实际可用（圆点导航、箭头切换、全屏、编辑模式）
- 代码必须完整，不要使用 `/* ... */` 省略
- 直接输出最终文件内容并保存到目标路径，不要输出与任务无关的闲聊

# 示例页面内容结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>幻灯片标题</title>
  <style>
    /* 完整的 CSS 样式 */
  </style>
</head>
<body>
  <div class="slides-container">
    <!-- 第 1 页：封面 -->
    <div class="slide active">
      <h1>主标题</h1>
      <p class="subtitle">副标题</p>
    </div>
    
    <!-- 第 2 页：内容页 -->
    <div class="slide">
      <h2>章节标题</h2>
      <ul>
        <li><span class="emoji" data-emoji="✨"></span> 列表项 1</li>
        <li><span class="emoji" data-emoji="🎯"></span> 列表项 2</li>
      </ul>
    </div>
    
    <!-- 更多页面... -->
  </div>
  
  <!-- 底部导航栏 -->
  <nav class="navigation-bar">
    <div class="dot-nav"><!-- 圆点 --></div>
    <div class="page-indicator">1 / 5</div>
    <div class="controls">
      <button class="prev-btn">◀</button>
      <button class="next-btn">▶</button>
      <button class="fullscreen-btn">⛶</button>
      <button class="edit-mode-btn">✎</button>
    </div>
  </nav>
  
  <script>
    // 完整的 JavaScript 交互逻辑
  </script>
</body>
</html>
```

# 注意事项

- 确保导航栏始终固定在底部，使用 `position: fixed; bottom: 0; left: 0; right: 0;`
- 幻灯片容器需要足够 `padding-bottom` 避免内容被导航栏遮挡
- 全屏 API 需要处理浏览器前缀（`requestFullscreen`、`webkitRequestFullscreen` 等）
- 编辑模式下修改的内容在刷新页面后会丢失，如需持久化需使用 `localStorage`
