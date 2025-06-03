import mermaid from 'mermaid';
import * as monaco from 'monaco-editor';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Configure Monaco Editor - disable workers to avoid web worker issues
window.MonacoEnvironment = {
  getWorker: function() {
    return {
      postMessage: function() {},
      terminate: function() {},
      addEventListener: function() {},
      removeEventListener: function() {}
    };
  }
};

// 初始化 Mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'monospace',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true
    },
    sequence: {
        useMaxWidth: true
    },
    gantt: {
        useMaxWidth: true
    },
    journey: {
        useMaxWidth: true
    },
    timeline: {
        useMaxWidth: true
    },
    // 确保图表可以根据内容自由扩展高度
    maxTextSize: 90000,
    maxEdges: 2000
});

// 全局变量
let editor;
let currentDiagramId = 0;
let isAITyping = false; // 标志AI是否正在编写代码

// 示例代码模板 - 丰富的实用示例
const examples = {
    // 流程图示例 - 基础到高级
    flowchart: `flowchart TD
    A([开始]) --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E([结束])
    D --> E
    
    %% 样式定义
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:3px,color:#000
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#000
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    
    class A,E startEnd
    class C,D process
    class B decision`,

    flowchart_advanced: `flowchart TD
    subgraph APP ["🌐 应用层"]
        A([开始登录]) --> B[/输入用户名密码/]
        B --> C{验证格式}
        C -->|格式正确| D[发送验证请求]
        C -->|格式错误| B
    end
    
    subgraph AUTH ["🔐 认证服务"]
        D --> E[检查用户存在]
        E --> F{用户存在?}
        F -->|是| G[验证密码]
        F -->|否| H[用户不存在]
        G --> I{密码正确?}
        I -->|是| J[生成JWT Token]
        I -->|否| K[密码错误]
    end
    
    subgraph DB ["💾 数据库"]
        E -.-> L[(用户表)]
        G -.-> L
        J --> M[(Session表)]
    end
    
    %% 返回结果
    J --> N[登录成功]
    H --> O[返回错误：用户不存在]
    K --> P[返回错误：密码错误]
    N --> Q([跳转主页])
    O --> R([显示错误信息])
    P --> R
    
    %% 样式定义
    classDef appStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#000
    classDef authStyle fill:#f1f8e9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef dbStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef errorStyle fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#000
    classDef successStyle fill:#e8f5e8,stroke:#4caf50,stroke-width:2px,color:#000
    
    class A,B,C,D appStyle
    class E,F,G,H,I,J,K authStyle
    class L,M dbStyle
    class O,P,R errorStyle
    class N,Q successStyle`,

    flowchart_simple: `flowchart TD
    Start([开始]) --> Input[/输入数据/]
    Input --> Validate{数据有效?}
    Validate -->|有效| Process[处理数据]
    Validate -->|无效| Error[显示错误]
    Process --> Output[/输出结果/]
    Error --> Input
    Output --> Save[(保存结果)]
    Save --> End([结束])
    
    %% 添加样式
    classDef startEnd fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    classDef process fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef decision fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
    classDef io fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    classDef error fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    classDef storage fill:#607D8B,stroke:#37474F,stroke-width:2px,color:#fff
    
    class Start,End startEnd
    class Process process
    class Validate decision
    class Input,Output io
    class Error error
    class Save storage`,

    flowchart_shapes: `flowchart TD
    A[矩形节点] --> B(圆角矩形)
    B --> C([体育场形状])
    C --> D[[子程序]]
    D --> E[(数据库)]
    E --> F((圆形))
    F --> G{菱形判断}
    G -->|是| H[/输入输出/]
    G -->|否| I[显示]
    H --> J{{六角形}}
    I --> J
    
    %% 节点样式
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px
    classDef highlight fill:#ffeb3b,stroke:#f57f17,stroke-width:3px
    classDef process fill:#4caf50,stroke:#2e7d32,stroke-width:2px
    classDef decision fill:#ff9800,stroke:#e65100,stroke-width:2px
    
    class A,D,I default
    class B,C highlight
    class E,F,H,J process
    class G decision`,

    flowchart_connections: `flowchart LR
    A --> B
    A --- C
    A -.- D
    A -.-> E
    A ==> F
    A --o G
    A --x H
    
    B -->|带标签| I
    C ---|实线| J
    D -.-|虚线| K
    E -.->|虚线箭头| L
    F ==>|粗箭头| M
    G --o|圆点| N
    H --x|叉号| O
    
    %% 链式连接
    P --> Q --> R --> S
    
    %% 多分支
    T --> U
    T --> V
    T --> W
    
    %% 样式
    classDef default fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000`,

    flowchart_subgraph: `flowchart TB
    subgraph TOP [顶层系统]
        direction TB
        subgraph B1 [子系统1]
            direction RL
            i1 -->f1
        end
        subgraph B2 [子系统2]
            direction BT
            i2 -->f2
        end
    end
    
    A --> TOP --> B
    B1 --> B2
    
    %% 外部连接
    C --> B2
    B1 --> D
    
    classDef subgraphStyle fill:#f9f9f9,stroke:#333,stroke-width:4px`,

    // 序列图示例 - 多种场景
    sequence: `sequenceDiagram
    participant U as 👤用户
    participant W as 🌐前端
    participant S as 🔧后端
    participant D as 🗄️数据库
    participant C as 📄缓存
    
    U->>W: 登录请求
    W->>S: 验证凭据
    S->>D: 查询用户信息
    D-->>S: 返回用户数据
    
    alt 用户存在且密码正确
        S->>C: 创建会话
        C-->>S: 会话ID
        S-->>W: 登录成功 + Token
        W-->>U: 跳转到主页
    else 用户不存在或密码错误
        S-->>W: 登录失败
        W-->>U: 显示错误信息
    end
    
    Note over U,D: 整个认证流程
    Note right of C: 会话缓存<br/>提高性能`,

    sequence_api: `sequenceDiagram
    participant Client as 客户端
    participant Gateway as API网关
    participant Auth as 认证服务
    participant Order as 订单服务
    participant Payment as 支付服务
    participant DB as 数据库
    
    Client->>Gateway: POST /api/orders
    Gateway->>Auth: 验证Token
    Auth-->>Gateway: Token有效
    
    Gateway->>Order: 创建订单
    Order->>DB: 检查库存
    DB-->>Order: 库存充足
    
    Order->>Payment: 发起支付
    Payment->>Payment: 处理支付
    
    alt 支付成功
        Payment-->>Order: 支付完成
        Order->>DB: 更新订单状态
        Order-->>Gateway: 订单创建成功
        Gateway-->>Client: 200 OK
    else 支付失败
        Payment-->>Order: 支付失败
        Order->>DB: 回滚订单
        Order-->>Gateway: 订单创建失败
        Gateway-->>Client: 400 Error
    end`,

    // 类图示例 - 详细的OOP设计
    class: `classDiagram
    %% 电商系统类图设计
    class User {
        -int userId
        -string username
        -string email
        -string password
        +register()
        +login()
        +updateProfile()
        +getOrders()
    }
    
    class Product {
        -int productId
        -string name
        -string description
        -float price
        -int stock
        -string category
        +updatePrice(newPrice)
        +updateStock(quantity)
        +getDetails()
    }
    
    class Order {
        -int orderId
        -int userId
        -string orderDate
        -float totalAmount
        -string status
        +addItem(productId, quantity)
        +removeItem(productId)
        +calculateTotal()
        +updateStatus(status)
    }
    
    class OrderItem {
        -int orderItemId
        -int orderId
        -int productId
        -int quantity
        -float unitPrice
        +getSubtotal()
    }
    
    class Payment {
        -int paymentId
        -int orderId
        -float amount
        -string method
        -string status
        +processPayment()
        +refund()
    }
    
    class Cart {
        -int cartId
        -int userId
        +addProduct(productId, quantity)
        +removeProduct(productId)
        +clear()
        +checkout()
    }
    
    User --> Order
    User --> Cart
    Order --> OrderItem
    Product --> OrderItem
    Order --> Payment
    
    User <|-- AdminUser
    User <|-- CustomerUser
    
    class AdminUser {
        +manageProducts()
        +viewAllOrders()
        +generateReports()
    }
    
    class CustomerUser {
        +browseProducts()
        +addToCart()
        +trackOrder()
    }`,

    class_inheritance: `classDiagram
    %% 车辆管理系统 - 展示继承和多态
    class Vehicle {
        <<abstract>>
        #string brand
        #string model
        #int year
        #decimal price
        +start()*
        +stop()*
        +getInfo() string
        +calculateInsurance()* decimal
    }
    
    class Car {
        -int doors
        -string fuelType
        -boolean isAutomatic
        +start()
        +stop()
        +calculateInsurance() decimal
        +openTrunk()
    }
    
    class Motorcycle {
        -int engineCC
        -boolean hasSidecar
        +start()
        +stop()
        +calculateInsurance() decimal
        +wheelie()
    }
    
    class Truck {
        -decimal loadCapacity
        -string truckType
        +start()
        +stop()
        +calculateInsurance() decimal
        +loadCargo(decimal weight)
    }
    
    class ElectricCar {
        -int batteryCapacity
        -int range
        +charge()
        +getBatteryLevel() int
        +calculateInsurance() decimal
    }
    
    class HybridCar {
        -int batteryCapacity
        -string hybridType
        +switchMode()
        +calculateInsurance() decimal
    }
    
    %% 接口
    class Rentable {
        <<interface>>
        +rent(Customer customer, int days) boolean
        +return() boolean
        +calculateRentalFee(int days) decimal
    }
    
    class Serviceable {
        <<interface>>
        +scheduleService(Date date) boolean
        +getServiceHistory() List~ServiceRecord~
    }
    
    %% 继承关系
    Vehicle <|-- Car
    Vehicle <|-- Motorcycle
    Vehicle <|-- Truck
    Car <|-- ElectricCar
    Car <|-- HybridCar
    
    %% 实现接口
    Vehicle ..|> Serviceable
    Car ..|> Rentable
    Motorcycle ..|> Rentable
    
    %% 组合关系
    Car *-- Engine
    Car *-- Transmission
    
    class Engine {
        -string type
        -int horsepower
        -decimal displacement
        +start()
        +stop()
    }
    
    class Transmission {
        -string type
        -int gears
        +shiftGear(int gear)
    }`,

    // 状态图示例 - 复杂状态机
    state: `stateDiagram-v2
    %% 订单状态流转
    [*] --> 待支付 : 创建订单
    
    待支付 --> 已支付 : 支付成功
    待支付 --> 已取消 : 超时/主动取消
    
    已支付 --> 备货中 : 开始备货
    已支付 --> 退款中 : 申请退款
    
    备货中 --> 已发货 : 发货完成
    备货中 --> 退款中 : 库存不足
    
    已发货 --> 运输中 : 物流接收
    已发货 --> 退货中 : 拒收退货
    
    运输中 --> 已送达 : 配送完成
    运输中 --> 退货中 : 运输异常
    
    已送达 --> 已完成 : 确认收货
    已送达 --> 退货中 : 质量问题退货
    
    退款中 --> 已退款 : 退款成功
    退货中 --> 已退货 : 退货完成
    
    已取消 --> [*]
    已退款 --> [*]
    已退货 --> [*]
    已完成 --> [*]
    
    %% 复合状态
    state 运输中 {
        [*] --> 揽件
        揽件 --> 运输
        运输 --> 派件
        派件 --> [*]
    }
    
    state 退货中 {
        [*] --> 退货申请
        退货申请 --> 退货审核 : 提交申请
        退货审核 --> 等待退货 : 审核通过
        退货审核 --> 申请拒绝 : 审核拒绝
        等待退货 --> 退货完成 : 收到退货
        申请拒绝 --> [*]
        退货完成 --> [*]
    }`,

    state_machine: `stateDiagram-v2
    %% 用户登录状态机
    [*] --> 未登录
    
    未登录 --> 登录中 : 点击登录
    登录中 --> 已登录 : 认证成功
    登录中 --> 未登录 : 认证失败
    登录中 --> 未登录 : 取消登录
    
    已登录 --> 活跃 : 用户操作
    已登录 --> 空闲 : 无操作
    
    活跃 --> 空闲 : 停止操作
    空闲 --> 活跃 : 恢复操作
    空闲 --> 即将超时 : 30分钟无操作
    
    即将超时 --> 活跃 : 用户响应
    即将超时 --> 已超时 : 无响应
    
    已超时 --> 未登录 : 自动登出
    已登录 --> 未登录 : 主动登出
    
    note right of 即将超时
        弹出提示框
        "会话即将过期"
    end note
    
    note right of 已超时
        清除用户数据
        跳转登录页
    end note`,

    // ER图示例 - 完整数据库设计
    er: `erDiagram
    %% 电商平台数据库设计
    USER {
        int user_id PK
        string username
        string email
        string password_hash
        string first_name
        string last_name
        string phone
        string created_at
        string updated_at
        string role
    }
    
    CATEGORY {
        int category_id PK
        string name
        string description
        int parent_id FK
        string image_url
        int sort_order
    }
    
    PRODUCT {
        int product_id PK
        string name
        string description
        float price
        float discount_price
        int stock_quantity
        string sku
        int category_id FK
        int seller_id FK
        string created_at
        string updated_at
        float rating
        int review_count
    }
    
    ORDERS {
        int order_id PK
        int user_id FK
        float total_amount
        float discount_amount
        float final_amount
        string status
        string order_date
        string shipped_date
        string delivered_date
        string shipping_address
        string billing_address
    }
    
    ORDER_ITEM {
        int order_item_id PK
        int order_id FK
        int product_id FK
        int quantity
        float unit_price
        float total_price
    }
    
    CART {
        int cart_id PK
        int user_id FK
        int product_id FK
        int quantity
        string added_at
        string updated_at
    }
    
    REVIEW {
        int review_id PK
        int user_id FK
        int product_id FK
        int rating
        string title
        string comment
        string created_at
    }
    
    PAYMENT {
        int payment_id PK
        int order_id FK
        float amount
        string method
        string status
        string transaction_id
        string payment_date
    }
    
    USER ||--o{ ORDERS : places
    USER ||--o{ CART : has
    USER ||--o{ REVIEW : writes
    CATEGORY ||--o{ PRODUCT : contains
    PRODUCT ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ CART : contains
    PRODUCT ||--o{ REVIEW : has
    ORDERS ||--o{ ORDER_ITEM : contains
    ORDERS ||--|| PAYMENT : paid_by`,

    // 甘特图示例 - 详细项目计划
    gantt: `gantt
    title 🚀 Web应用开发项目计划
    dateFormat YYYY-MM-DD
    axisFormat %m/%d
    
    %% 项目阶段定义
    section 📋 项目启动
    项目立项           :milestone, m1, 2024-01-01, 0d
    需求收集           :done, req1, 2024-01-02, 2024-01-10
    可行性分析         :done, fea1, after req1, 3d
    项目计划制定       :done, plan1, after fea1, 2d
    
    section 🎨 设计阶段
    系统架构设计       :design1, after plan1, 5d
    数据库设计         :design2, after plan1, 4d
    UI/UX设计         :active, design3, 2024-01-15, 8d
    原型制作          :design4, after design3, 4d
    设计评审          :milestone, m2, after design4, 0d
    
    section 💻 开发阶段
    环境搭建          :dev1, after m2, 2d
    后端API开发       :dev2, after dev1, 15d
    前端界面开发      :dev3, after dev1, 18d
    数据库实现        :dev4, after dev1, 10d
    集成测试          :dev5, after dev2, 5d
    
    section 🧪 测试阶段
    单元测试          :test1, after dev2, 8d
    集成测试          :test2, after dev5, 6d
    系统测试          :test3, after test2, 8d
    用户验收测试      :test4, after test3, 5d
    性能测试          :test5, after test3, 4d
    
    section 🚀 部署上线
    生产环境准备      :deploy1, after test4, 3d
    数据迁移          :deploy2, after deploy1, 2d
    系统部署          :deploy3, after deploy2, 1d
    线上验证          :deploy4, after deploy3, 2d
    项目交付          :milestone, m3, after deploy4, 0d
    
    section 🔧 维护支持
    bug修复           :maintain1, after m3, 30d
    功能优化          :maintain2, after m3, 60d
    用户培训          :maintain3, after m3, 10d`,

    gantt_sprint: `gantt
    title 📱 移动APP开发 - 敏捷迭代计划
    dateFormat YYYY-MM-DD
    
    section Sprint 1 - 用户认证
    Sprint规划         :milestone, s1_start, 2024-02-01, 0d
    用户注册功能       :s1_task1, 2024-02-01, 3d
    用户登录功能       :s1_task2, after s1_task1, 3d
    密码重置功能       :s1_task3, after s1_task2, 2d
    测试用户认证       :s1_test, after s1_task3, 2d
    Sprint回顾         :milestone, s1_end, after s1_test, 0d
    
    section Sprint 2 - 核心功能
    Sprint规划         :milestone, s2_start, after s1_end, 0d
    商品浏览功能       :s2_task1, after s1_end, 4d
    商品搜索功能       :s2_task2, after s2_task1, 3d
    购物车功能         :s2_task3, after s2_task2, 3d
    测试核心功能       :s2_test, after s2_task3, 2d
    Sprint回顾         :milestone, s2_end, after s2_test, 0d
    
    section Sprint 3 - 订单支付
    Sprint规划         :milestone, s3_start, after s2_end, 0d
    订单创建功能       :s3_task1, after s2_end, 3d
    支付集成功能       :s3_task2, after s3_task1, 4d
    订单管理功能       :s3_task3, after s3_task2, 3d
    测试订单支付       :s3_test, after s3_task3, 2d
    Sprint回顾         :milestone, s3_end, after s3_test, 0d
    
    section Sprint 4 - 优化发布
    Sprint规划         :milestone, s4_start, after s3_end, 0d
    性能优化          :s4_task1, after s3_end, 3d
    UI优化            :s4_task2, after s3_end, 4d
    安全加固          :s4_task3, after s4_task1, 2d
    发布准备          :s4_task4, after s4_task2, 2d
    正式发布          :milestone, release, after s4_task4, 0d`,

    // 饼图示例 - 多种数据展示
    pie: `pie title 💰 2024年度收入分布
    "产品销售" : 45.2
    "服务收入" : 28.7
    "授权费用" : 15.1
    "广告收入" : 8.3
    "其他收入" : 2.7`,

    pie_survey: `pie title 📊 用户满意度调查结果
    "非常满意" : 156
    "满意" : 298
    "一般" : 87
    "不满意" : 23
    "非常不满意" : 8`,

    pie_technology: `pie title 🔧 技术栈使用占比
    "前端开发" : 35
    "后端开发" : 30
    "数据库" : 15
    "DevOps" : 12
    "测试" : 8`,

    // 时间线示例 - 软件开发历程
    timeline: `timeline
    title 🚀 软件开发项目时间线
    
    2024-01 : 项目启动
            : 需求分析
            : 技术选型
    
    2024-02 : 系统设计
            : 架构设计
            : 数据库设计
            : UI/UX设计
    
    2024-03 : 开发阶段
            : 前端开发
            : 后端API开发
            : 数据库实现
    
    2024-04 : 测试阶段
            : 单元测试
            : 集成测试
            : 用户验收测试
    
    2024-05 : 部署上线
            : 生产环境部署
            : 性能监控
            : 用户培训`,

    timeline_company: `timeline
    title 🏢 公司发展历程
    
    2020 : 公司成立
         : 获得天使投资
         : 团队组建
    
    2021 : 产品研发
         : MVP版本发布
         : 首批用户获取
         : A轮融资
    
    2022 : 业务扩张
         : 产品功能完善
         : 用户量突破10万
         : 市场拓展
    
    2023 : 技术升级
         : 架构重构
         : 性能优化
         : B轮融资
    
    2024 : 国际化
         : 海外市场进入
         : 多语言支持
         : 用户量突破100万`,

    // Git图示例 - 分支管理
    git: `---
title: 功能开发流程
---
gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   branch feature
   checkout feature
   commit
   commit
   checkout develop
   merge feature
   commit
   checkout main
   merge develop
   commit`,

    git_workflow: `---
title: Git工作流程
---
gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   branch feature
   checkout feature
   commit
   commit
   checkout develop
   merge feature
   commit
   branch release
   checkout release
   commit
   checkout main
   merge release
   commit
   branch hotfix
   checkout hotfix
   commit
   checkout main
   merge hotfix
   commit
   checkout develop
   merge hotfix
   commit`,

    // 象限图示例 - 优先级矩阵
    quadrant: `quadrantChart
    title 项目任务优先级矩阵
    x-axis Low Difficulty --> High Difficulty
    y-axis Low Value --> High Value
    quadrant-1 High Value Low Difficulty
    quadrant-2 High Value High Difficulty
    quadrant-3 Low Value Low Difficulty
    quadrant-4 Low Value High Difficulty
    User Login: [0.8, 0.9]
    Data Backup: [0.6, 0.95]
    UI Polish: [0.3, 0.4]
    Advanced Reports: [0.7, 0.6]
    Bug Fixes: [0.2, 0.8]
    Performance: [0.8, 0.7]
    Documentation: [0.1, 0.3]
    New Features: [0.9, 0.5]`,

    quadrant_skills: `quadrantChart
    title 技能发展象限图
    x-axis Low Current Level --> High Current Level
    y-axis Low Importance --> High Importance
    quadrant-1 High Importance Low Level
    quadrant-2 High Importance High Level
    quadrant-3 Low Importance Low Level
    quadrant-4 Low Importance High Level
    JavaScript: [0.8, 0.9]
    React: [0.6, 0.8]
    Node.js: [0.4, 0.7]
    Database Design: [0.3, 0.9]
    UI Design: [0.2, 0.5]
    Project Management: [0.5, 0.8]
    Algorithm: [0.7, 0.6]
    DevOps: [0.3, 0.7]`,

    // 用户旅程图示例 - 工作日流程
    journey: `journey
    title 我的工作日
    section 上班路上
      起床洗漱: 5: Me
      吃早餐: 4: Me
      通勤: 2: Me
      到达办公室: 4: Me
    section 工作时间
      查看邮件: 3: Me
      开晨会: 2: Me, Team
      编写代码: 5: Me
      午餐时间: 5: Me
      下午开发: 4: Me
    section 下班回家
      整理工作: 3: Me
      下班通勤: 2: Me
      到家休息: 5: Me`,

    journey_customer: `journey
    title 客户购买体验旅程
    section 发现产品
      浏览网站: 3: Customer
      查看产品: 4: Customer
      阅读评价: 3: Customer
    section 购买决策
      比较价格: 2: Customer
      咨询客服: 4: Customer, Support
      加入购物车: 5: Customer
    section 完成购买
      填写信息: 2: Customer
      选择支付: 3: Customer
      确认订单: 5: Customer
    section 售后体验
      收到商品: 5: Customer
      使用产品: 4: Customer
      评价反馈: 3: Customer`,

    // 思维导图示例 - 项目规划
    mindmap: `mindmap
  root((项目规划))
    需求分析
      用户调研
      竞品分析
      功能清单
    技术架构
      前端技术
        React
        Vue.js
      后端技术
        Node.js
        Python
      数据库
        MySQL
        MongoDB
    项目管理
      时间计划
      人员分配
      风险控制
    测试部署
      单元测试
      集成测试
      生产部署`,

    mindmap_learning: `mindmap
  root((学习计划))
    编程语言
      JavaScript
        ES6语法
        异步编程
        框架学习
      Python
        基础语法
        数据分析
        机器学习
    开发工具
      Git版本控制
      IDE使用
      调试技巧
    项目实践
      个人项目
      开源贡献
      团队协作
    职业发展
      技术博客
      社区参与
      认证考试`,

    // XY图示例 - 销售数据
    xychart: `xychart-beta
    title "销售收入趋势"
    x-axis [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
    y-axis "Revenue (万元)" 40 --> 110
    bar [50, 60, 75, 82, 95, 105, 110, 102, 92, 85, 70, 60]
    line [50, 60, 75, 82, 95, 105, 110, 102, 92, 85, 70, 60]`,

    xychart_performance: `xychart-beta
    title "网站性能指标"
    x-axis [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    y-axis "Response Time (ms)" 100 --> 500
    line [150, 180, 200, 250, 300, 220, 160]
    bar [120, 140, 170, 200, 280, 190, 130]`

};

