# 服务模板

## jsona接口预览

https://sigoden.github.io/jsona-openapi/?source=http://localhost:3000/_/static/api

## jsona格式规范


https://github.com/sigoden/jsona


## 下划线接口

```
{
    health: { @endpoint({summary:"健康检查"})
        route: "GET /_/health",
    },
    runSrvs: { @endpoint({summary:"模拟接口"})
        route: "POST /_/srvs",
        req: {
            body: {
                path: "mock.delay",
                args: [
                    2,
                ],
                ret: false, @description("是否返回数据，默认true")
            }
        }
    },
    static: { @endpoint({summary:"静态文件"})
        route: "POST /_/static/:file"
    }
}

```

## 路由规范

```
  routes: [
    ["/c", "api.jsona"], // handlers
    ["/m", "apiManage.jsona"], //  handlersManage
  ],
```