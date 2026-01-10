const { app, BrowserWindow, Menu, dialog, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 判断是否为开发模式 - 使用 app.isPackaged 是最可靠的方式
// 注意：app.isPackaged 只能在 app ready 之后使用，这里用延迟判断
let isDev = !app.isPackaged || process.argv.includes('--dev') || !!process.env.ELECTRON_START_URL;

app.setName('WeMD');
app.setAppUserModelId('com.wemd.app');

let mainWindow;
let workspaceDir = null;
let fileWatcher = null;
let watcherDebounceTimer = null;
let directoryMode = 'flat'; // 'flat' | 'folder'

// --- File Watcher ---
function startWatching(dir) {
    if (fileWatcher) {
        fileWatcher.close();
        fileWatcher = null;
    }
    if (!dir || !fs.existsSync(dir)) return;

    try {
        fileWatcher = fs.watch(dir, { recursive: false }, (eventType, filename) => {
            if (!filename) return;
            // 忽略隐藏文件和非 md 文件
            if (filename.startsWith('.') || !filename.endsWith('.md')) return;

            // 防抖发送更新事件
            if (watcherDebounceTimer) clearTimeout(watcherDebounceTimer);
            watcherDebounceTimer = setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('file:refresh');
                }
            }, 300); // 300ms 防抖
        });
    } catch (error) {
        console.error('Failed to watch directory:', error);
    }
}

function stopWatching() {
    if (fileWatcher) {
        fileWatcher.close();
        fileWatcher = null;
    }
}

// --- Helper Functions ---

function getWindowIcon() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    const img = nativeImage.createFromPath(iconPath);
    return img.isEmpty() ? null : img;
}

function getUniqueFilePath(dir, filename) {
    const parsed = path.parse(filename);
    const base = parsed.name;
    const ext = parsed.ext || '.md';
    let candidate = path.join(dir, `${base}${ext}`);
    let counter = 1;
    while (fs.existsSync(candidate)) {
        candidate = path.join(dir, `${base} (${counter})${ext}`);
        counter += 1;
    }
    return candidate;
}

function scanWorkspace(dir) {
    if (!dir || !fs.existsSync(dir)) return [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const result = [];

        // 检测目录模式
        const hasArticleMdFolder = entries.some(entry =>
            entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, 'article.md'))
        );
        const isFolderMode = hasArticleMdFolder;

        // 更新全局模式
        directoryMode = isFolderMode ? 'folder' : 'flat';

        if (isFolderMode) {
            // 文件夹模式: 扫描子文件夹中的 article.md
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const articlePath = path.join(dir, entry.name, 'article.md');
                    if (fs.existsSync(articlePath)) {
                        const stats = fs.statSync(articlePath);
                        let themeName = '默认主题';

                        // 读取 frontmatter
                        try {
                            const fd = fs.openSync(articlePath, 'r');
                            const buffer = Buffer.alloc(500);
                            const bytesRead = fs.readSync(fd, buffer, 0, 500, 0);
                            fs.closeSync(fd);

                            const content = buffer.toString('utf8', 0, bytesRead);
                            const match = content.match(/^---\n([\s\S]*?)\n---/);
                            if (match) {
                                const themeMatch = match[1].match(/themeName:\s*(.+)/);
                                if (themeMatch) {
                                    themeName = themeMatch[1].trim().replace(/^['"]|['"]$/g, '');
                                }
                            }
                        } catch (e) {
                            // ignore
                        }

                        result.push({
                            name: entry.name, // 文件夹名作为显示名称
                            path: articlePath,
                            isDirectory: false,
                            createdAt: stats.birthtime,
                            updatedAt: stats.mtime,
                            size: stats.size,
                            themeName,
                            isFolder: true
                        });
                    }
                }
            }
        } else {
            // 扁平模式: 根目录直接包含 .md 文件
            const mdFiles = entries
                .filter(entry => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('.'))
                .map(entry => {
                    const fullPath = path.join(dir, entry.name);
                    const stats = fs.statSync(fullPath);

                    let themeName = '默认主题';
                    try {
                        const fd = fs.openSync(fullPath, 'r');
                        const buffer = Buffer.alloc(500);
                        const bytesRead = fs.readSync(fd, buffer, 0, 500, 0);
                        fs.closeSync(fd);

                        const content = buffer.toString('utf8', 0, bytesRead);
                        const match = content.match(/^---\n([\s\S]*?)\n---/);
                        if (match) {
                            const themeMatch = match[1].match(/themeName:\s*(.+)/);
                            if (themeMatch) {
                                themeName = themeMatch[1].trim().replace(/^['"]|['"]$/g, '');
                            }
                        }
                    } catch (e) {
                        // ignore read error
                    }

                    return {
                        name: entry.name,
                        path: fullPath,
                        isDirectory: false,
                        createdAt: stats.birthtime,
                        updatedAt: stats.mtime,
                        size: stats.size,
                        themeName,
                        isFolder: false
                    };
                });
            result.push(...mdFiles);
        }

        return result.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
        console.error('Scan workspace failed:', error);
        return [];
    }
}

