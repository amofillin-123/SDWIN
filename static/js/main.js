document.addEventListener('DOMContentLoaded', function() {
    const deviceList = document.getElementById('deviceList');
    const scanButton = document.getElementById('scanFiles');
    const refreshButton = document.getElementById('refreshDevices');
    const copyButton = document.getElementById('copyFiles');
    const scanDateInput = document.getElementById('scanDate');
    const fileList = document.getElementById('fileList');
    const photoList = document.getElementById('photoList');
    const videoList = document.getElementById('videoList');
    const photoCount = document.getElementById('photoCount');
    const videoCount = document.getElementById('videoCount');
    
    // 存储当前选中的设备路径和选中的文件
    let selectedDevicePath = null;
    let selectedFiles = new Set();
    
    // 设置日期选择框的默认值为今天
    const today = new Date();
    scanDateInput.value = today.toISOString().split('T')[0];
    
    // 初始化：获取设备列表
    loadDevices();
    
    // 绑定按钮事件
    refreshButton.addEventListener('click', loadDevices);
    scanButton.addEventListener('click', () => {
        if (selectedDevicePath) {
            scanDevice(selectedDevicePath, scanDateInput.value);
        }
    });
    copyButton.addEventListener('click', copySelectedFiles);
    
    // 加载设备列表
    async function loadDevices() {
        try {
            deviceList.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p>正在搜索存储设备...</p>
                </div>
            `;
            
            const response = await fetch('/api/get-devices');
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            displayDevices(data.devices);
            
        } catch (error) {
            console.error('Error loading devices:', error);
            deviceList.innerHTML = `
                <div class="alert alert-danger">
                    <p>加载设备列表失败: ${error.message}</p>
                    <p>请确保已插入SD卡并正确挂载。</p>
                </div>
            `;
            scanButton.disabled = true;
        }
    }
    
    // 显示设备列表
    function displayDevices(devices) {
        if (devices.length === 0) {
            deviceList.innerHTML = `
                <div class="alert alert-info">
                    <p>未找到SD卡</p>
                    <p>请确保：</p>
                    <ul>
                        <li>SD卡已正确插入读卡器</li>
                        <li>SD卡已被系统识别并挂载</li>
                        <li>SD卡中包含DCIM或视频文件夹</li>
                    </ul>
                </div>
            `;
            scanButton.disabled = true;
            selectedDevicePath = null;
            return;
        }
        
        deviceList.innerHTML = '';
        devices.forEach(device => {
            const deviceElement = document.createElement('div');
            deviceElement.className = 'device-item';
            deviceElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0">${device.name}</h5>
                        <small class="text-muted">${device.path}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-primary">${device.type}</span>
                        <div class="text-muted small">
                            可用: ${formatFileSize(device.free)} / 
                            总计: ${formatFileSize(device.total)}
                        </div>
                    </div>
                </div>
            `;
            
            // 点击设备选择
            deviceElement.addEventListener('click', () => {
                document.querySelectorAll('.device-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                deviceElement.classList.add('selected');
                selectedDevicePath = device.path;
                scanButton.disabled = false;
                
                // 自动扫描选中日期的文件
                scanDevice(device.path, scanDateInput.value);
            });
            
            deviceList.appendChild(deviceElement);
        });
    }
    
    // 扫描设备中的文件
    async function scanDevice(devicePath, scanDate) {
        try {
            // 显示加载状态
            const loadingHtml = `
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p>正在扫描文件...</p>
                </div>
            `;
            photoList.innerHTML = loadingHtml;
            videoList.innerHTML = loadingHtml;
            
            const response = await fetch('/api/scan-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    devicePath,
                    scanDate 
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // 显示文件列表
            displayFiles([...data.photos, ...data.videos]);
            
        } catch (error) {
            console.error('Error scanning device:', error);
            const errorHtml = `
                <div class="alert alert-danger">
                    扫描文件失败: ${error.message}
                </div>
            `;
            photoList.innerHTML = errorHtml;
            videoList.innerHTML = errorHtml;
        }
    }
    
    // 监听日期变化，自动重新扫描
    scanDateInput.addEventListener('change', () => {
        if (selectedDevicePath) {
            scanDevice(selectedDevicePath, scanDateInput.value);
        }
    });
    
    // 显示文件列表
    function displayFiles(files) {
        const photoList = document.getElementById('photoList');
        const videoList = document.getElementById('videoList');
        const photoCount = document.getElementById('photoCount');
        const videoCount = document.getElementById('videoCount');
        
        // 清空现有内容
        photoList.innerHTML = '';
        videoList.innerHTML = '';
        
        // 分类文件
        const photos = [];
        const videos = [];
        
        files.forEach(file => {
            if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|raw|arw)$/)) {
                photos.push(file);
            } else if (file.name.toLowerCase().match(/\.(mp4|mov|mxf)$/)) {
                videos.push(file);
            }
        });
        
        // 更新计数
        photoCount.textContent = `${photos.length} 个文件`;
        videoCount.textContent = `${videos.length} 个文件`;
        
        // 显示照片
        photos.forEach(file => {
            const fileElement = createFileElement(file);
            photoList.appendChild(fileElement);
        });
        
        // 显示视频
        videos.forEach(file => {
            const fileElement = createFileElement(file);
            videoList.appendChild(fileElement);
        });
        
        // 如果没有文件，显示提示
        if (photos.length === 0) {
            photoList.innerHTML = '<div class="alert alert-info">没有找到照片</div>';
        }
        if (videos.length === 0) {
            videoList.innerHTML = '<div class="alert alert-info">没有找到视频</div>';
        }
    }
    
    // 创建文件元素
    function createFileElement(file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        
        // 检查文件类型
        const isVideo = file.name.toLowerCase().match(/\.(mp4|mov|mxf)$/);
        
        // 准备缩略图
        const thumbnailHtml = `<img src="/api/thumbnail/${encodeURIComponent(file.path)}" alt="${file.name}" loading="lazy">`;
        
        fileElement.innerHTML = `
            <div class="thumbnail-container">
                ${thumbnailHtml}
                ${isVideo ? '<div class="video-overlay">▶</div>' : ''}
            </div>
            <div class="file-info-container">
                <div class="file-name">${file.name}</div>
                <div class="file-info">
                    <span>${file.date}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
        `;
        
        // 点击文件选择
        fileElement.addEventListener('click', () => {
            fileElement.classList.toggle('selected');
            if (fileElement.classList.contains('selected')) {
                selectedFiles.add(file.path);
            } else {
                selectedFiles.delete(file.path);
            }
            updateCopyButton();
        });
        
        return fileElement;
    }
    
    // 更新复制按钮状态
    function updateCopyButton() {
        copyButton.disabled = selectedFiles.size === 0;
    }
    
    // 复制选中的文件
    async function copySelectedFiles() {
        try {
            const response = await fetch('/api/copy-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: Array.from(selectedFiles)
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // 显示复制结果
            let message = '';
            if (data.success.length > 0) {
                message += `成功复制 ${data.success.length} 个文件\n`;
            }
            if (data.failed.length > 0) {
                message += `失败 ${data.failed.length} 个文件\n`;
                data.failed.forEach(item => {
                    message += `${item.file}: ${item.error}\n`;
                });
            }
            
            alert(message);
            
            // 清除选择
            selectedFiles.clear();
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('selected');
            });
            updateCopyButton();
            
        } catch (error) {
            console.error('Error copying files:', error);
            alert('复制文件失败: ' + error.message);
        }
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
