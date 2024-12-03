document.addEventListener('DOMContentLoaded', function() {
    const deviceList = document.getElementById('deviceList');
    const refreshButton = document.getElementById('refreshDevices');
    const copyButton = document.getElementById('copyFiles');
    const createFolderButton = document.getElementById('createFolder');
    const folderNameInput = document.getElementById('folderName');
    const scanDateInput = document.getElementById('scanDate');
    const photoList = document.getElementById('photoList');
    const videoList = document.getElementById('videoList');
    const photoCount = document.getElementById('photoCount');
    const videoCount = document.getElementById('videoCount');
    const selectAllPhotos = document.getElementById('selectAllPhotos');
    const selectAllVideos = document.getElementById('selectAllVideos');
    
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
    
    // 监听文件夹名称输入
    folderNameInput.addEventListener('input', () => {
        createFolderButton.disabled = !folderNameInput.value.trim() || selectedFiles.size === 0;
    });

    // 全选照片
    selectAllPhotos.addEventListener('change', function() {
        const photoItems = photoList.querySelectorAll('.file-item');
        photoItems.forEach(item => {
            if (this.checked) {
                item.classList.add('selected');
                selectedFiles.add(item.getAttribute('data-file-path'));
            } else {
                item.classList.remove('selected');
                selectedFiles.delete(item.getAttribute('data-file-path'));
            }
        });
        updateCopyButton();
    });

    // 全选视频
    selectAllVideos.addEventListener('change', function() {
        const videoItems = videoList.querySelectorAll('.file-item');
        videoItems.forEach(item => {
            if (this.checked) {
                item.classList.add('selected');
                selectedFiles.add(item.getAttribute('data-file-path'));
            } else {
                item.classList.remove('selected');
                selectedFiles.delete(item.getAttribute('data-file-path'));
            }
        });
        updateCopyButton();
    });

    // 更新全选框状态
    function updateSelectAllState() {
        const photoItems = photoList.querySelectorAll('.file-item');
        const videoItems = videoList.querySelectorAll('.file-item');
        
        const photoSelected = Array.from(photoItems).filter(item => item.classList.contains('selected'));
        const videoSelected = Array.from(videoItems).filter(item => item.classList.contains('selected'));
        
        selectAllPhotos.checked = photoItems.length > 0 && photoSelected.length === photoItems.length;
        selectAllPhotos.indeterminate = photoSelected.length > 0 && photoSelected.length < photoItems.length;
        
        selectAllVideos.checked = videoItems.length > 0 && videoSelected.length === videoItems.length;
        selectAllVideos.indeterminate = videoSelected.length > 0 && videoSelected.length < videoItems.length;
    }
    
    // 显示文件列表
    function displayFiles(files) {
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
        
        // 清空现有内容和全选状态
        photoList.innerHTML = '';
        videoList.innerHTML = '';
        selectAllPhotos.checked = false;
        selectAllPhotos.indeterminate = false;
        selectAllVideos.checked = false;
        selectAllVideos.indeterminate = false;
        selectedFiles.clear();
        
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
        
        updateCopyButton();
    }
    
    // 创建文件元素
    function createFileElement(file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item mb-2';
        fileElement.setAttribute('data-file-path', file.path);

        // 添加缩略图容器
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container me-2';
        const thumbnail = document.createElement('img');
        // 修复缩略图 URL：移除开头的斜杠
        const thumbnailPath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
        thumbnail.src = `/api/thumbnail/${encodeURIComponent(thumbnailPath)}`;
        thumbnail.className = 'thumbnail';
        thumbnail.alt = file.name;
        thumbnailContainer.appendChild(thumbnail);
        fileElement.appendChild(thumbnailContainer);

        // 添加文件名
        const fileName = document.createElement('div');
        fileName.className = 'file-info';
        fileName.textContent = file.name;
        fileElement.appendChild(fileName);

        // 添加跳转按钮
        const openLocationBtn = document.createElement('button');
        openLocationBtn.className = 'btn btn-link open-location-btn';
        openLocationBtn.innerHTML = '<i class="bi bi-folder2-open"></i>';
        openLocationBtn.title = '在访达中显示';
        openLocationBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            try {
                const response = await fetch('/api/open-file-location', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ filePath: file.path })
                });
                
                if (!response.ok) {
                    const data = await response.json();
                    alert(data.error || '无法打开文件位置');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('打开文件位置时出错');
            }
        });
        fileElement.appendChild(openLocationBtn);

        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-link delete-btn';
        deleteBtn.innerHTML = '<i class="bi bi-x"></i>';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            fileElement.remove();
            updateFileCount();
            
            // 如果文件已被选中，从选中集合中移除
            const filePath = fileElement.getAttribute('data-file-path');
            selectedFiles.delete(filePath);
            
            // 更新全选框状态
            updateSelectAllState();
        });
        fileElement.appendChild(deleteBtn);

        // 添加点击选择事件
        fileElement.addEventListener('click', () => {
            const filePath = fileElement.getAttribute('data-file-path');
            if (fileElement.classList.contains('selected')) {
                fileElement.classList.remove('selected');
                selectedFiles.delete(filePath);
            } else {
                fileElement.classList.add('selected');
                selectedFiles.add(filePath);
            }
            updateSelectAllState();
        });

        return fileElement;
    }
    
    // 创建文件夹并复制文件
    createFolderButton.addEventListener('click', async () => {
        const folderName = folderNameInput.value.trim();
        if (!folderName || selectedFiles.size === 0) {
            return;
        }

        try {
            createFolderButton.disabled = true;
            createFolderButton.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                正在复制...
            `;

            const response = await fetch('/api/create-folder-and-copy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    folderName: folderName,
                    filePaths: Array.from(selectedFiles)
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // 显示成功消息
            alert(data.message);
            
            // 清空选择
            selectedFiles.clear();
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('selected');
            });
            selectAllPhotos.checked = false;
            selectAllVideos.checked = false;
            updateCopyButton();
            
            // 清空文件夹名称
            folderNameInput.value = '';
            createFolderButton.disabled = true;

        } catch (error) {
            console.error('Error creating folder and copying files:', error);
            alert('创建文件夹或复制文件失败: ' + error.message);
        } finally {
            createFolderButton.innerHTML = '创建文件夹并复制文件';
            createFolderButton.disabled = !folderNameInput.value.trim() || selectedFiles.size === 0;
        }
    });
    
    // 更新按钮状态
    function updateCopyButton() {
        const hasSelectedFiles = selectedFiles.size > 0;
        copyButton.disabled = !hasSelectedFiles;
        createFolderButton.disabled = !hasSelectedFiles || !folderNameInput.value.trim();
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