// 初始化编辑器
function initEditor() {
    // 配置 Monaco Editor
    monaco.editor.defineTheme('mermaidTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#2d3748'
        }
    });
// 立即设置主题以避免闪白
    monaco.editor.setTheme('mermaidTheme');

    editor = monaco.editor.create(document.getElementById('editor'), {
        value: examples.flowchart,
        language: 'text',
        theme: 'mermaidTheme',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on'
    });

    // 监听编辑器内容变化
    editor.onDidChangeModelContent(() => {
        renderDiagram();
    });

    // 初始渲染
    renderDiagram();
}

// 渲染图表
async function renderDiagram() {
    const code = editor.getValue();
    const preview = document.getElementById('preview');
    const status = document.getElementById('status');
    const loading = document.getElementById('loading');
    
    if (!code.trim()) {
        // 避免在AI编辑时清空预览造成闪白
        if (!isAITyping) {
            const placeholderDiv = document.createElement('div');
            placeholderDiv.style.cssText = 'padding: 40px; text-align: center; color: #a0aec0;';
            placeholderDiv.textContent = '请输入 Mermaid 代码';
            
            preview.style.transition = 'opacity 0.2s ease-in-out';
            preview.style.opacity = '0.7';
            setTimeout(() => {
                preview.innerHTML = '';
                preview.appendChild(placeholderDiv);
                preview.style.opacity = '1';
            }, 100);
        }
        return;
    }

    // 检查代码是否看起来完整，避免在AI编写过程中过多错误
    const trimmedCode = code.trim();
    if (trimmedCode.length < 10 || trimmedCode.endsWith('[') || trimmedCode.endsWith('(') || trimmedCode.endsWith('"')) {
        // 代码太短或明显不完整，跳过渲染
        // 如果AI正在编写，保持当前预览内容不变
        if (isAITyping) {
            return;
        }
        // 否则显示等待消息，但避免在AI编辑时闪白
        if (!isAITyping) {
            const placeholderDiv = document.createElement('div');
            placeholderDiv.style.cssText = 'padding: 40px; text-align: center; color: #a0aec0;';
            placeholderDiv.textContent = '请输入 Mermaid 代码';
            
            preview.style.transition = 'opacity 0.2s ease-in-out';
            preview.style.opacity = '0.7';
            setTimeout(() => {
                preview.innerHTML = '';
                preview.appendChild(placeholderDiv);
                preview.style.opacity = '1';
            }, 100);
        }
        return;
    }

    try {
        // 只在非AI编写状态显示加载指示器
        if (!isAITyping) {
            loading.style.display = 'inline-block';
            status.style.display = 'none';
        }
        
        // 创建图表容器
        const diagramId = `diagram-${++currentDiagramId}`;
        const container = document.createElement('div');
        container.id = diagramId;
        container.className = 'diagram-container';
        
        // 渲染图表
        const { svg } = await mermaid.render(diagramId + '-svg', code);
        container.innerHTML = svg;
        
        
        // 只有在渲染成功后才替换预览内容，避免闪白
        // 在AI编辑时使用平滑过渡
        if (isAITyping) {
            // AI编辑时使用透明度过渡
            preview.style.transition = 'opacity 0.2s ease-in-out';
            preview.style.opacity = '0.7';
            setTimeout(() => {
                preview.innerHTML = '';
                preview.appendChild(container);
                preview.style.opacity = '1';
                setupPreviewInteractions(preview);
                // 应用当前缩放
                applyCurrentZoom();
            }, 100);
        } else {
            // 非AI编辑时直接替换
            preview.innerHTML = '';
            preview.appendChild(container);
            setupPreviewInteractions(preview);
            // 应用当前缩放
            applyCurrentZoom();
        }
        
        // 更新状态
        if (!isAITyping) {
            status.textContent = '✅ 渲染成功';
            status.className = 'status status-success';
        }
        
    } catch (error) {
        // 如果AI正在编写，完全禁用错误显示，避免闪白
        if (!isAITyping) {
            // 只在代码看起来完整时才显示错误，减少噪音
            if (trimmedCode.length > 30 && !error.message.includes('Unrecognized text') && !error.message.includes('No diagram type detected')) {
                console.error('渲染错误:', error);
                
                // 创建错误提示元素
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'padding: 40px; text-align: center; color: #e53e3e;';
                errorDiv.innerHTML = `
                    <h3>渲染错误</h3>
                    <p style="margin-top: 10px; font-family: monospace; font-size: 12px;">${error.message}</p>
                `;
                
                // 平滑替换内容
                preview.style.transition = 'opacity 0.2s ease-in-out';
                preview.style.opacity = '0.7';
                setTimeout(() => {
                    preview.innerHTML = '';
                    preview.appendChild(errorDiv);
                    preview.style.opacity = '1';
                }, 100);
                
                status.textContent = '❌ 渲染失败';
                status.className = 'status status-error';
            }
        }
    } finally {
        // 只在非AI编写状态更新状态指示器
        if (!isAITyping) {
            loading.style.display = 'none';
            status.style.display = 'inline-block';
        }
    }
}

