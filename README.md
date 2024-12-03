# SD卡文件拷贝工具

这是一个基于Web的SD卡文件管理工具，专门设计用于快速筛选和复制SD卡中的照片和视频文件。支持Windows和macOS系统。

## 主要功能

- 自动检测并显示已插入的SD卡
- 按日期筛选文件
- 显示图片和视频缩略图
- 支持多文件选择和批量复制
- 自动创建目标文件夹
- 实时显示复制进度
- 支持索尼相机视频缩略图显示

## 技术特性

- 跨平台支持 (Windows & macOS)
- 响应式网页设计
- 实时文件预览
- 异步文件处理
- 自动错误处理和恢复

## 系统要求

- Python 3.8+
- 网络浏览器 (Chrome, Firefox, Safari)
- 操作系统：Windows 10+ 或 macOS 10.15+

## 安装步骤

1. 克隆仓库：
```bash
git clone [repository-url]
cd sd-card-copy-tool
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 运行应用：
```bash
python app.py
```

4. 在浏览器中访问：
```
http://localhost:3000
```

## 使用说明

1. 插入SD卡，等待系统识别
2. 在网页界面选择要操作的SD卡
3. 选择日期筛选文件（默认显示当天）
4. 点击文件选择/取消选择
5. 点击"复制选中文件"开始复制
6. 文件将被复制到桌面的"照片备份"文件夹中

## 文件结构

```
.
├── app.py              # 主应用程序
├── requirements.txt    # Python依赖
├── static/            # 静态资源
│   ├── css/          # 样式文件
│   └── js/           # JavaScript文件
└── templates/         # HTML模板
    └── index.html    # 主页面
```

## 依赖列表

- Flask: Web框架
- Pillow: 图像处理
- psutil: 系统信息获取

## 开发者说明

- 所有API端点都在 `app.py` 中定义
- 前端代码在 `static/js/main.js` 中
- 样式定义在 `templates/index.html` 中
- 文件操作相关的函数都在 `app.py` 中实现

## 注意事项

- 确保SD卡有足够的读取权限
- 不要在文件复制过程中移除SD卡
- 建议在复制完成后使用系统的"安全弹出"功能移除SD卡

## 许可证

MIT License
