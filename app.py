from flask import Flask, render_template, request, jsonify, send_file
import os
import platform
from datetime import datetime
import time
import psutil
import json
from PIL import Image
import io
import mimetypes

app = Flask(__name__)

def get_file_date(file_path):
    """获取文件的创建日期"""
    # 获取文件的修改时间
    timestamp = os.path.getmtime(file_path)
    return datetime.fromtimestamp(timestamp)

def is_same_date(date1, date2):
    """比较两个日期是否是同一天"""
    return (date1.year == date2.year and 
            date1.month == date2.month and 
            date1.day == date2.day)

def get_mounted_devices():
    """获取已挂载的存储设备"""
    devices = []
    
    # 获取所有磁盘分区
    partitions = psutil.disk_partitions(all=True)
    
    for partition in partitions:
        try:
            # 在macOS上，可移动设备通常挂载在/Volumes下
            if platform.system() == "Darwin" and partition.mountpoint.startswith("/Volumes/"):
                # 获取分区使用情况
                usage = psutil.disk_usage(partition.mountpoint)
                
                # 检查是否是SD卡（根据常见的文件夹结构）
                is_camera_storage = (
                    os.path.exists(os.path.join(partition.mountpoint, "DCIM")) or
                    os.path.exists(os.path.join(partition.mountpoint, "PRIVATE/M4ROOT/CLIP"))
                )
                
                if is_camera_storage:
                    device_name = os.path.basename(partition.mountpoint)
                    devices.append({
                        "name": device_name,
                        "path": partition.mountpoint,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "type": "SD卡"
                    })
                
        except (PermissionError, OSError):
            continue
    
    return devices

def get_video_thumbnail_path(video_path):
    """获取视频对应的缩略图路径"""
    if not video_path.startswith('/Volumes/Untitled/PRIVATE/M4ROOT/CLIP/'):
        return None
        
    # 从视频路径中提取文件名
    video_name = os.path.basename(video_path)
    video_name_without_ext = os.path.splitext(video_name)[0]
    
    # 构建缩略图路径 (添加T01后缀)
    thumbnail_path = f'/Volumes/Untitled/PRIVATE/M4ROOT/THMBNL/{video_name_without_ext}T01.JPG'
    
    if os.path.exists(thumbnail_path):
        return thumbnail_path
    return None