// 设置预览区域交互功能
function setupPreviewInteractions(preview) {
    // 双击滚动到顶部
    preview.addEventListener('dblclick', () => {
        preview.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 键盘快捷键支持
    preview.setAttribute('tabindex', '0'); // 使预览区域可以获得焦点
    preview.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'Home':
                event.preventDefault();
                preview.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                break;
            case 'End':
                event.preventDefault();
                preview.scrollTo({
                    top: preview.scrollHeight,
                    behavior: 'smooth'
                });
                break;
            case 'PageUp':
                event.preventDefault();
                preview.scrollBy({
                    top: -preview.clientHeight * 0.8,
                    behavior: 'smooth'
                });
                break;
            case 'PageDown':
                event.preventDefault();
                preview.scrollBy({
                    top: preview.clientHeight * 0.8,
                    behavior: 'smooth'
                });
                break;
            case 'ArrowUp':
                if (event.ctrlKey) {
                    event.preventDefault();
                    preview.scrollBy({
                        top: -50,
                        behavior: 'smooth'
                    });
                }
                break;
            case 'ArrowDown':
                if (event.ctrlKey) {
                    event.preventDefault();
                    preview.scrollBy({
                        top: 50,
                        behavior: 'smooth'
                    });
                }
                break;
        }
    });
    
    // 简化的滚动设置 - 确保基本滚动功能
    preview.style.position = 'relative';
}

