# QQ机器人查询管理 项目记忆

## 部署

- **部署目标**：飞牛 NAS Docker，不部署到云服务器
- **云服务器** (103.236.92.3:41185)：只跑幼儿园项目，**不要在上面改任何东西**
- **构建命令**：`npm run build`，产物在 `dist/`
- **Docker 部署包**：`tar czf qqbot-deploy.tar.gz dist default.conf Dockerfile`
- **部署命令**（在飞牛终端执行）：
  ```bash
  curl -fsSL <下载url> | tar xz && docker build -t qq-batch-query . && docker stop qq-batch-query 2>/dev/null; docker rm qq-batch-query 2>/dev/null; docker run -d --name qq-batch-query --restart unless-stopped -p 3080:80 qq-batch-query
  ```
- **飞牛访问**：不能直接 SSH，端口开了但 FN Connect 不走原生 TCP。需通过 FN Connect WebUI 暴露 Docker 端口或用 Web 界面管理。
- **GitHub**：`https://github.com/lyrice1/QQjiqirenchaxun`

## Nginx/Docker 配置

- `default.conf` 代理 `/api/` → `http://172.17.0.1:3100/`（同机 NapCat Docker）
- NapCat 在飞牛 Docker 中，外部通过 FN Connect（如 `https://9ee993fa6a31-0.ly19941011.5ddd.com/`）访问
- `index.html` 必须设 `Cache-Control: no-cache`，否则旧页面缓存导致需要刷新

## 代码踩坑

### setInterval 必须带延迟参数
```js
// 错误：缺少延迟参数，轮询过于频繁阻塞 UI
setInterval(async () => { ... })
// 正确：
setInterval(async () => { ... }, 1500)
```

### overflow: hidden 阻止 position: sticky
- 父元素有 `overflow: hidden` 时，子元素的 `position: sticky` 会失效
- 要让 `.group-header` sticky，必须从 `.group` 中移除 `overflow: hidden`

### position: sticky 在嵌套结构中的问题
- 如果 sticky 元素嵌套在多层 div 内，可能因中间元素的布局上下文而失效
- 解决方案：将 sticky 元素提升到滚动容器的直接子级，或使用内联 style：`style="position:sticky;top:90px;z-index:5"`
- Vue scoped CSS 的 `position: sticky` 可能因 data 属性 scope 机制失效，用内联 style 绕过

### Vue 模板标签闭合
- 修改模板后先跑 `npm run build` 确认无语法错误
- 常见错误：`<div>` 缺少闭合 `</div>`，build 报 "Element is missing end tag"

### border-radius 在 WebKit 中可能干扰 sticky
- `.panel` 元素的 `border-radius` + `box-shadow` 在 iOS Safari 中可能阻止子元素 sticky 生效
- 如果 sticky 始终无效，尝试移除父元素的 `border-radius` 和 `box-shadow`

## 数据备份

- 主数据存储在 `localStorage['qq-bot-project-groups']`
- `saveGroups()` 同时写入备份 key `qq-bot-project-groups-backup`
- `loadGroups()` 在主数据损坏/缺失时自动从备份恢复
- 已移除导入导出 UI 按钮，只保留自动备份机制

## 按钮发送行为

- "上车"：发送项目名（如"中视频"），mode=login
- "查询"：发送"项目名+查询"（如"中视频查询"），mode=query
- "管理"：发送"项目名+管理"（如"中视频管理"），mode=manage
- 自定义指令：发送用户输入的内容本身，不拼接项目名