// --- Window Management ---

function createWindow() {
    const windowIcon = getWindowIcon();
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1024,
        minHeight: 640,
        title: 'WeMD',
        icon: windowIcon || undefined,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#f5f7f9',
            symbolColor: '#2c2c2c',
            height: 48,
        },
        trafficLightPosition: { x: 14, y: 14 },
    });

    const startUrl = process.env.ELECTRON_START_URL
        ? process.env.ELECTRON_START_URL
        : isDev
            ? 'http://localhost:5173'
            : `file://${path.join(process.resourcesPath, 'web-dist', 'index.html')}`;

    console.log('[WeMD] Loading URL:', startUrl);
    console.log('[WeMD] isDev:', isDev);
    console.log('[WeMD] resourcesPath:', process.resourcesPath);

    mainWindow.loadURL(startUrl);
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.insertCSS(`
          body { padding-top: 52px; box-sizing: border-box; }
          #root, #app, .app-root { padding-top: 0; }
        `).catch(() => { });
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        stopWatching();
    });
}

// --- IPC Handlers ---

// 1. 选择工作区
ipcMain.handle('workspace:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        message: '选择 WeMD 工作区文件夹'
    });
    if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
    }
    const dir = result.filePaths[0];
    workspaceDir = dir;
    startWatching(dir);
    return { success: true, path: dir };
});

// 2. 获取当前工作区信息（启动时调用）
ipcMain.handle('workspace:current', async () => {
    // 这里可以结合 electron-store 持久化，暂时由前端传过来校验
    return { success: true, path: workspaceDir };
});

// 3. 设置工作区（前端恢复状态时调用）
ipcMain.handle('workspace:set', async (event, dir) => {
    if (!dir || !fs.existsSync(dir)) {
        return { success: false, error: 'Directory not found' };
    }
    workspaceDir = dir;
    startWatching(dir);
    return { success: true, path: dir };
});

// 4. 列出文件
ipcMain.handle('file:list', async (event, dir) => {
    const targetDir = dir || workspaceDir;
    if (!targetDir) return { success: false, error: 'No workspace selected' };
    const files = scanWorkspace(targetDir);
    return { success: true, files };
});