// 加载示例
function loadExample(type) {
    if (examples[type]) {
        editor.setValue(examples[type]);
        renderDiagram();
    }
}

// 滚动控制函数
function scrollToTop() {
    const preview = document.getElementById('preview');
    preview.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToBottom() {
    const preview = document.getElementById('preview');
    preview.scrollTo({
        top: preview.scrollHeight,
        behavior: 'smooth'
    });
}

// 清空编辑器
function clearEditor() {
    editor.setValue('');
    document.getElementById('preview').innerHTML = '<div style="padding: 40px; text-align: center; color: #a0aec0;">请输入 Mermaid 代码</div>';
}

// 导出为 PNG
async function exportAsPNG() {
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        alert('请先生成图表');
        return;
    }

    try {
        // 获取当前背景颜色设置
        const currentBg = preview.style.backgroundColor || '#ffffff';
        const backgroundColor = currentBg === 'transparent' ? '#ffffff' : currentBg;
        
        // 创建临时容器来确保捕获完整的SVG
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            background: ${backgroundColor};
            padding: 20px;
            display: inline-block;
        `;
        
        // 克隆SVG并添加到临时容器
        const svgClone = svg.cloneNode(true);
        tempContainer.appendChild(svgClone);
        document.body.appendChild(tempContainer);
        
        const canvas = await html2canvas(tempContainer, {
            backgroundColor: backgroundColor,
            scale: 3,
            useCORS: true,
            allowTaint: false,
            foreignObjectRendering: false,
            logging: false,
            width: tempContainer.scrollWidth,
            height: tempContainer.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });
        
        // 清理临时容器
        document.body.removeChild(tempContainer);
        
        const link = document.createElement('a');
        link.download = 'mermaid-diagram.png';
        link.href = canvas.toDataURL();
        link.click();
    } catch (error) {
        console.error('PNG 导出失败:', error);
        alert('PNG 导出失败');
    }
}

// 导出为 SVG
function exportAsSVG() {
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        alert('请先生成图表');
        return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = 'mermaid-diagram.svg';
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
}

// 导出为 PDF
async function exportAsPDF() {
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        alert('请先生成图表');
        return;
    }

    try {
        // 获取当前背景颜色设置
        const currentBg = preview.style.backgroundColor || '#ffffff';
        const backgroundColor = currentBg === 'transparent' ? '#ffffff' : currentBg;
        
        // 创建临时容器来确保捕获完整的SVG
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            background: ${backgroundColor};
            padding: 20px;
            display: inline-block;
        `;
        
        // 克隆SVG并添加到临时容器
        const svgClone = svg.cloneNode(true);
        tempContainer.appendChild(svgClone);
        document.body.appendChild(tempContainer);
        
        const canvas = await html2canvas(tempContainer, {
            backgroundColor: backgroundColor,
            scale: 3,
            useCORS: true,
            allowTaint: false,
            foreignObjectRendering: false,
            logging: false,
            width: tempContainer.scrollWidth,
            height: tempContainer.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });
        
        // 清理临时容器
        document.body.removeChild(tempContainer);
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        
        const imgWidth = 190; // A4 宽度减去边距
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save('mermaid-diagram.pdf');
    } catch (error) {
        console.error('PDF 导出失败:', error);
        alert('PDF 导出失败');
    }
}

// 导出为 HTML
function exportAsHTML() {
    const code = editor.getValue();
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        alert('请先生成图表');
        return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid 图表</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f7fa;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #4299e1;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 40px;
            text-align: center;
        }
        .code {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧜‍♀️ Mermaid 图表</h1>
            <p>由 Mermaid 工具箱生成</p>
        </div>
        <div class="content">
            <h2>图表预览</h2>
            ${preview.innerHTML}
            
            <h2>源代码</h2>
            <div class="code">${code}</div>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = 'mermaid-diagram.html';
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
}

// AI生成功能相关代码
let aiGeneratedCode = '';

// 显示AI配置对话框
function showAIConfigDialog() {
    const dialog = document.getElementById('aiConfigDialog');
    dialog.style.display = 'flex';
    
    // 加载当前配置
    loadAIConfig();
}

// 关闭AI配置对话框
function closeAIConfigDialog() {
    const dialog = document.getElementById('aiConfigDialog');
    dialog.style.display = 'none';
}

// 保存AI配置并关闭对话框
function saveAIConfigAndClose() {
    saveAIConfig();
    closeAIConfigDialog();
    showToast('AI配置已保存', 'success');
}

// 显示AI对话框
function showAIDialog() {
    const dialog = document.getElementById('aiDialog');
    dialog.style.display = 'flex';
    
    // 重置状态
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('aiResult').style.display = 'none';
    document.getElementById('generateBtn').style.display = 'inline-block';
    document.getElementById('applyBtn').style.display = 'none';
}

// 关闭AI对话框
function closeAIDialog() {
    const dialog = document.getElementById('aiDialog');
    dialog.style.display = 'none';
}

// 设置AI提示词
function setAIPrompt(prompt) {
    document.getElementById('aiPrompt').value = prompt;
}


// 保存AI配置到localStorage
function saveAIConfig() {
    const config = {
        provider: document.getElementById('toolbarAiProvider').value,
        apiKey: document.getElementById('toolbarApiKey').value,
        modelId: document.getElementById('toolbarModelId').value,
        customEndpoint: document.getElementById('toolbarCustomEndpoint').value
    };
    
    localStorage.setItem('mermaid-ai-config', JSON.stringify(config));
}

// 从localStorage加载AI配置
function loadAIConfig() {
    try {
        const saved = localStorage.getItem('mermaid-ai-config');
        if (saved) {
            const config = JSON.parse(saved);
            document.getElementById('toolbarAiProvider').value = config.provider || 'openai';
            document.getElementById('toolbarApiKey').value = config.apiKey || '';
            document.getElementById('toolbarModelId').value = config.modelId || '';
            document.getElementById('toolbarCustomEndpoint').value = config.customEndpoint || '';
            updateToolbarAPIKeyPlaceholder();
        }
    } catch (error) {
        console.warn('加载AI配置失败:', error);
    }
}

// 更新工具栏API密钥占位符
function updateToolbarAPIKeyPlaceholder() {
    const provider = document.getElementById('toolbarAiProvider').value;
    const apiKeyInput = document.getElementById('toolbarApiKey');
    const customEndpoint = document.getElementById('toolbarCustomEndpoint');
    const modelInput = document.getElementById('toolbarModelId');
    
    const apiKeyPlaceholders = {
        'openai': '请输入OpenAI API Key (sk-...)',
        'claude': '请输入Anthropic API Key',
        'gemini': '请输入Google Gemini API Key',
        'qwen': '请输入阿里云API Key',
        'doubao': '请输入豆包API Key',
        'openrouter': '请输入OpenRouter API Key (sk-or-...)',
        'custom': '请输入自定义API Key'
    };
    
    const modelPlaceholders = {
        'openai': '请输入模型ID (如: gpt-4, gpt-3.5-turbo)',
        'claude': '请输入模型ID (如: claude-3-opus-20240229, claude-3-sonnet-20240229)',
        'gemini': '请输入模型ID (如: gemini-pro, gemini-pro-vision)',
        'qwen': '请输入模型ID (如: qwen-turbo, qwen-plus, qwen-max)',
        'doubao': '请输入模型ID (如: doubao-lite-4k, doubao-pro-4k)',
        'openrouter': '请输入模型ID (如: openai/gpt-4, anthropic/claude-3-opus)',
        'custom': '请输入模型ID (如: gpt-4, claude-3-sonnet)'
    };
    
    apiKeyInput.placeholder = apiKeyPlaceholders[provider] || '请输入API Key';
    modelInput.placeholder = modelPlaceholders[provider] || '请输入模型ID';
    
    // 显示/隐藏自定义端点输入
    const customEndpointGroup = document.getElementById('customEndpointGroup');
    if (provider === 'custom') {
        customEndpoint.style.display = 'block';
        if (customEndpointGroup) customEndpointGroup.style.display = 'block';
    } else {
        customEndpoint.style.display = 'none';
        if (customEndpointGroup) customEndpointGroup.style.display = 'none';
    }
    
    // 保存配置
    saveAIConfig();
}

// 使用AI生成图表
async function generateWithAI() {
    const prompt = document.getElementById('aiPrompt').value.trim();
    
    // 从工具栏配置获取AI设置
    const provider = document.getElementById('toolbarAiProvider').value;
    const apiKey = document.getElementById('toolbarApiKey').value.trim();
    const modelId = document.getElementById('toolbarModelId').value.trim();
    
    if (!prompt) {
        showToast('请输入图表描述', 'warning');
        return;
    }
    
    if (!apiKey) {
        showToast('请输入API密钥', 'warning');
        return;
    }
    
    if (!modelId) {
        showToast('请输入模型ID', 'warning');
        return;
    }
    
    // 保存配置
    saveAIConfig();
    
    // 显示加载状态
    document.getElementById('aiLoading').style.display = 'block';
    document.getElementById('aiResult').style.display = 'none';
    document.getElementById('generateBtn').disabled = true;
    
    try {
        const mermaidCode = await callAIAPI(provider, apiKey, prompt, modelId);
        
        if (mermaidCode) {
            aiGeneratedCode = mermaidCode;
            
            // 显示结果
            document.getElementById('aiResultCode').textContent = mermaidCode;
            document.getElementById('aiResult').style.display = 'block';
            document.getElementById('applyBtn').style.display = 'inline-block';
            
            showToast('AI生成成功！', 'success');
        } else {
            throw new Error('AI返回的代码为空');
        }
        
    } catch (error) {
        console.error('AI生成失败:', error);
        showToast('AI生成失败: ' + error.message, 'error');
    } finally {
        document.getElementById('aiLoading').style.display = 'none';
        document.getElementById('generateBtn').disabled = false;
    }
}