def generate_thumbnail(file_path, size=(150, 150)):
    """生成缩略图"""
    try:
        # 如果是视频文件，尝试获取其缩略图
        if file_path.lower().endswith(('.mp4', '.mov', '.mxf')):
            thumb_path = get_video_thumbnail_path(file_path)
            if thumb_path:
                try:
                    # 直接打开 JPG 缩略图文件
                    with Image.open(thumb_path) as img:
                        # 保持纵横比
                        img.thumbnail(size)
                        # 将图片转换为字节流
                        thumb_io = io.BytesIO()
                        img.save(thumb_io, 'JPEG', quality=85)
                        thumb_io.seek(0)
                        return thumb_io
                except Exception as e:
                    print(f"Error processing thumbnail file {thumb_path}: {str(e)}")
                    return None
        
        # 检查文件类型
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type or not mime_type.startswith('image/'):
            return None
            
        # 打开图片并生成缩略图
        with Image.open(file_path) as img:
            # 保持纵横比
            img.thumbnail(size)
            # 将图片转换为字节流
            thumb_io = io.BytesIO()
            img.save(thumb_io, 'JPEG', quality=85)
            thumb_io.seek(0)
            return thumb_io
    except Exception as e:
        print(f"Error generating thumbnail for {file_path}: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/get-devices', methods=['GET'])
def get_devices():
    """获取可用的存储设备列表"""
    try:
        devices = get_mounted_devices()
        return jsonify({"devices": devices})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scan-device', methods=['POST'])
def scan_device():
    """扫描指定设备中的指定日期的文件"""
    data = request.json
    device_path = data.get('devicePath')
    scan_date_str = data.get('scanDate')
    
    if not device_path or not os.path.exists(device_path):
        return jsonify({"error": "设备路径无效"}), 400
        
    if not scan_date_str:
        return jsonify({"error": "未指定日期"}), 400
    
    try:
        # 解析日期字符串（格式：YYYY-MM-DD）
        scan_date = datetime.strptime(scan_date_str, '%Y-%m-%d')
        scan_date = scan_date.replace(hour=0, minute=0, second=0, microsecond=0)
    except ValueError:
        return jsonify({"error": "日期格式无效"}), 400
    
    result = {
        "photos": [],
        "videos": [],
        "error": None
    }
    
    try:
        # 使用固定的照片和视频路径
        photo_path = os.path.join(device_path, "DCIM", "100MSDCF")
        video_path = os.path.join(device_path, "PRIVATE", "M4ROOT", "CLIP")
        
        # 扫描照片
        if os.path.exists(photo_path):
            for file in os.listdir(photo_path):
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.raw', '.arw')):
                    file_path = os.path.join(photo_path, file)
                    file_date = get_file_date(file_path)
                    
                    if is_same_date(file_date, scan_date):
                        file_size = os.path.getsize(file_path)
                        result["photos"].append({
                            "name": file,
                            "path": file_path,
                            "size": file_size,
                            "date": file_date.strftime("%Y-%m-%d %H:%M:%S")
                        })
        
        # 扫描视频
        if os.path.exists(video_path):
            for file in os.listdir(video_path):
                if file.lower().endswith(('.mp4', '.mov', '.mxf')):
                    file_path = os.path.join(video_path, file)
                    file_date = get_file_date(file_path)
                    
                    if is_same_date(file_date, scan_date):
                        file_size = os.path.getsize(file_path)
                        result["videos"].append({
                            "name": file,
                            "path": file_path,
                            "size": file_size,
                            "date": file_date.strftime("%Y-%m-%d %H:%M:%S")
                        })
        
        # 按日期排序
        result["photos"].sort(key=lambda x: x["date"], reverse=True)
        result["videos"].sort(key=lambda x: x["date"], reverse=True)
        
        return jsonify(result)
        
    except Exception as e:
        result["error"] = str(e)
        return jsonify(result), 500

@app.route('/api/copy-files', methods=['POST'])
def copy_files():
    """复制选中的文件到目标目录"""
    data = request.json
    files = data.get('files', [])
    
    # 创建目标目录
    target_dir = os.path.expanduser('~/Desktop/照片备份')
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        
    result = {
        "success": [],
        "failed": []
    }
    
    import shutil
    for file_path in files:
        try:
            if os.path.exists(file_path):
                file_name = os.path.basename(file_path)
                target_path = os.path.join(target_dir, file_name)
                
                # 如果目标文件已存在，添加数字后缀
                counter = 1
                while os.path.exists(target_path):
                    name, ext = os.path.splitext(file_name)
                    target_path = os.path.join(target_dir, f"{name}_{counter}{ext}")
                    counter += 1
                
                shutil.copy2(file_path, target_path)
                result["success"].append({
                    "source": file_path,
                    "target": target_path
                })
            else:
                result["failed"].append({
                    "file": file_path,
                    "error": "文件不存在"
                })
        except Exception as e:
            result["failed"].append({
                "file": file_path,
                "error": str(e)
            })
    
    return jsonify(result)

@app.route('/api/thumbnail/<path:file_path>')
def get_thumbnail(file_path):
    """获取文件的缩略图"""
    try:
        # 解码文件路径
        file_path = '/' + file_path
        
        if not os.path.exists(file_path):
            return jsonify({"error": "文件不存在"}), 404
            
        # 生成缩略图
        thumb_io = generate_thumbnail(file_path)
        if thumb_io:
            return send_file(thumb_io, mimetype='image/jpeg')
        else:
            return jsonify({"error": "不支持的文件类型"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)
