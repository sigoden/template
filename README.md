# 服务模板

## jsona接口预览

https://sigoden.github.io/jsona-openapi/?source=http://localhost:3000/_/static/api

## jsona格式规范

https://github.com/sigoden/jsona

## 更多服务示例

https://github.com/sigoden/use-services-example

## 脚本工具

- ./scripts/sync-models.js 从db.sql生成sequelize表类
- ./scripts/sync-handlers.js 从api.jsona生成handlers函数和类型定义
- ./scripts/sync-apitype.js 从api.jsona生成接口request类型定义
- ./scripts/list-routes.js 从api.jsona生成路由列表
- ./scripts/crud-jsona.js 从db.sql生成表crud的jsona代码
- ./scripts/crud-handlers.js 从db.sql生成表crud的handlers代码