// 调用AI API
async function callAIAPI(provider, apiKey, prompt, modelId) {
    const mermaidPrompt = `请根据以下描述生成一个Mermaid图表代码，只返回纯净的Mermaid代码，不要包含任何解释文字或markdown格式：

用户描述: ${prompt}

请注意：
1. 返回的代码必须是有效的Mermaid语法
2. 不要包含\`\`\`mermaid或\`\`\`等markdown标记
3. 确保语法正确，可以直接在Mermaid中渲染
4. 使用中文标签和描述
5. 根据描述选择最合适的mermaid图表类型

Mermaid代码:`;    const endpoints = {
        'openai': 'https://api.openai.com/v1/chat/completions',
        'claude': 'https://api.anthropic.com/v1/messages',
        'gemini': 'https://generativelanguage.googleapis.com/v1beta/models',
        'qwen': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        'doubao': 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        'openrouter': 'https://openrouter.ai/api/v1/chat/completions'
    };
    
    const customEndpoint = document.getElementById('toolbarCustomEndpoint').value.trim();
    let endpoint = provider === 'custom' ? customEndpoint : endpoints[provider];
    
    // For Gemini, append the model ID to the endpoint
    if (provider === 'gemini') {
        endpoint = `${endpoint}/${modelId}:generateContent`;
    }
    
    if (!endpoint) {
        throw new Error('未配置API端点');
    }
    
    let requestOptions;
    
    switch (provider) {        case 'openai':
            requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        {
                            role: 'user',
                            content: mermaidPrompt
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            };
            break;
              case 'openrouter':
            requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Mermaid Toolbox'
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        {
                            role: 'user',
                            content: mermaidPrompt
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            };
            break;
              case 'custom':
            requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        {
                            role: 'user',
                            content: mermaidPrompt
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            };
            break;
              case 'claude':
            requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: modelId,
                    max_tokens: 2000,
                    messages: [
                        {
                            role: 'user',
                            content: mermaidPrompt
                        }
                    ]
                })
            };
            break;
            
        case 'gemini':
            requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: mermaidPrompt
                                }
                            ]
                        }
                    ]
                })
            };
            // Gemini API key通过URL参数传递
            const geminiUrl = `${endpoint}?key=${apiKey}`;
            break;
              case 'qwen':
            requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    input: {
                        messages: [
                            {
                                role: 'user',
                                content: mermaidPrompt
                            }
                        ]
                    },
                    parameters: {
                        max_tokens: 2000,
                        temperature: 0.7
                    }
                })
            };
            break;
            
        case 'doubao':
            requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        {
                            role: 'user',
                            content: mermaidPrompt
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            };
            break;
    }
    
    const finalEndpoint = provider === 'gemini' ? `${endpoint}?key=${apiKey}` : endpoint;
    
    console.log('Making API request to:', finalEndpoint);
    console.log('Request options:', { ...requestOptions, body: 'REDACTED' });
    
    let response;
    try {
        response = await fetch(finalEndpoint, requestOptions);
    } catch (fetchError) {
        console.error('Network Error:', fetchError);
        if (fetchError.message.includes('ERR_NAME_NOT_RESOLVED')) {
            throw new Error(`无法连接到 AI 服务：域名解析失败。请检查网络连接或更换 API 端点。`);
        } else if (fetchError.message.includes('Failed to fetch')) {
            throw new Error(`网络连接失败，请检查网络连接或 API 端点配置。`);
        }
        throw new Error(`网络请求失败: ${fetchError.message}`);
    }
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API请求失败 (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('AI API Response:', data); // Debug log
    let generatedText = '';
    
    // 根据不同的AI服务解析响应
    switch (provider) {
        case 'openai':
        case 'openrouter':
        case 'doubao':
        case 'custom':
            generatedText = data.choices?.[0]?.message?.content || '';
            if (!generatedText && data.error) {
                throw new Error(`API错误: ${data.error.message || JSON.stringify(data.error)}`);
            }
            break;
            
        case 'claude':
            generatedText = data.content?.[0]?.text || '';
            if (!generatedText && data.error) {
                throw new Error(`API错误: ${data.error.message || JSON.stringify(data.error)}`);
            }
            break;
            
        case 'gemini':
            generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!generatedText && data.error) {
                throw new Error(`API错误: ${data.error.message || JSON.stringify(data.error)}`);
            }
            break;
            
        case 'qwen':
            generatedText = data.output?.text || '';
            if (!generatedText && data.error) {
                throw new Error(`API错误: ${data.error || JSON.stringify(data)}`);
            }
            break;
    }
    
    if (!generatedText) {
        console.error('Empty response from AI API:', data);
        throw new Error(`AI返回了空响应，这可能是由于：
1. API配额已用完
2. 模型无法理解您的请求
3. 网络连接问题
请尝试：
- 检查API密钥是否有效
- 重新表述您的请求
- 稍后再试`);
    }
    
    // 清理生成的代码，移除markdown标记等
    let cleanCode = generatedText.trim();
    
    // 移除markdown代码块标记
    cleanCode = cleanCode.replace(/```mermaid\n?/g, '');
    cleanCode = cleanCode.replace(/```\n?/g, '');
    cleanCode = cleanCode.replace(/^```/g, '');
    cleanCode = cleanCode.replace(/```$/g, '');
    
    // 移除多余的空白行
    cleanCode = cleanCode.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleanCode = cleanCode.trim();
    
    return cleanCode;
}

// 应用AI生成的结果到编辑器
function applyAIResult() {
    if (aiGeneratedCode) {
        editor.setValue(aiGeneratedCode);
        saveToHistory(aiGeneratedCode);
        autoSave(aiGeneratedCode);
        renderDiagram();
        closeAIDialog();
        showToast('已应用AI生成的图表到编辑器', 'success');
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // 添加样式
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        fontSize: '14px',
        zIndex: '1000000',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });

    // 根据类型设置背景色
    const colors = {
        success: '#48bb78',
        error: '#e53e3e',
        warning: '#ed8936',
        info: '#4299e1'
    };
    toast.style.background = colors[type] || colors.info;

    document.body.appendChild(toast);
    
    // 动画显示
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    // 3秒后自动消失
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 保存到历史记录
function saveToHistory(code) {
    try {
        let history = JSON.parse(localStorage.getItem('mermaid-history') || '[]');
        
        // 避免重复保存相同的代码
        if (history.length > 0 && history[0].code === code) {
            return;
        }
        
        history.unshift({
            code: code,
            timestamp: Date.now(),
            id: Date.now()
        });
        
        // 只保留最近50条历史记录
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem('mermaid-history', JSON.stringify(history));
    } catch (error) {
        console.warn('保存历史记录失败:', error);
    }
}

// 自动保存
function autoSave(code) {
    try {
        localStorage.setItem('mermaid-autosave', code);
        localStorage.setItem('mermaid-autosave-time', Date.now().toString());
    } catch (error) {
        console.warn('自动保存失败:', error);
    }
}

// 复制SVG到剪贴板
async function copyAsSVG() {
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        showToast('请先生成图表', 'warning');
        return;
    }

    try {
        const svgData = new XMLSerializer().serializeToString(svg);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(svgData);
            showToast('SVG代码已复制到剪贴板', 'success');
        } else {
            // 回退方案
            const textArea = document.createElement('textarea');
            textArea.value = svgData;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('SVG代码已复制到剪贴板', 'success');
        }
    } catch (error) {
        console.error('复制SVG失败:', error);
        showToast('复制失败', 'error');
    }
}