// 5. 读取文件
ipcMain.handle('file:read', async (event, filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, content, filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// 6. 新建文件
ipcMain.handle('file:create', async (event, payload) => {
    if (!workspaceDir) return { success: false, error: 'No workspace' };
    const { filename, content, title } = payload || {};

    if (directoryMode === 'folder') {
        // 文件夹模式: 创建 文件夹/article.md 结构
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '-');
        const safeTitle = title ? title.trim() : '未命名文章';
        const folderName = `${timestamp}-${safeTitle}`;
        const folderPath = path.join(workspaceDir, folderName);

        // 检查重名
        let finalFolderName = folderName;
        let counter = 1;
        while (fs.existsSync(folderPath)) {
            finalFolderName = `${folderName}-${counter}`;
            counter++;
        }

        const finalFolderPath = path.join(workspaceDir, finalFolderName);
        const articlePath = path.join(finalFolderPath, 'article.md');
        const imagesPath = path.join(finalFolderPath, 'images');

        try {
            // 创建文件夹
            fs.mkdirSync(finalFolderPath, { recursive: true });
            // 创建 images 目录
            fs.mkdirSync(imagesPath, { recursive: true });
            // 创建 article.md
            fs.writeFileSync(articlePath, content || '', 'utf-8');
            return { success: true, filePath: articlePath, filename: finalFolderName };
        } catch (error) {
            return { success: false, error: error.message };
        }
    } else {
        // 扁平模式: 直接创建 .md 文件
        const safeName = filename ? filename.trim() : '未命名文章.md';
        const targetPath = getUniqueFilePath(workspaceDir, safeName);

        try {
            fs.writeFileSync(targetPath, content || '', 'utf-8');
            return { success: true, filePath: targetPath, filename: path.basename(targetPath) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
});

// 7. 保存文件 (覆盖)
ipcMain.handle('file:save', async (event, payload) => {
    const { filePath, content } = payload;
    if (!filePath) return { success: false, error: 'File path required' };

    try {
        // Check if content has actually changed to avoid unnecessary writes
        let existingContent = '';
        if (fs.existsSync(filePath)) {
            existingContent = fs.readFileSync(filePath, 'utf-8');
        }

        // Only write if content is different
        if (existingContent !== content) {
            fs.writeFileSync(filePath, content, 'utf-8');
        }

        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// 8. 重命名
ipcMain.handle('file:rename', async (event, payload) => {
    const { oldPath, newName } = payload;
    if (!oldPath || !newName) return { success: false, error: 'Invalid arguments' };

    if (directoryMode === 'folder') {
        // 文件夹模式: 重命名文件夹
        const oldFolderPath = path.dirname(oldPath);
        const oldFolderName = path.basename(oldFolderPath);
        const newFolderName = newName; // 不需要 .md 后缀

        if (oldFolderName === newFolderName) {
            return { success: true, filePath: oldPath };
        }

        const newFolderPath = path.join(workspaceDir, newFolderName);
        const newArticlePath = path.join(newFolderPath, 'article.md');

        // 检查目标是否存在
        if (fs.existsSync(newFolderPath)) {
            return { success: false, error: '文件夹名已存在' };
        }

        try {
            // 重命名文件夹
            fs.renameSync(oldFolderPath, newFolderPath);
            return { success: true, filePath: newArticlePath, filename: newFolderName };
        } catch (error) {
            return { success: false, error: error.message };
        }
    } else {
        // 扁平模式: 重命名文件
        const dir = path.dirname(oldPath);
        const safeName = newName.endsWith('.md') ? newName : `${newName}.md`;
        const newPath = path.join(dir, safeName);

        if (oldPath === newPath) return { success: true, filePath: newPath };

        // 检查目标是否存在 (且不是大小写变名)
        if (fs.existsSync(newPath) && oldPath.toLowerCase() !== newPath.toLowerCase()) {
            return { success: false, error: '文件名已存在' };
        }

        try {
            fs.renameSync(oldPath, newPath);
            return { success: true, filePath: newPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
});

// 9. 删除文件
ipcMain.handle('file:delete', async (event, filePath) => {
    if (!filePath) return { success: false, error: 'Path required' };
    try {
        let targetPath = filePath;

        // 文件夹模式: 删除整个文件夹
        if (directoryMode === 'folder' && filePath.includes(path.sep)) {
            targetPath = path.dirname(filePath);
        }

        if (fs.existsSync(targetPath)) {
            // 尝试移动到回收站
            const { shell } = require('electron');
            await shell.trashItem(targetPath);
        }
        return { success: true };
    } catch (error) {
        // 如果回收站失败，尝试物理删除
        try {
            let targetPath = filePath;
            if (directoryMode === 'folder' && filePath.includes(path.sep)) {
                targetPath = path.dirname(filePath);
                if (fs.existsSync(targetPath)) {
                    fs.rmSync(targetPath, { recursive: true, force: true });
                }
            } else if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
});

// 10. 在资源管理器中显示
ipcMain.handle('file:reveal', async (event, filePath) => {
    if (filePath) {
        const { shell } = require('electron');
        shell.showItemInFolder(filePath);
    }
});

// 11. 获取目录模式
ipcMain.handle('workspace:get-mode', async () => {
    return { success: true, mode: directoryMode };
});

// 12. 迁移到文件夹模式
ipcMain.handle('workspace:migrate', async () => {
    if (!workspaceDir) return { success: false, error: 'No workspace' };
    if (directoryMode === 'folder') {
        return { success: true, message: '已经是文件夹模式，无需迁移' };
    }

    try {
        const entries = fs.readdirSync(workspaceDir, { withFileTypes: true });
        const migrations = [];

        // 收集需要迁移的文件
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('.')) {
                const oldPath = path.join(workspaceDir, entry.name);
                const folderName = entry.name.replace(/\.md$/, '');
                migrations.push({ oldPath, folderName });
            }
        }

        if (migrations.length === 0) {
            return { success: true, message: '没有需要迁移的文件' };
        }

        // 执行迁移
        for (const { oldPath, folderName } of migrations) {
            const content = fs.readFileSync(oldPath, 'utf-8');
            const newFolderPath = path.join(workspaceDir, folderName);
            const articlePath = path.join(newFolderPath, 'article.md');
            const imagesPath = path.join(newFolderPath, 'images');

            // 创建文件夹结构
            fs.mkdirSync(newFolderPath, { recursive: true });
            fs.mkdirSync(imagesPath, { recursive: true });
            fs.writeFileSync(articlePath, content, 'utf-8');

            // 删除原文件
            fs.unlinkSync(oldPath);
        }

        // 更新模式
        directoryMode = 'folder';

        return { success: true, message: `成功迁移 ${migrations.length} 个文件到文件夹模式` };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


// 创建应用菜单
function createMenu() {
    const template = [
        {
            label: 'WeMD',
            submenu: [
                { role: 'about', label: '关于 WeMD' },
                { type: 'separator' },
                { role: 'hide', label: '隐藏 WeMD' },
                { role: 'hideOthers', label: '隐藏其他' },
                { role: 'unhide', label: '显示全部' },
                { type: 'separator' },
                { role: 'quit', label: '退出 WeMD' },
            ],
        },
        {
            label: '文件',
            submenu: [
                {
                    label: '新建文章',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow && mainWindow.webContents.send('menu:new-file')
                },
                { type: 'separator' },
                {
                    label: '保存',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => mainWindow && mainWindow.webContents.send('menu:save')
                },
                { type: 'separator' },
                {
                    label: '切换工作区...',
                    click: async () => {
                        mainWindow && mainWindow.webContents.send('menu:switch-workspace');
                    }
                }
            ],
        },
        {
            label: '编辑',
            submenu: [
                { role: 'undo', label: '撤销' },
                { role: 'redo', label: '重做' },
                { type: 'separator' },
                { role: 'cut', label: '剪切' },
                { role: 'copy', label: '复制' },
                { role: 'paste', label: '粘贴' },
                { role: 'selectAll', label: '全选' },
            ],
        },
        {
            label: '查看',
            submenu: [
                { role: 'reload', label: '重新加载' },
                { role: 'forceReload', label: '强制重新加载' },
                { role: 'toggleDevTools', label: '开发者工具' },
                { type: 'separator' },
                { role: 'resetZoom', label: '实际大小' },
                { role: 'zoomIn', label: '放大' },
                { role: 'zoomOut', label: '缩小' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: '全屏' },
            ],
        },
        {
            label: '窗口',
            submenu: [
                { role: 'minimize', label: '最小化' },
                { role: 'zoom', label: '缩放' },
                { type: 'separator' },
                { role: 'front', label: '前置全部窗口' },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
    // macOS 会自动使用 app bundle 中的 icon.icns 作为 dock 图标
    createWindow();
    createMenu();
    if (mainWindow) {
        mainWindow.maximize();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
