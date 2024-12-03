@echo off
echo 正在构建独立可执行文件...

REM 安装 PyInstaller
pip install pyinstaller

REM 使用 PyInstaller 构建可执行文件
pyinstaller --noconfirm --clean ^
    --add-data "templates;templates" ^
    --add-data "static;static" ^
    --name "SD卡文件拷贝工具" ^
    --icon "static/favicon.ico" ^
    --windowed ^
    app.py

echo 构建完成！
pause