// 复制图片到剪贴板
async function copyAsImage() {
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        showToast('请先生成图表', 'warning');
        return;
    }

    try {
        // 获取当前背景颜色设置
        const currentBg = preview.style.backgroundColor || '#ffffff';
        const backgroundColor = currentBg === 'transparent' ? '#ffffff' : currentBg;
        
        // 创建临时容器来确保捕获完整的SVG
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            background: ${backgroundColor};
            padding: 20px;
            display: inline-block;
        `;
        
        // 克隆SVG并添加到临时容器
        const svgClone = svg.cloneNode(true);
        tempContainer.appendChild(svgClone);
        document.body.appendChild(tempContainer);
        
        const canvas = await html2canvas(tempContainer, {
            backgroundColor: backgroundColor,
            scale: 3,
            useCORS: true,
            allowTaint: false,
            foreignObjectRendering: false,
            logging: false,
            width: tempContainer.scrollWidth,
            height: tempContainer.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });
        
        // 清理临时容器
        document.body.removeChild(tempContainer);
        
        canvas.toBlob(async (blob) => {
            try {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                showToast('图片已复制到剪贴板', 'success');
            } catch (error) {
                console.error('复制图片失败:', error);
                showToast('复制失败，您的浏览器可能不支持图片复制', 'error');
            }
        });
    } catch (error) {
        console.error('生成图片失败:', error);
        showToast('生成图片失败', 'error');
    }
}

// 复制为Office可编辑图形
async function copyForOffice() {
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        showToast('请先生成图表', 'warning');
        return;
    }

    try {
        // 获取SVG数据
        const svgData = new XMLSerializer().serializeToString(svg);
        
        // 创建增强的Office兼容格式
        const officeData = createOfficeCompatibleData(svgData);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(officeData);
            showToast('Office可编辑图形已复制，可直接粘贴到Word/PowerPoint', 'success');
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = officeData;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Office可编辑图形已复制', 'success');
        }
    } catch (error) {
        console.error('复制Office格式失败:', error);
        showToast('复制失败', 'error');
    }
}

// 创建Office兼容数据
function createOfficeCompatibleData(svgData) {
    // 创建一个包含SVG和VML的混合格式，提高Office兼容性
    const timestamp = Date.now();
    
    return `<html>
<head>
<meta charset="utf-8">
<!--[if gte mso 9]><xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
</o:OfficeDocumentSettings>
</xml><![endif]-->
</head>
<body>
<!--StartFragment-->
<div style="width:100%;height:auto;">
${svgData}
</div>
<!--EndFragment-->
</body>
</html>`;
}

// 复制Mermaid代码
async function copyMermaidCode() {
    const code = editor.getValue();
    
    if (!code.trim()) {
        showToast('没有可复制的代码', 'warning');
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(code);
            showToast('Mermaid代码已复制到剪贴板', 'success');
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Mermaid代码已复制到剪贴板', 'success');
        }
    } catch (error) {
        console.error('复制代码失败:', error);
        showToast('复制失败', 'error');
    }
}

// 加载自动保存的内容
function loadAutoSave() {
    try {
        const savedCode = localStorage.getItem('mermaid-autosave');
        const savedTime = localStorage.getItem('mermaid-autosave-time');
        
        if (savedCode && savedTime) {
            const timeAgo = Date.now() - parseInt(savedTime);
            // 如果保存时间在24小时内，提示用户是否恢复
            if (timeAgo < 24 * 60 * 60 * 1000) {
                const shouldRestore = confirm('检测到有未保存的内容，是否恢复？');
                if (shouldRestore) {
                    editor.setValue(savedCode);
                    renderDiagram();
                    showToast('已恢复上次编辑的内容', 'success');
                }
            }
        }
    } catch (error) {
        console.warn('加载自动保存内容失败:', error);
    }
}

// GitHub Copilot 风格的聊天功能
let chatHistory = [];
let isConfigCollapsed = false;

// 切换侧边栏标签
function switchSidebarTab(tabName) {
    // 移除所有active类
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 激活选中的标签和内容
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// 切换配置折叠状态
function toggleConfig() {
    const configContent = document.getElementById('configContent');
    const configToggle = document.getElementById('configToggle');
    
    isConfigCollapsed = !isConfigCollapsed;
    
    if (isConfigCollapsed) {
        configContent.classList.add('collapsed');
        configToggle.classList.add('collapsed');
    } else {
        configContent.classList.remove('collapsed');
        configToggle.classList.remove('collapsed');
    }
}


// 发送快速消息
function sendQuickMessage(message) {
    document.getElementById('chatInput').value = message;
    sendChatMessage();
}

// 处理聊天输入键盘事件
function handleChatKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

// 发送聊天消息
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // 检查配置 - 使用工具栏配置
    const provider = document.getElementById('toolbarAiProvider').value;
    const apiKey = document.getElementById('toolbarApiKey').value.trim();
    const modelId = document.getElementById('toolbarModelId').value.trim();
    
    if (!apiKey || !modelId) {
        showToast('请先配置 API 密钥和模型ID', 'warning');
        return;
    }
    
    // 清空输入框
    chatInput.value = '';
    
    // 保存配置
    saveAIConfig();
    
    // 添加用户消息到聊天历史
    addChatMessage('user', message);
    
    // 显示加载状态
    addChatLoading();
    
    try {
        // 构建聊天提示词
        const chatPrompt = buildChatPrompt(message);
        
        // 调用AI API
        const response = await callAIAPI(provider, apiKey, chatPrompt, modelId);
        console.log('AI响应:', response);
        
        // 移除加载状态
        removeChatLoading();
        
        // 检查是否包含Mermaid代码
        const mermaidCode = extractMermaidCode(response);
        console.log('提取到的代码:', mermaidCode);
        
        if (mermaidCode) {
            // 直接在编辑器中编写代码，模拟AI编写过程
            await typeCodeInEditor(mermaidCode);
            
            // 添加简化的AI回复消息
            addChatMessage('assistant', '✅ 我已经在编辑器中为您生成了Mermaid代码');
        } else {
            // 如果没有代码，正常显示回复
            addChatMessage('assistant', response);
        }
        
    } catch (error) {
        console.error('聊天请求失败:', error);
        removeChatLoading();
        
        // 为空响应提供特殊处理
        if (error.message.includes('AI返回了空响应')) {
            addChatMessage('assistant', `🤖 抱歉，我没能理解您的请求或遇到了技术问题。

可能的原因：
• API配额不足或网络问题
• 请求太复杂或不明确
• 服务暂时不可用

💡 建议：
• 请重新表述您的需求
• 检查AI配置是否正确
• 稍后重试

例如："创建一个简单的流程图"`);
        } else {
            addChatMessage('assistant', `抱歉，我遇到了一个错误：${error.message}`);
        }
    }
}

// 构建聊天提示词
function buildChatPrompt(userMessage) {
    const currentCode = editor.getValue();
    
    let systemPrompt = `你是一个专业的 Mermaid 图表助手。你的任务是帮助用户创建、修改和优化 Mermaid 图表。

重要：当用户请求创建或修改图表时，你必须生成 Mermaid 代码块。请严格按照以下格式回复：

\`\`\`mermaid
[这里是完整的Mermaid代码]
\`\`\`

你可以：
1. 根据用户描述生成 Mermaid 代码
2. 修改现有的 Mermaid 代码
3. 解释 Mermaid 语法和最佳实践
4. 提供图表设计建议

除了回答纯理论问题外，对于任何图表创建请求，都必须包含 Mermaid 代码块。请用中文回复，保持专业且友好的语调。`;

    if (currentCode.trim()) {
        systemPrompt += `\n\n当前编辑器中的代码：\n\`\`\`mermaid\n${currentCode}\n\`\`\``;
    }

    return `${systemPrompt}\n\n用户请求：${userMessage}`;
}

// 添加聊天消息
function addChatMessage(role, content, codeSnapshot = null) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    messageDiv.id = messageId;
    messageDiv.className = `chat-message ${role}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = role === 'user' ? 'user-avatar' : 'bot-avatar';
    avatar.textContent = role === 'user' ? 'U' : '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    // 处理代码块
    const formattedContent = formatChatMessage(content);
    messageText.innerHTML = formattedContent;
    
    messageContent.appendChild(messageText);
    
    // 如果是AI消息且包含代码快照，添加checkpoint功能
    if (role === 'assistant' && codeSnapshot && codeSnapshot.trim()) {
        const checkpointDiv = document.createElement('div');
        checkpointDiv.className = 'code-checkpoint';
        checkpointDiv.innerHTML = `
            <div class="checkpoint-info">
                <span class="checkpoint-icon">💾</span>
                <span class="checkpoint-text">代码快照 (${new Date().toLocaleTimeString()})</span>
                <button class="checkpoint-btn" onclick="restoreCodeFromCheckpoint('${messageId}')">
                    🔄 恢复此版本
                </button>
            </div>
        `;
        messageContent.appendChild(checkpointDiv);
        
        // 将代码快照存储在消息元素的数据属性中
        messageDiv.setAttribute('data-code-snapshot', codeSnapshot);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatHistory.appendChild(messageDiv);
    
    // 滚动到底部
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageId;
}

// 格式化聊天消息
function formatChatMessage(content) {
    // 处理代码块
    content = content.replace(/```mermaid\n([\s\S]*?)\n```/g, (match, code) => {
        return `<div class="code-block">${code.trim()}</div>`;
    });
    
    // 处理普通代码块
    content = content.replace(/```\n([\s\S]*?)\n```/g, (match, code) => {
        return `<div class="code-block">${code.trim()}</div>`;
    });
    
    // 处理行内代码
    content = content.replace(/`([^`]+)`/g, '<code style="background: #404040; padding: 2px 4px; border-radius: 2px;">$1</code>');
    
    // 处理换行
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

// 提取Mermaid代码
function extractMermaidCode(content) {
    // 首先尝试匹配代码块格式
    const codeBlockPatterns = [
        /```mermaid\n([\s\S]*?)\n```/g,
        /```mermaid\n([\s\S]*?)```/g,
        /```mermaid([\s\S]*?)```/g
    ];
    
    for (const pattern of codeBlockPatterns) {
        const match = content.match(pattern);
        if (match) {
            const code = match[1].trim();
            console.log('从代码块提取到的Mermaid代码:', code);
            return code;
        }
    }
    
    // 如果没有找到代码块，检查是否是纯Mermaid代码
    // 检查是否以Mermaid关键词开头
    const mermaidKeywords = ['flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'erDiagram', 'journey', 'pie', 'gantt', 'gitgraph', 'mindmap', 'timeline', 'quadrantChart', 'xychart-beta'];
    const trimmedContent = content.trim();
    
    for (const keyword of mermaidKeywords) {
        if (trimmedContent.startsWith(keyword)) {
            console.log('检测到纯Mermaid代码:', trimmedContent);
            return trimmedContent;
        }
    }
    
    console.log('未找到Mermaid代码块，响应内容:', content);
    return null;
}

// 在编辑器中逐字符输入代码，模拟AI编写过程
async function typeCodeInEditor(code) {
    // 设置AI编写状态
    isAITyping = true;
    
    // 显示AI编写指示器
    const aiIndicator = document.getElementById('aiTypingIndicator');
    aiIndicator.style.display = 'block';
    
    // 动态更新指示器文本
    const updateIndicatorText = (progress) => {
        const messages = [
            '🤖 正在分析需求...',
            '⚡ 生成图表结构...',
            '🎨 优化代码格式...',
            '✨ 完善细节...',
            '🚀 即将完成...'
        ];
        const messageIndex = Math.min(Math.floor(progress * messages.length), messages.length - 1);
        aiIndicator.textContent = messages[messageIndex];
    };
    
    // 保存当前预览内容，避免在编写过程中闪烁
    const preview = document.getElementById('preview');
    const currentPreviewContent = preview.innerHTML;
    
    // 清空编辑器
    editor.setValue('');
    
    // 添加聊天消息
    const loadingMessageId = addChatMessage('assistant', '🤖 正在为您编写代码...');
    
    // 智能批量输入动画，模拟真实编程体验
    let currentText = '';
    let i = 0;
    
    while (i < code.length) {
        // 智能分组：单词、符号、换行
        let chunk = '';
        let baseDelay = 0;
        
        if (code[i] === '\n') {
            // 换行单独处理
            chunk = code[i];
            baseDelay = Math.random() * 6 + 3; // 3-9ms，换行停顿
            i++;
        } else if (/[a-zA-Z0-9]/.test(code[i])) {
            // 连续字母数字作为一个块
            while (i < code.length && /[a-zA-Z0-9]/.test(code[i])) {
                chunk += code[i];
                i++;
            }
            baseDelay = Math.random() * 2 + 1; // 1-3ms，单词快速
        } else if (/[\s]/.test(code[i])) {
            // 空格和制表符
            while (i < code.length && /[\s]/.test(code[i]) && code[i] !== '\n') {
                chunk += code[i];
                i++;
            }
            baseDelay = Math.random() * 1 + 0.5; // 0.5-1.5ms，空格瞬间
        } else {
            // 符号和特殊字符，最多3个一组
            let symbolCount = 0;
            while (i < code.length && !/[a-zA-Z0-9\s\n]/.test(code[i]) && symbolCount < 3) {
                chunk += code[i];
                i++;
                symbolCount++;
            }
            baseDelay = Math.random() * 2 + 0.5; // 0.5-2.5ms，符号快速
        }
        
        currentText += chunk;
        editor.setValue(currentText);
        
        // 设置光标位置，创建真实编写感觉
        const model = editor.getModel();
        const lastLine = model.getLineCount();
        const lastColumn = model.getLineContent(lastLine).length + 1;
        editor.setPosition({ lineNumber: lastLine, column: lastColumn });
        
        // 更新进度指示器
        const progress = currentText.length / code.length;
        updateIndicatorText(progress);
        
        // 使用优化的延迟
        await new Promise(resolve => {
            if (baseDelay < 1) {
                requestAnimationFrame(resolve);
            } else {
                setTimeout(resolve, baseDelay);
            }
        });
    }
    
    // 完成动画效果
    aiIndicator.textContent = '✅ 代码编写完成！';
    aiIndicator.style.background = 'linear-gradient(135deg, rgba(72, 187, 120, 0.95), rgba(56, 161, 105, 0.95))';
    
    // 等待一下让用户看到完成消息
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 最终渲染
    renderDiagram();
    
    // 清除AI编写状态
    isAITyping = false;
    
    // 淡出指示器
    aiIndicator.style.transition = 'opacity 0.5s ease-out';
    aiIndicator.style.opacity = '0';
    setTimeout(() => {
        aiIndicator.style.display = 'none';
        aiIndicator.style.opacity = '1';
        aiIndicator.style.transition = '';
        // 重置指示器样式
        aiIndicator.style.background = 'linear-gradient(135deg, rgba(14, 99, 156, 0.95), rgba(66, 153, 225, 0.95))';
    }, 500);
    
    // 保存到历史记录和自动保存
    saveToHistory(code);
    autoSave(code);
    
    // 最终渲染
    renderDiagram();
    
    // 移除"正在编写"消息
    removeChatMessage(loadingMessageId);
    
    // 为刚完成的AI编辑静默添加代码快照到最后一个AI消息
    if (code && code.trim()) {
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            // 查找最后一个AI消息
            const aiMessages = chatHistory.querySelectorAll('.assistant-message');
            if (aiMessages.length > 0) {
                const lastAiMessage = aiMessages[aiMessages.length - 1];
                const messageContent = lastAiMessage.querySelector('.message-content');
                
                // 检查是否已经有checkpoint，避免重复添加
                if (messageContent && !lastAiMessage.querySelector('.code-checkpoint')) {
                    const checkpointDiv = document.createElement('div');
                    checkpointDiv.className = 'code-checkpoint';
                    checkpointDiv.innerHTML = `
                        <div class="checkpoint-info">
                            <span class="checkpoint-icon">💾</span>
                            <span class="checkpoint-text">代码快照 (${new Date().toLocaleTimeString()})</span>
                            <button class="checkpoint-btn" onclick="restoreCodeFromCheckpoint('${lastAiMessage.id}')">
                                🔄 恢复此版本
                            </button>
                        </div>
                    `;
                    messageContent.appendChild(checkpointDiv);
                    
                    // 保存代码快照
                    lastAiMessage.setAttribute('data-code-snapshot', code);
                    
                    // 滚动到最新消息
                    chatHistory.scrollTop = chatHistory.scrollHeight;
                }
            }
        }
    }
}

// 移除特定的聊天消息
function removeChatMessage(messageId) {
    if (messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove();
        }
    }
}


