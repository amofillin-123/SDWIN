# SD卡文件拷贝工具

这是一个便捷的SD卡文件拷贝工具，支持Windows和macOS系统。可以快速将相机SD卡中的照片和视频文件复制到电脑中。

## 系统要求

- Windows 7/8/10/11 或 macOS
- Python 3.8 或更高版本
- 浏览器（推荐使用 Chrome 或 Edge）

## Windows用户使用说明

### 方式一：直接运行（推荐）

1. 下载 `SD卡文件拷贝工具.exe`
2. 双击运行即可使用
3. 无需安装任何其他软件

### 方式二：从源码运行

如果你已经安装了Python，也可以从源码运行：

1. 下载并安装 Python（如果尚未安装）
   - 访问 https://www.python.org/downloads/
   - 下载最新版本的Python
   - 安装时请勾选"Add Python to PATH"选项

2. 运行程序
   - 双击运行 `start.bat`
   - 首次运行时会自动安装必要的依赖
   - 程序启动后会自动打开浏览器窗口

## 使用说明

1. 插入SD卡，程序会自动检测
2. 选择要复制的文件
3. 选择保存位置
4. 点击复制即可

## 注意事项

- 请确保SD卡正确插入并被系统识别
- 复制大文件时请保持耐心，不要中断操作
- 如遇到问题，可以尝试重新运行程序

## macOS用户使用说明

1. 确保已安装Python 3.8或更高版本
2. 打开终端，进入程序目录
3. 运行以下命令：
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python app.py
   ```
