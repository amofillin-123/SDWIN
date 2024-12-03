@echo off
echo 正在启动SD卡文件拷贝工具...

REM 检查是否已安装Python
python --version >nul 2>&1
if errorlevel 1 (
    echo 未检测到Python，请先安装Python 3.8或更高版本
    echo 您可以从 https://www.python.org/downloads/ 下载安装
    pause
    exit
)

REM 检查是否已安装依赖
if not exist "venv" (
    echo 首次运行，正在创建虚拟环境...
    python -m venv venv
    call venv\Scripts\activate
    echo 正在安装依赖...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

REM 启动应用
python app.py
pause
