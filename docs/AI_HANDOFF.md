# qiqi-xiangqi：项目运行与AI接手

儿童象棋闯关与人机对弈静态网页，题库和规则随仓库提供。

## 仓库身份

- 分类：学习与游戏；类型：static。
- 默认分支：`main`；当前可见性：公开。
- 本说明针对本仓库当前文件；历史本机绝对路径与相似项目不能作为当前运行位置。

## 先读这些文件

- [index.html](<../index.html>)
- [rules.js](<../rules.js>)
- [ai.js](<../ai.js>)
- [app.js](<../app.js>)
- [THIRD_PARTY_NOTICES.md](<../THIRD_PARTY_NOTICES.md>)

## 安装和启动

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

在浏览器打开 http://127.0.0.1:8000 。静态站点无后端；Worker、WASM及PWA缓存应通过HTTP/HTTPS验证，不能只双击HTML判断。




## 数据与搬迁

闯关进度在浏览器本地，题目在puzzles-*.js；保留第三方题库来源和许可证。

## 怎么验证

先执行 [验证记录](VERIFICATION.md) 所列命令，再按改动检查实际页面或输出。没有测试脚本时不能把占位npm test当作通过。仅文档更改检查链接和路径；涉及数据、几何、金额或接口的修改运行相应回归测试。



## 继续维护

先读根目录AGENTS.md；若它是CLAUDE.md的链接则直接读后者。保留已有项目约定。修改前确认分支、当前差异、数据目录与实际服务。完成后更新本说明/验证记录，提交明确的源码和文档路径，并核对GitHub远端提交。公开状态、旧版、URL与业务数据需按用户既有约定保持。
