import FileTreeAlternativePlugin from './main';
import { PluginSettingTab, Setting, App, Notice } from 'obsidian';
import { LocalStorageHandler } from '@ozntel/local-storage-handler';
import { eventTypes } from 'utils/types';

type FolderIcon = 'default' | 'box-folder' | 'icomoon' | 'typicon' | 'circle-gg';
export type SortType = 'name' | 'last-update' | 'created' | 'file-size';
export type FolderSortType = 'name' | 'item-number';
export type DeleteFileOption = 'trash' | 'permanent' | 'system-trash';
export type EvernoteViewOption = 'Disabled' | 'Horizontal' | 'Vertical';

export interface FileTreeAlternativePluginSettings {
    openViewOnStart: boolean;
    ribbonIcon: boolean;
    showRootFolder: boolean;
    showFilesFromSubFolders: boolean;
    searchFunction: boolean;
    allSearchOnlyInFocusedFolder: boolean;
    showFilesFromSubFoldersButton: boolean;
    revealActiveFileButton: boolean;
    excludedExtensions: string;
    excludedFolders: string;
    hideAttachments: boolean;
    attachmentsFolderName: string;
    folderIcon: FolderIcon;
    folderCount: boolean;
    folderCountOption: string;
    evernoteView: EvernoteViewOption;
    filePreviewOnHover: boolean;
    iconBeforeFileName: boolean;
    sortFilesBy: SortType;
    sortReverse: boolean;
    sortFoldersBy: FolderSortType;
    fixedHeaderInFileList: boolean;
    createdYaml: boolean;
    fileNameIsHeader: boolean;
    folderNote: boolean;
    deleteFileOption: DeleteFileOption;
    showFileNameAsFullPath: boolean;
    bookmarksEvents: boolean;
}

export const DEFAULT_SETTINGS: FileTreeAlternativePluginSettings = {
    openViewOnStart: true,
    ribbonIcon: true,
    showRootFolder: true,
    showFilesFromSubFolders: true,
    searchFunction: true,
    allSearchOnlyInFocusedFolder: false,
    showFilesFromSubFoldersButton: true,
    revealActiveFileButton: false,
    excludedExtensions: '',
    excludedFolders: '',
    hideAttachments: false,
    attachmentsFolderName: 'attachments',
    folderIcon: 'default',
    folderCount: true,
    folderCountOption: 'notes',
    evernoteView: 'Vertical',
    filePreviewOnHover: false,
    iconBeforeFileName: true,
    sortFilesBy: 'name',
    sortReverse: false,
    sortFoldersBy: 'name',
    fixedHeaderInFileList: true,
    createdYaml: false,
    fileNameIsHeader: false,
    folderNote: false,
    deleteFileOption: 'trash',
    showFileNameAsFullPath: false,
    bookmarksEvents: false,
};

export class FileTreeAlternativePluginSettingsTab extends PluginSettingTab {
    plugin: FileTreeAlternativePlugin;