// 添加加载状态
function addChatLoading() {
    const chatHistory = document.getElementById('chatHistory');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message assistant-message';
    loadingDiv.id = 'chatLoading';
    
    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.textContent = '🤖';
    
    // 完成函数实现...
    loadingDiv.appendChild(avatar);
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 预览控制功能
let currentZoom = 1;
let isFullscreen = false;

// 放大功能
function zoomIn() {
    currentZoom += 0.3;
    if (currentZoom > 3) currentZoom = 3; // 最大放大3倍
    applyZoom();
    showToast(`放大到 ${Math.round(currentZoom * 100)}%`, 'info');
}

// 缩小功能
function zoomOut() {
    currentZoom -= 0.3;
    if (currentZoom < 0.5) currentZoom = 0.5; // 最小缩小到50%
    applyZoom();
    showToast(`缩小到 ${Math.round(currentZoom * 100)}%`, 'info');
}

// 应用缩放
function applyZoom() {
    const preview = document.getElementById('preview');
    if (preview) {
        const diagramContainer = preview.querySelector('.diagram-container');
        if (diagramContainer) {
            diagramContainer.style.transform = `scale(${currentZoom})`;
            diagramContainer.style.transformOrigin = 'top left';
            diagramContainer.style.transition = 'transform 0.3s ease';
        }
    }
}

// 全屏切换
async function toggleFullscreen() {
    const previewPanel = document.querySelector('.preview-panel');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (!isFullscreen) {
        try {
            // 进入真正的全屏模式（隐藏任务栏）
            if (previewPanel.requestFullscreen) {
                await previewPanel.requestFullscreen();
            } else if (previewPanel.webkitRequestFullscreen) {
                await previewPanel.webkitRequestFullscreen();
            } else if (previewPanel.msRequestFullscreen) {
                await previewPanel.msRequestFullscreen();
            } else if (previewPanel.mozRequestFullScreen) {
                await previewPanel.mozRequestFullScreen();
            }
            
            // 添加全屏样式
            previewPanel.classList.add('preview-fullscreen');
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = '退出全屏';
            isFullscreen = true;
            showToast('已进入全屏模式，按ESC或点击按钮退出', 'info');
            
            // 监听全屏状态变化
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.addEventListener('msfullscreenchange', handleFullscreenChange);
            document.addEventListener('mozfullscreenchange', handleFullscreenChange);
            
            // 监听ESC键退出全屏，确保不重复添加
            document.removeEventListener('keydown', handleEscapeKey);
            document.addEventListener('keydown', handleEscapeKey);
        } catch (error) {
            console.warn('无法进入真正的全屏模式，使用CSS全屏:', error);
            // 如果无法进入真正的全屏，则使用CSS全屏
            previewPanel.classList.add('preview-fullscreen');
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = '退出全屏';
            isFullscreen = true;
            showToast('已进入全屏模式，按ESC或点击按钮退出', 'info');
            
            document.removeEventListener('keydown', handleEscapeKey);
            document.addEventListener('keydown', handleEscapeKey);
        }
    } else {
        // 退出全屏
        exitFullscreen();
    }
}

// 退出全屏
async function exitFullscreen() {
    const previewPanel = document.querySelector('.preview-panel');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    try {
        // 退出真正的全屏模式
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
        }
    } catch (error) {
        console.warn('退出全屏时出错:', error);
    }
    
    // 移除全屏样式和状态
    previewPanel.classList.remove('preview-fullscreen');
    fullscreenBtn.textContent = '⛶';
    fullscreenBtn.title = '全屏';
    isFullscreen = false;
    showToast('已退出全屏模式', 'info');
    
    // 移除事件监听器
    document.removeEventListener('keydown', handleEscapeKey);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
}

// 处理全屏状态变化
function handleFullscreenChange() {
    const isCurrentlyFullscreen = document.fullscreenElement ||
                                 document.webkitFullscreenElement ||
                                 document.msFullscreenElement ||
                                 document.mozFullScreenElement;
    
    if (!isCurrentlyFullscreen && isFullscreen) {
        // 用户通过ESC键或其他方式退出了全屏，更新状态
        const previewPanel = document.querySelector('.preview-panel');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        
        previewPanel.classList.remove('preview-fullscreen');
        fullscreenBtn.textContent = '⛶';
        fullscreenBtn.title = '全屏';
        isFullscreen = false;
        showToast('已退出全屏模式', 'info');
        
        // 移除事件监听器
        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    }
}

// 处理ESC键
function handleEscapeKey(event) {
    if (event && event.key === 'Escape' && isFullscreen) {
        event.preventDefault();
        event.stopPropagation();
        exitFullscreen();
    }
}

// 重置缩放
function resetZoom() {
    currentZoom = 1;
    applyZoom();
}

// 在渲染图表后应用当前缩放
function applyCurrentZoom() {
    if (currentZoom !== 1) {
        setTimeout(() => {
            applyZoom();
        }, 100);
    }
}

// 移除加载状态
function removeChatLoading() {
    const loadingDiv = document.getElementById('chatLoading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}


// 导出为 Markdown
function exportAsMarkdown() {
    const code = editor.getValue();
    
    if (!code.trim()) {
        alert('请先生成图表');
        return;
    }

    try {
        // 创建Markdown内容
        const timestamp = new Date().toLocaleString();
        const markdownContent = `# Mermaid图表

> 生成时间: ${timestamp}

\`\`\`mermaid
${code}
\`\`\`

## 说明

这是一个使用Mermaid语法创建的图表。您可以：

1. 将此Markdown文件导入支持Mermaid的编辑器（如Typora、Obsidian、GitHub等）
2. 在支持Mermaid的平台上直接渲染此图表
3. 复制代码块内容到其他Mermaid编辑器中使用

### Mermaid官方文档
- [Mermaid官网](https://mermaid.js.org/)
- [语法文档](https://mermaid.js.org/intro/)
`;

        // 创建Blob并下载
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = 'mermaid-diagram.md';
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        
        showToast('Markdown文件导出成功', 'success');
    } catch (error) {
        console.error('Markdown 导出失败:', error);
        alert('Markdown 导出失败');
    }
}

// 从checkpoint恢复代码
function restoreCodeFromCheckpoint(messageId) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) {
        showToast('无法找到代码快照', 'error');
        return;
    }
    
    const codeSnapshot = messageElement.getAttribute('data-code-snapshot');
    if (!codeSnapshot) {
        showToast('代码快照为空', 'error');
        return;
    }
    
    // 确认恢复操作
    if (confirm('确定要恢复到此版本的代码吗？当前编辑器内容将被替换。')) {
        // 停止AI编写状态
        isAITyping = false;
        
        // 设置编辑器内容
        editor.setValue(codeSnapshot);
        
        // 重新渲染图表
        renderDiagram();
        
        // 显示成功提示
        showToast('代码已恢复到选定版本', 'success');
        
        // 保存到历史记录
        saveToHistory(codeSnapshot);
        autoSave(codeSnapshot);
    }
}

