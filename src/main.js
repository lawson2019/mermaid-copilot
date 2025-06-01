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
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E
    
    %% 样式定义
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class A,E startEnd
    class C,D process
    class B decision`,

    flowchart_advanced: `flowchart LR
    subgraph 用户层
        A[用户登录] --> B[身份验证]
        B --> C{验证成功?}
    end
    
    subgraph 业务层
        C -->|是| D[加载用户数据]
        C -->|否| E[显示错误信息]
        D --> F[权限检查]
        F --> G{有权限?}
        G -->|是| H[显示主界面]
        G -->|否| I[显示权限不足]
    end
    
    subgraph 数据层
        D -.-> J[(用户数据库)]
        F -.-> K[(权限数据库)]
    end
    
    E --> L[返回登录页]
    I --> L
    H --> M[操作完成]
    
    %% 节点样式
    classDef userLayer fill:#e3f2fd,stroke:#1976d2
    classDef businessLayer fill:#f1f8e9,stroke:#388e3c
    classDef dataLayer fill:#fce4ec,stroke:#c2185b
    
    class A,B,C,E,L userLayer
    class D,F,G,H,I,M businessLayer
    class J,K dataLayer`,

    flowchart_simple: `flowchart TD
    Start([开始]) --> Input[/输入数据/]
    Input --> Process[处理数据]
    Process --> Output[/输出结果/]
    Output --> End([结束])
    
    %% 添加注释和样式
    Process --> Note["注意: 这里进行复杂计算可能需要较长时间"]`,

    // 序列图示例 - 多种场景
    sequence: `sequenceDiagram
    participant U as 👤用户
    participant W as 🌐前端
    participant S as 🔧后端
    participant D as 🗄️数据库
    participant C as 📄缓存
    
    U->>+W: 登录请求
    W->>+S: 验证凭据
    S->>+D: 查询用户信息
    D-->>-S: 返回用户数据
    
    alt 用户存在且密码正确
        S->>+C: 创建会话
        C-->>-S: 会话ID
        S-->>W: 登录成功 + Token
        W-->>-U: 跳转到主页
    else 用户不存在或密码错误
        S-->>W: 登录失败
        W-->>-U: 显示错误信息
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
    
    Client->>+Gateway: POST /api/orders
    Gateway->>+Auth: 验证Token
    Auth-->>-Gateway: Token有效
    
    Gateway->>+Order: 创建订单
    Order->>+DB: 检查库存
    DB-->>-Order: 库存充足
    
    Order->>+Payment: 发起支付
    Payment->>Payment: 处理支付
    
    alt 支付成功
        Payment-->>Order: 支付完成
        Order->>DB: 更新订单状态
        Order-->>Gateway: 订单创建成功
        Gateway-->>-Client: 200 OK
    else 支付失败
        Payment-->>Order: 支付失败
        Order->>DB: 回滚订单
        Order-->>Gateway: 订单创建失败
        Gateway-->>-Client: 400 Error
    end`,

    // 类图示例 - 详细的OOP设计
    class: `classDiagram
    %% 电商系统类图设计
    class User {
        -int userId
        -string username
        -string email
        -string password
        -Date createdAt
        +register()
        +login()
        +updateProfile()
        +getOrders()
    }
    
    class Product {
        -int productId
        -string name
        -string description
        -decimal price
        -int stock
        -string category
        +updatePrice(decimal newPrice)
        +updateStock(int quantity)
        +getDetails()
    }
    
    class Order {
        -int orderId
        -int userId
        -Date orderDate
        -decimal totalAmount
        -OrderStatus status
        +addItem(Product product, int quantity)
        +removeItem(int productId)
        +calculateTotal()
        +updateStatus(OrderStatus status)
    }
    
    class OrderItem {
        -int orderItemId
        -int orderId
        -int productId
        -int quantity
        -decimal unitPrice
        +getSubtotal()
    }
    
    class Payment {
        -int paymentId
        -int orderId
        -decimal amount
        -PaymentMethod method
        -PaymentStatus status
        +processPayment()
        +refund()
    }
    
    class Cart {
        -int cartId
        -int userId
        +addProduct(Product product, int quantity)
        +removeProduct(int productId)
        +clear()
        +checkout()
    }
    
    %% 枚举
    class OrderStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        SHIPPED
        DELIVERED
        CANCELLED
    }
    
    class PaymentStatus {
        <<enumeration>>
        PENDING
        COMPLETED
        FAILED
        REFUNDED
    }
    
    %% 关系定义
    User ||--o{ Order : "下单"
    User ||--|| Cart : "拥有"
    Order ||--o{ OrderItem : "包含"
    Product ||--o{ OrderItem : "关联"
    Order ||--|| Payment : "支付"
    
    %% 继承关系
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
        string username UK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        datetime created_at
        datetime updated_at
        boolean is_active
        enum role "customer, admin, seller"
    }
    
    CATEGORY {
        int category_id PK
        string name UK
        string description
        int parent_id FK
        string image_url
        boolean is_active
        int sort_order
    }
    
    PRODUCT {
        int product_id PK
        string name
        string description
        decimal price
        decimal discount_price
        int stock_quantity
        string sku UK
        int category_id FK
        int seller_id FK
        datetime created_at
        datetime updated_at
        boolean is_active
        float rating
        int review_count
    }
    
    ORDER {
        int order_id PK
        int user_id FK
        decimal total_amount
        decimal discount_amount
        decimal final_amount
        enum status "pending, confirmed, shipped, delivered, cancelled"
        datetime order_date
        datetime shipped_date
        datetime delivered_date
        string shipping_address
        string billing_address
    }
    
    ORDER_ITEM {
        int order_item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal total_price
    }
    
    CART {
        int cart_id PK
        int user_id FK
        int product_id FK
        int quantity
        datetime added_at
        datetime updated_at
    }
    
    REVIEW {
        int review_id PK
        int user_id FK
        int product_id FK
        int rating
        string title
        text comment
        datetime created_at
        boolean is_verified_purchase
    }
    
    PAYMENT {
        int payment_id PK
        int order_id FK
        decimal amount
        enum method "credit_card, paypal, bank_transfer"
        enum status "pending, completed, failed, refunded"
        string transaction_id
        datetime payment_date
    }
    
    SHIPPING {
        int shipping_id PK
        int order_id FK
        string carrier
        string tracking_number
        decimal shipping_cost
        datetime shipped_date
        datetime estimated_delivery
        datetime actual_delivery
        enum status "preparing, shipped, in_transit, delivered"
    }
    
    %% 关系定义
    USER ||--o{ ORDER : "places"
    USER ||--o{ CART : "has"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ PRODUCT : "sells"
    
    CATEGORY ||--o{ PRODUCT : "contains"
    CATEGORY ||--o{ CATEGORY : "has_subcategory"
    
    PRODUCT ||--o{ ORDER_ITEM : "ordered_in"
    PRODUCT ||--o{ CART : "added_to"
    PRODUCT ||--o{ REVIEW : "reviewed_in"
    
    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER ||--|| PAYMENT : "paid_by"
    ORDER ||--|| SHIPPING : "shipped_via"`,

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
    用户注册功能       :s1_task1, s1_start, 3d
    用户登录功能       :s1_task2, after s1_task1, 3d
    密码重置功能       :s1_task3, after s1_task2, 2d
    测试用户认证       :s1_test, after s1_task3, 2d
    Sprint回顾         :milestone, s1_end, after s1_test, 0d
    
    section Sprint 2 - 核心功能
    Sprint规划         :milestone, s2_start, after s1_end, 0d
    商品浏览功能       :s2_task1, s2_start, 4d
    商品搜索功能       :s2_task2, after s2_task1, 3d
    购物车功能         :s2_task3, after s2_task2, 3d
    测试核心功能       :s2_test, after s2_task3, 2d
    Sprint回顾         :milestone, s2_end, after s2_test, 0d
    
    section Sprint 3 - 订单支付
    Sprint规划         :milestone, s3_start, after s2_end, 0d
    订单创建功能       :s3_task1, s3_start, 3d
    支付集成功能       :s3_task2, after s3_task1, 4d
    订单管理功能       :s3_task3, after s3_task2, 3d
    测试订单支付       :s3_test, after s3_task3, 2d
    Sprint回顾         :milestone, s3_end, after s3_test, 0d
    
    section Sprint 4 - 优化发布
    Sprint规划         :milestone, s4_start, after s3_end, 0d
    性能优化          :s4_task1, s4_start, 3d
    UI优化            :s4_task2, s4_start, 4d
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

    // Git图示例 - 复杂分支管理
    git: `gitgraph
    commit id: "初始化项目"
    commit id: "添加基础框架"
    
    branch develop
    checkout develop
    commit id: "添加用户模块"
    commit id: "添加数据库配置"
    
    branch feature/auth
    checkout feature/auth
    commit id: "实现登录功能"
    commit id: "实现注册功能"
    commit id: "添加JWT认证"
    
    checkout develop
    merge feature/auth
    commit id: "集成认证功能"
    
    branch feature/product
    checkout feature/product
    commit id: "商品模型设计"
    commit id: "商品CRUD接口"
    commit id: "商品搜索功能"
    
    checkout develop
    branch feature/order
    checkout feature/order
    commit id: "订单模型设计"
    commit id: "订单创建流程"
    
    checkout develop
    merge feature/product
    commit id: "集成商品功能"
    
    merge feature/order
    commit id: "集成订单功能"
    
    checkout main
    merge develop
    commit id: "v1.0.0 发布"
    
    checkout develop
    branch hotfix/security
    checkout hotfix/security
    commit id: "修复安全漏洞"
    
    checkout main
    merge hotfix/security
    commit id: "v1.0.1 安全修复"
    
    checkout develop
    merge hotfix/security`,

    git_workflow: `gitgraph
    commit id: "项目初始化"
    
    branch develop
    checkout develop
    commit id: "开发环境配置"
    
    %% 功能开发分支
    branch feature/user-management
    checkout feature/user-management
    commit id: "用户注册"
    commit id: "用户登录"
    commit id: "用户权限"
    
    checkout develop
    merge feature/user-management
    commit id: "合并用户管理"
    
    %% 并行开发
    branch feature/api-gateway
    checkout feature/api-gateway
    commit id: "网关配置"
    commit id: "路由规则"
    
    checkout develop
    branch feature/payment
    checkout feature/payment
    commit id: "支付接口"
    commit id: "支付回调"
    
    checkout develop
    merge feature/api-gateway
    merge feature/payment
    commit id: "集成网关和支付"
    
    %% 发布分支
    branch release/v2.0
    checkout release/v2.0
    commit id: "准备发布v2.0"
    commit id: "修复发布问题"
    
    checkout main
    merge release/v2.0
    commit id: "v2.0.0 正式发布"
    
    %% 紧急修复
    branch hotfix/critical-bug
    checkout hotfix/critical-bug
    commit id: "修复严重Bug"
    
    checkout main
    merge hotfix/critical-bug
    commit id: "v2.0.1 紧急修复"
    
    checkout develop
    merge hotfix/critical-bug
    commit id: "同步修复到开发分支"`
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
        const backgroundColor = currentBg === 'transparent' ? null : currentBg;
        
        const canvas = await html2canvas(preview, {
            backgroundColor: backgroundColor,
            scale: 2,
            useCORS: true
        });
        
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
        const backgroundColor = currentBg === 'transparent' ? null : currentBg;
        
        const canvas = await html2canvas(preview, {
            backgroundColor: backgroundColor,
            scale: 2,
            useCORS: true
        });
        
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
        'openrouter': '请输入OpenRouter API Key (sk-or-...)',
        'custom': '请输入自定义API Key'
    };
    
    const modelPlaceholders = {
        'openai': '请输入模型ID (如: gpt-4, gpt-3.5-turbo)',
        'claude': '请输入模型ID (如: claude-3-opus-20240229, claude-3-sonnet-20240229)',
        'gemini': '请输入模型ID (如: gemini-pro, gemini-pro-vision)',
        'qwen': '请输入模型ID (如: qwen-turbo, qwen-plus, qwen-max)',
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
    }
    
    const finalEndpoint = provider === 'gemini' ? `${endpoint}?key=${apiKey}` : endpoint;
    
    console.log('Making API request to:', finalEndpoint);
    console.log('Request options:', { ...requestOptions, body: 'REDACTED' });
    
    const response = await fetch(finalEndpoint, requestOptions);
    
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
        zIndex: '10000',
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
        const backgroundColor = currentBg === 'transparent' ? null : currentBg;
        
        const canvas = await html2canvas(preview, {
            backgroundColor: backgroundColor,
            scale: 2,
            useCORS: true
        });
        
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
    const mermaidKeywords = ['flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'erDiagram', 'journey', 'pie', 'gantt', 'gitgraph', 'mindmap', 'timeline'];
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
    currentZoom += 0.2;
    if (currentZoom > 3) currentZoom = 3; // 最大放大3倍
    applyZoom();
    showToast(`放大到 ${Math.round(currentZoom * 100)}%`, 'info');
}

// 缩小功能
function zoomOut() {
    currentZoom -= 0.2;
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
function toggleFullscreen() {
    const previewPanel = document.querySelector('.preview-panel');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (!isFullscreen) {
        // 进入全屏
        previewPanel.classList.add('preview-fullscreen');
        fullscreenBtn.textContent = '⛶';
        fullscreenBtn.title = '退出全屏';
        isFullscreen = true;
        showToast('已进入全屏模式，按ESC或点击按钮退出', 'info');
        
        // 监听ESC键退出全屏，确保不重复添加
        document.removeEventListener('keydown', handleEscapeKey);
        document.addEventListener('keydown', handleEscapeKey);
    } else {
        // 退出全屏
        exitFullscreen();
    }
}

// 退出全屏
function exitFullscreen() {
    const previewPanel = document.querySelector('.preview-panel');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    previewPanel.classList.remove('preview-fullscreen');
    fullscreenBtn.textContent = '⛶';
    fullscreenBtn.title = '全屏';
    isFullscreen = false;
    showToast('已退出全屏模式', 'info');
    
    // 移除ESC键监听
    document.removeEventListener('keydown', handleEscapeKey);
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