    constructor(app: App, plugin: FileTreeAlternativePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    refreshView() {
        let evt = new CustomEvent(eventTypes.refreshView, {});
        window.dispatchEvent(evt);
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();

        let lsh = new LocalStorageHandler({});

        /* ------------- Buy Me a Coffee ------------- */

        const coffeeDiv = containerEl.createDiv('coffee');
        coffeeDiv.addClass('oz-coffee-div');
        const coffeeLink = coffeeDiv.createEl('a', { href: 'https://ko-fi.com/L3L356V6Q' });
        const coffeeImg = coffeeLink.createEl('img', {
            attr: {
                src: 'https://cdn.ko-fi.com/cdn/kofi2.png?v=3',
            },
        });
        coffeeImg.height = 45;

        /* ------------- General Settings ------------- */

        containerEl.createEl('h2', { text: '常规设置' });

        new Setting(containerEl)
            .setName('类似印象笔记视图')
            .setDesc('若想在单个视图中查看文件夹和文件，无需在不同视图间切换，请开启此功能。体验类似于印象笔记。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('Disabled', '禁用')
                    .addOption('Horizontal', '横向')
                    .addOption('Vertical', '纵向')
                    .setValue(this.plugin.settings.evernoteView)
                    .onChange((value: EvernoteViewOption) => {
                        this.plugin.settings.evernoteView = value;
                        this.plugin.saveSettings();
                        this.refreshView();
                    });
            });

        new Setting(containerEl)
            .setName('功能区图标')
            .setDesc('若想在功能区显示用于激活文件树的图标，请开启此功能。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.ribbonIcon).onChange((value) => {
                    this.plugin.settings.ribbonIcon = value;
                    this.plugin.saveSettings();
                    this.plugin.refreshIconRibbon();
                })
            );

        new Setting(containerEl)
            .setName('启动时打开')
            .setDesc('若不想在保险库启动时自动打开文件树视图，请关闭此功能。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.openViewOnStart).onChange((value) => {
                    this.plugin.settings.openViewOnStart = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('书签事件监听器（Shift + 点击）')
            .setDesc(
                '此功能将启用从核心书签插件中显示文件或文件夹的功能。' +
                '由于目前没有 API 可以覆盖书签插件的默认行为，' +
                '因此当你按住 Shift 键点击书签名称时，会添加一个显示文件的事件。'
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.bookmarksEvents).onChange((value) => {
                    this.plugin.settings.bookmarksEvents = value;
                    if (value) {
                        this.plugin.bookmarksAddEventListener();
                    } else {
                        this.plugin.bookmarksRemoveEventListener();
                    }
                    this.plugin.saveSettings();
                })
            );

        /* ------------- Folder Pane Settings ------------- */

        containerEl.createEl('h2', { text: '文件夹面板设置' });

        new Setting(containerEl)
            .setName('文件夹图标')
            .setDesc('将默认文件夹图标更改为你偏好的选项。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('default', '默认')
                    .addOption('box-folder', 'Box 图标')
                    .addOption('icomoon', 'IcoMoon 图标')
                    .addOption('typicon', 'Typicons 图标')
                    .addOption('circle-gg', 'Circle GG 图标')
                    .setValue(this.plugin.settings.folderIcon)
                    .onChange((value: FolderIcon) => {
                        this.plugin.settings.folderIcon = value;
                        this.plugin.saveSettings();
                        this.refreshView();
                    });
            });

        new Setting(containerEl)
            .setName('显示根文件夹')
            .setDesc(`若想在文件树中显示根文件夹 "${this.plugin.app.vault.getName()}"，请开启此功能。`)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showRootFolder).onChange((value) => {
                    this.plugin.settings.showRootFolder = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('文件夹计数')
            .setDesc('若想查看文件树下的笔记/文件数量，请开启此功能。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.folderCount).onChange((value) => {
                    this.plugin.settings.folderCount = value;
                    this.plugin.saveSettings();
                    this.plugin.refreshTreeLeafs();
                })
            );

        new Setting(containerEl)
            .setName('文件夹计数详情')
            .setDesc('选择你想纳入计数的文件类型。')
            .addDropdown((dropdown) => {
                dropdown.addOption('notes', '笔记');
                dropdown.addOption('files', '所有文件');
                dropdown.setValue(this.plugin.settings.folderCountOption);
                dropdown.onChange((option) => {
                    this.plugin.settings.folderCountOption = option;
                    this.plugin.saveSettings();
                    this.refreshView();
                });
            });

        new Setting(containerEl)
            .setName('文件夹笔记')
            .setDesc(
                `若想像文件夹笔记插件一样创建文件夹笔记，请开启此选项。
                默认情况下，点击将打开文件列表。你需要使用 "Shift+点击" 来打开文件夹笔记。如果文件夹有文件夹笔记，
                你将在文件夹右侧看到一个箭头图标。作为文件夹笔记创建的笔记将在文件列表中隐藏。`
            )
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.folderNote).onChange((value) => {
                    this.plugin.settings.folderNote = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                });
            });

        /* ------------- File Pane Settings ------------- */
        containerEl.createEl('h2', { text: '文件面板设置' });

        new Setting(containerEl)
            .setName('将子文件夹中的文件包含到文件列表')
            .setDesc(`若想在所选文件夹的文件列表中同时显示所有子文件夹中的文件，请开启此选项。`)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showFilesFromSubFolders).onChange((value) => {
                    this.plugin.settings.showFilesFromSubFolders = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('包含子文件夹文件的切换按钮')
            .setDesc(`若想在文件列表顶部添加一个额外的按钮，用于切换 "包含子文件夹中的文件" 功能，请开启此选项。`)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showFilesFromSubFoldersButton).onChange((value) => {
                    this.plugin.settings.showFilesFromSubFoldersButton = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('在文件树中显示活动文件按钮')
            .setDesc(
                `若想添加一个额外的按钮，用于在文件树中显示活动文件，请开启此选项。该按钮将相应地设置文件夹和文件面板。`
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.revealActiveFileButton).onChange((value) => {
                    this.plugin.settings.revealActiveFileButton = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('文件列表搜索')
            .setDesc(`若想启用按文件名过滤文件的搜索功能，请开启此选项。`)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.searchFunction).onChange((value) => {
                    this.plugin.settings.searchFunction = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('"all:" 和 "tag:" 仅在聚焦文件夹中搜索')
            .setDesc(
                `"all:" 和 "tag:" 搜索默认会在整个保险库中查找所有文件。若想仅在聚焦文件夹中进行搜索，请开启此选项。`
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.allSearchOnlyInFocusedFolder).onChange((value) => {
                    this.plugin.settings.allSearchOnlyInFocusedFolder = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('文件名前显示图标')
            .setDesc('若想在文件列表的文件名前显示文件图标，请开启此功能。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.iconBeforeFileName).onChange((value) => {
                    this.plugin.settings.iconBeforeFileName = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('悬停预览文件')
            .setDesc('若想在按住 Ctrl/Cmd 键并将鼠标悬停在文件列表中的文件上时预览文件，请开启此功能。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.filePreviewOnHover).onChange((value) => {
                    this.plugin.settings.filePreviewOnHover = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('固定文件面板中的按钮和标题')
            .setDesc('若想让按钮和标题在文件列表滚动时保持固定，请开启此功能。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.fixedHeaderInFileList).onChange((value) => {
                    this.plugin.settings.fixedHeaderInFileList = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('显示完整路径文件名')
            .setDesc('若想在文件名列表中显示完整路径，而不仅仅是文件名，请开启此功能。')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.showFileNameAsFullPath).onChange((value) => {
                    this.plugin.settings.showFileNameAsFullPath = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                });
            });

        new Setting(containerEl)
            .setName('删除文件的目标位置')
            .setDesc('选择文件删除后要移动到的位置。')
            .addDropdown((dropdown) => {
                dropdown.addOption('permanent', '永久删除');
                dropdown.addOption('trash', '移动到 Obsidian 回收站');
                dropdown.addOption('system-trash', '移动到系统回收站');
                dropdown.setValue(this.plugin.settings.deleteFileOption);
                dropdown.onChange((option: DeleteFileOption) => {
                    this.plugin.settings.deleteFileOption = option;
                    this.plugin.saveSettings();
                });
            });

        /* ------------- Exclusion Settings ------------- */
        containerEl.createEl('h2', { text: '文件创建' });

        containerEl.createEl('p', { text: '以下设置仅在使用插件文件面板中的加号 (+) 按钮时适用。' });

        new Setting(containerEl)
            .setName('YAML 中包含创建信息')
            .setDesc('若想让插件在创建文件时在 YAML 中包含创建时间键，请开启此功能。')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.createdYaml).onChange((value) => {
                    this.plugin.settings.createdYaml = value;
                    this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('将文件名设为一级标题')
            .setDesc('若想让插件在创建的文件中添加初始文件名作为主标题，请开启此功能。')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.fileNameIsHeader).onChange((value) => {
                    this.plugin.settings.fileNameIsHeader = value;
                    this.plugin.saveSettings();
                });
            });

        /* ------------- Exclusion Settings ------------- */

        containerEl.createEl('h2', { text: '排除设置' });

        new Setting(containerEl)
            .setName('隐藏附件')
            .setDesc(`此功能将隐藏视图中的 "attachments" 文件夹以及该文件夹下的所有文件。`)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.hideAttachments).onChange((value) => {
                    this.plugin.settings.hideAttachments = value;
                    this.plugin.saveSettings();
                    this.plugin.refreshTreeLeafs();
                })
            );

        new Setting(containerEl)
            .setName('排除的文件扩展名')
            .setDesc(
                `提供你想从文件树列表中排除的文件扩展名，用逗号分隔。例如：'png, pdf, jpeg'。
            你需要重新加载保险库或使用下面的 "重新加载文件树" 按钮使更改生效。`
            )
            .addTextArea((text) =>
                text.setValue(this.plugin.settings.excludedExtensions).onChange((value) => {
                    this.plugin.settings.excludedExtensions = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('排除的文件夹路径')
            .setDesc(
                `提供你想从文件树列表中排除的文件夹的完整路径，用逗号分隔。例如：'Personal/Attachments, Work/Documents/Folders'。
            所有子文件夹也将被排除。你需要重新加载保险库或使用下面的 "重新加载文件树" 按钮使更改生效。`
            )
            .addTextArea((text) =>
                text.setValue(this.plugin.settings.excludedFolders).onChange((value) => {
                    this.plugin.settings.excludedFolders = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setDesc(
                '使用此按钮重新加载文件树。某些设置需要重新加载文件树才能生效。你也可以重启保险库来达到相同的效果。'
            )
            .addButton((button) => {
                button
                    .setClass('reload-file-tree-button')
                    .setTooltip('点击此处重新加载文件树')
                    .setButtonText('重新加载文件树')
                    .onClick((e) => {
                        this.plugin.refreshTreeLeafs();
                    });
            });

        /* ------------- Clear Data ------------- */
        containerEl.createEl('h2', { text: '清除数据' });

        new Setting(containerEl)
            .setName('清除所有缓存数据')
            .setDesc(
                `此按钮将清除以下缓存数据："分隔线的最后位置"、"文件夹面板中展开的文件夹列表" 以及 "最后活动的文件夹路径"。
                它不会影响你上面的设置和固定文件列表。建议偶尔进行一次清除操作。`
            )
            .addButton((button) => {
                let b = button
                    .setTooltip('点击此处清除缓存数据')
                    .setButtonText('点击清除缓存')
                    .onClick(async () => {
                        lsh.removeFromLocalStorage({ key: this.plugin.keys.customHeightKey });
                        lsh.removeFromLocalStorage({ key: this.plugin.keys.customWidthKey });
                        lsh.removeFromLocalStorage({ key: this.plugin.keys.openFoldersKey });
                        lsh.removeFromLocalStorage({ key: this.plugin.keys.activeFolderPathKey });
                        lsh.removeFromLocalStorage({ key: this.plugin.keys.focusedFolder });
                        this.plugin.refreshTreeLeafs();
                        new Notice('插件缓存已清除...');
                    });
            });

        new Setting(containerEl)
            .setName('清除固定文件')
            .setDesc(`此按钮将清除文件列表面板中的固定文件。`)
            .addButton((button) => {
                let b = button
                    .setTooltip('点击此处清除固定文件')
                    .setButtonText('点击清除固定文件')
                    .onClick(async () => {
                        lsh.removeFromLocalStorage({ key: this.plugin.keys.pinnedFilesKey });
                        this.plugin.refreshTreeLeafs();
                        new Notice('固定文件已清除...');
                    });
            });
    }
}