// 将函数绑定到全局作用域以供 HTML 调用
window.renderDiagram = renderDiagram;
window.loadExample = loadExample;
window.clearEditor = clearEditor;
window.exportAsPNG = exportAsPNG;
window.exportAsSVG = exportAsSVG;
window.exportAsPDF = exportAsPDF;
window.exportAsHTML = exportAsHTML;
window.exportAsXML = exportAsXML;
window.exportAsMarkdown = exportAsMarkdown;
window.changeTheme = changeTheme;
window.changeBackground = changeBackground;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.toggleFullscreen = toggleFullscreen;
window.restoreCodeFromCheckpoint = restoreCodeFromCheckpoint;

// 初始化聊天界面
function initChatInterface() {
    // 自动调整输入框高度
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initEditor();
    
    // 初始化主题
    initTheme();
    
    // 初始化背景
    initBackground();
    
    // 初始化工具栏AI配置
    loadAIConfig();
    updateToolbarAPIKeyPlaceholder();
    
    // 初始化聊天界面
    initChatInterface();
    
    // 延迟加载自动保存内容，避免与初始示例冲突
    setTimeout(() => {
        loadAutoSave();
    }, 1000);
    
    // 监听编辑器内容变化，自动保存
    setTimeout(() => {
        if (editor) {
            editor.onDidChangeModelContent(() => {
                const code = editor.getValue();
                if (code.trim()) {
                    autoSave(code);
                }
            });
        }
    }, 2000);
// 修复下拉菜单定位 - 确保在可视区域内
function positionDropdown() {
    const dropdowns = document.querySelectorAll('.export-dropdown');
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('button');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (button && content) {
            dropdown.addEventListener('mouseenter', () => {
                const rect = button.getBoundingClientRect();
                const contentRect = content.getBoundingClientRect();
                
                // 计算基础位置
                let top = rect.bottom + 8;
                let left = rect.right - 180; // 下拉菜单宽度为180px
                
                // 确保不超出窗口右边界
                if (left < 0) {
                    left = rect.left;
                }
                
                // 确保不超出窗口右边界
                if (left + 180 > window.innerWidth) {
                    left = window.innerWidth - 180 - 10;
                }
                
                // 确保不超出窗口底部
                if (top + 200 > window.innerHeight) { // 假设菜单高度约200px
                    top = rect.top - 200 - 8; // 显示在按钮上方
                }
                
                // 确保不超出窗口顶部
                if (top < 0) {
                    top = 10;
                }
                
                content.style.top = top + 'px';
                content.style.left = left + 'px';
                content.style.right = 'auto'; // 清除right定位
            });
        }
    });
}

// 页面加载后初始化下拉菜单定位
document.addEventListener('DOMContentLoaded', positionDropdown);
});

// 分隔器拖拽功能
function initResizer() {
    const resizer = document.getElementById('resizer');
    const editorPanel = document.querySelector('.editor-panel');
    const previewPanel = document.querySelector('.preview-panel');
    const container = document.querySelector('.editor-container');
    
    let isResizing = false;
    
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        const startX = e.clientX;
        const containerRect = container.getBoundingClientRect();
        const startEditorWidth = editorPanel.getBoundingClientRect().width;
        
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const containerWidth = containerRect.width;
            const resizerWidth = 6; // 分隔器宽度
            
            let newEditorWidth = startEditorWidth + deltaX;
            const minWidth = 200; // 最小宽度
            const maxEditorWidth = containerWidth - minWidth - resizerWidth;
            
            // 限制宽度范围
            newEditorWidth = Math.max(minWidth, Math.min(newEditorWidth, maxEditorWidth));
            
            const editorFlex = newEditorWidth / containerWidth;
            const previewFlex = (containerWidth - newEditorWidth - resizerWidth) / containerWidth;
            
            editorPanel.style.flex = `${editorFlex}`;
            previewPanel.style.flex = `${previewFlex}`;
            
            // 触发编辑器重新布局
            if (window.editor) {
                setTimeout(() => editor.layout(), 0);
            }
        };
        
        const handleMouseUp = () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

// 初始化分隔器
document.addEventListener('DOMContentLoaded', () => {
    initResizer();
});

// 全局函数绑定 - 在文件加载时立即执行
window.showAIConfigDialog = showAIConfigDialog;
window.closeAIConfigDialog = closeAIConfigDialog;
window.saveAIConfigAndClose = saveAIConfigAndClose;
window.showAIDialog = showAIDialog;
window.closeAIDialog = closeAIDialog;
window.generateWithAI = generateWithAI;
window.applyAIResult = applyAIResult;
window.setAIPrompt = setAIPrompt;
window.updateToolbarAPIKeyPlaceholder = updateToolbarAPIKeyPlaceholder;
window.showToast = showToast;
window.saveToHistory = saveToHistory;
window.autoSave = autoSave;
window.copyAsSVG = copyAsSVG;
window.copyAsImage = copyAsImage;
window.copyForOffice = copyForOffice;
window.copyMermaidCode = copyMermaidCode;

// 聊天功能全局绑定
window.switchSidebarTab = switchSidebarTab;
window.toggleConfig = toggleConfig;
window.sendQuickMessage = sendQuickMessage;
window.handleChatKeyDown = handleChatKeyDown;
window.sendChatMessage = sendChatMessage;

// 导出为 XML
function exportAsXML() {
    const code = editor.getValue();
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        alert('请先生成图表');
        return;
    }

    try {
        // 创建XML文档结构
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<diagram>
    <metadata>
        <title>Mermaid Diagram</title>
        <created>${new Date().toISOString()}</created>
        <generator>Mermaid工具箱</generator>
    </metadata>
    <source>
        <![CDATA[${code}]]>
    </source>
    <svg>
        <![CDATA[${new XMLSerializer().serializeToString(svg)}]]>
    </svg>
</diagram>`;

        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = 'mermaid-diagram.xml';
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('XML 导出失败:', error);
        alert('XML 导出失败');
    }
}

// 主题切换功能
function changeTheme(theme) {
    // 重新初始化Mermaid with新主题
    mermaid.initialize({
        startOnLoad: true,
        theme: theme,
        securityLevel: 'loose',
        fontFamily: 'monospace',
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true
        },
        sequence: {
            useMaxWidth: true
        },
        gantt: {
            useMaxWidth: true
        },
        journey: {
            useMaxWidth: true
        },
        timeline: {
            useMaxWidth: true
        },
        maxTextSize: 90000,
        maxEdges: 2000
    });
    
    // 更新设计按钮（不显示具体选择，保持简洁）
    updateDesignButton();
    
    // 重新渲染当前图表
    renderDiagram();
    
    // 保存主题设置到localStorage
    localStorage.setItem('mermaidTheme', theme);
    
    // 显示主题切换成功提示
    showToast(`已切换到${getThemeName(theme)}主题`, 'success');
}

// 获取主题中文名称
function getThemeName(theme) {
    const themeNames = {
        'default': '默认',
        'dark': '深色',
        'forest': '森林',
        'neutral': '中性',
        'base': '基础'
    };
    return themeNames[theme] || theme;
}

// 更新设计按钮显示
function updateDesignButton() {
    const designButton = document.getElementById('designButton');
    if (designButton) {
        designButton.textContent = `🎨 设计 ▼`;
    }
}

// 加载保存的主题设置
function loadTheme() {
    const savedTheme = localStorage.getItem('mermaidTheme') || 'default';
    // 应用主题但不重复渲染（避免初始化时的双重渲染）
    mermaid.initialize({
        startOnLoad: true,
        theme: savedTheme,
        securityLevel: 'loose',
        fontFamily: 'monospace',
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true
        },
        sequence: {
            useMaxWidth: true
        },
        gantt: {
            useMaxWidth: true
        },
        journey: {
            useMaxWidth: true
        },
        timeline: {
            useMaxWidth: true
        },
        maxTextSize: 90000,
        maxEdges: 2000
    });
    updateDesignButton();
}

// 初始化主题
function initTheme() {
    // 在页面加载时应用保存的主题
    loadTheme();
}

// 背景颜色切换功能
function changeBackground(background) {
    const preview = document.getElementById('preview');
    if (!preview) return;
    
    let backgroundColor, displayName;
    
    switch (background) {
        case 'white':
            backgroundColor = '#ffffff';
            displayName = '白色';
            break;
        case 'transparent':
            backgroundColor = 'transparent';
            displayName = '透明';
            break;
        case 'black':
            backgroundColor = '#000000';
            displayName = '黑色';
            break;
        case 'gray':
            backgroundColor = '#f5f5f5';
            displayName = '灰色';
            break;
        case 'blue':
            backgroundColor = '#e3f2fd';
            displayName = '蓝色';
            break;
        case 'custom':
            const customColor = prompt('请输入背景颜色 (例如: #ff0000, rgba(255,0,0,0.5), transparent):', '#ffffff');
            if (customColor) {
                backgroundColor = customColor;
                displayName = '自定义';
            } else {
                return; // 用户取消了输入
            }
            break;
        default:
            backgroundColor = '#ffffff';
            displayName = '白色';
    }
    
    // 应用背景颜色
    preview.style.backgroundColor = backgroundColor;
    
    // 更新设计按钮（保持简洁）
    updateDesignButton();
    
    // 保存背景设置
    localStorage.setItem('previewBackground', background);
    localStorage.setItem('previewBackgroundColor', backgroundColor);
    
    // 显示切换成功提示
    showToast(`已切换到${displayName}背景`, 'success');
}

// 加载保存的背景设置
function loadBackground() {
    const savedBackground = localStorage.getItem('previewBackground') || 'white';
    const savedBackgroundColor = localStorage.getItem('previewBackgroundColor') || '#f8f9fa';
    
    const preview = document.getElementById('preview');
    
    if (preview) {
        preview.style.backgroundColor = savedBackgroundColor;
    }
    
    updateDesignButton();
}

// 初始化背景
function initBackground() {
    loadBackground();
}
