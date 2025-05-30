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

        containerEl.createEl('h2', { text: '常规' });

        new Setting(containerEl)
            .setName('Evernote View')
            .setDesc('如果你想在一个视图中同时看到文件夹和文件，而无需在视图之间切换，请开启此选项。体验类似 Evernote。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('Disabled', 'Disabled')
                    .addOption('Horizontal', 'Horizontal')
                    .addOption('Vertical', 'Vertical')
                    .setValue(this.plugin.settings.evernoteView)
                    .onChange((value: EvernoteViewOption) => {
                        this.plugin.settings.evernoteView = value;
                        this.plugin.saveSettings();
                        this.refreshView();
                    });
            });

        new Setting(containerEl)
            .setName('Ribbon Icon')
            .setDesc('如果你想要用于激活文件树的侧边栏图标，请开启此选项。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.ribbonIcon).onChange((value) => {
                    this.plugin.settings.ribbonIcon = value;
                    this.plugin.saveSettings();
                    this.plugin.refreshIconRibbon();
                })
            );

        new Setting(containerEl)
            .setName('Open on Start')
            .setDesc('如果你不希望在启动库时自动打开文件树视图，请关闭此选项。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.openViewOnStart).onChange((value) => {
                    this.plugin.settings.openViewOnStart = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Bookmarks Event Listener (Shift + Click)')
            .setDesc('启用后，可以通过 Shift+点击核心书签插件中的书签名称来在文件树中定位文件或文件夹。由于目前没有 API 可以覆盖书签插件的默认行为，此选项会添加事件监听以实现该功能。')
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
            .setName('Folder Icons')
            .setDesc('更改默认文件夹图标为你喜欢的样式。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('default', 'Default')
                    .addOption('box-folder', 'Box Icons')
                    .addOption('icomoon', 'IcoMoon Icons')
                    .addOption('typicon', 'Typicons')
                    .addOption('circle-gg', 'Circle GG')
                    .setValue(this.plugin.settings.folderIcon)
                    .onChange((value: FolderIcon) => {
                        this.plugin.settings.folderIcon = value;
                        this.plugin.saveSettings();
                        this.refreshView();
                    });
            });

        new Setting(containerEl)
            .setName('Show Root Folder')
            .setDesc(`如果你希望在文件树中显示根文件夹“${this.plugin.app.vault.getName()}”，请开启此选项。`)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showRootFolder).onChange((value) => {
                    this.plugin.settings.showRootFolder = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('Folder Count')
            .setDesc('开启后可在文件树下看到笔记/文件数量。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.folderCount).onChange((value) => {
                    this.plugin.settings.folderCount = value;
                    this.plugin.saveSettings();
                    this.plugin.refreshTreeLeafs();
                })
            );

        new Setting(containerEl)
            .setName('Folder Count Details')
            .setDesc('选择你希望计数时包含哪些文件。')
            .addDropdown((dropdown) => {
                dropdown.addOption('notes', 'Notes');
                dropdown.addOption('files', 'All Files');
                dropdown.setValue(this.plugin.settings.folderCountOption);
                dropdown.onChange((option) => {
                    this.plugin.settings.folderCountOption = option;
                    this.plugin.saveSettings();
                    this.refreshView();
                });
            });

        new Setting(containerEl)
            .setName('Folder Note')
            .setDesc('开启后可像 Folder Note 插件一样为文件夹创建笔记。默认点击会打开文件列表，需使用“Shift+点击”打开文件夹笔记。如果文件夹有笔记，右侧会显示箭头图标。作为文件夹笔记创建的笔记会在文件列表中隐藏。')
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
            .setName('Include Files From Subfolders to the File List')
            .setDesc('开启后，文件列表中会显示所选文件夹下所有子文件夹的文件。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showFilesFromSubFolders).onChange((value) => {
                    this.plugin.settings.showFilesFromSubFolders = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('Toggle Button for Include Files from Subfolders')
            .setDesc('开启后，文件列表顶部会有一个按钮用于切换“包含子文件夹文件”选项。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showFilesFromSubFoldersButton).onChange((value) => {
                    this.plugin.settings.showFilesFromSubFoldersButton = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('Reveal Active File in File Tree Button')
            .setDesc('开启后，会有一个按钮用于在文件树中定位当前激活的文件，并相应设置文件夹和文件面板。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.revealActiveFileButton).onChange((value) => {
                    this.plugin.settings.revealActiveFileButton = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('Search in File List')
            .setDesc('开启后，可通过文件名筛选文件列表。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.searchFunction).onChange((value) => {
                    this.plugin.settings.searchFunction = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('All & Tag Search only in Focused Folder')
            .setDesc('“all:” 和 “tag:” 搜索默认会在整个库中查找。开启后仅在当前聚焦文件夹中搜索。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.allSearchOnlyInFocusedFolder).onChange((value) => {
                    this.plugin.settings.allSearchOnlyInFocusedFolder = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Icon Before File Name')
            .setDesc('开启后，文件列表中的文件名前会显示图标。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.iconBeforeFileName).onChange((value) => {
                    this.plugin.settings.iconBeforeFileName = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('Preview File on Hover')
            .setDesc('开启后，按住 Ctrl/Cmd 并悬停在文件上可预览文件内容。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.filePreviewOnHover).onChange((value) => {
                    this.plugin.settings.filePreviewOnHover = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Fixed Buttons and Header in File Pane')
            .setDesc('开启后，文件列表中的按钮和标题不会随内容滚动。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.fixedHeaderInFileList).onChange((value) => {
                    this.plugin.settings.fixedHeaderInFileList = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                })
            );

        new Setting(containerEl)
            .setName('Show file names as full path')
            .setDesc('开启后，文件名列表中会显示完整路径而不仅仅是文件名。')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.showFileNameAsFullPath).onChange((value) => {
                    this.plugin.settings.showFileNameAsFullPath = value;
                    this.plugin.saveSettings();
                    this.refreshView();
                });
            });

        new Setting(containerEl)
            .setName('Deleted File Destination')
            .setDesc('选择删除文件后文件的去向。')
            .addDropdown((dropdown) => {
                dropdown.addOption('permanent', 'Delete Permanently');
                dropdown.addOption('trash', 'Move to Obsidian Trash');
                dropdown.addOption('system-trash', 'Move to System Trash');
                dropdown.setValue(this.plugin.settings.deleteFileOption);
                dropdown.onChange((option: DeleteFileOption) => {
                    this.plugin.settings.deleteFileOption = option;
                    this.plugin.saveSettings();
                });
            });

        /* ------------- Exclusion Settings ------------- */
        containerEl.createEl('h2', { text: '文件创建' });

        containerEl.createEl('p', { text: '以下设置仅在插件文件面板中使用加号（+）按钮创建文件时生效。' });

        new Setting(containerEl)
            .setName('Created information in YAML')
            .setDesc('开启后，插件会在新建文件的 YAML 区块中添加创建时间。')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.createdYaml).onChange((value) => {
                    this.plugin.settings.createdYaml = value;
                    this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('Set File Name as Header 1')
            .setDesc('开启后，插件会将初始文件名作为主标题添加到新建文件中。')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.fileNameIsHeader).onChange((value) => {
                    this.plugin.settings.fileNameIsHeader = value;
                    this.plugin.saveSettings();
                });
            });

        /* ------------- Exclusion Settings ------------- */

        containerEl.createEl('h2', { text: '排除设置' });

        new Setting(containerEl)
            .setName('Hide Attachments')
            .setDesc('开启后，“attachments”文件夹及其下所有文件将不会在视图和文件列表中显示。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.hideAttachments).onChange((value) => {
                    this.plugin.settings.hideAttachments = value;
                    this.plugin.saveSettings();
                    this.plugin.refreshTreeLeafs();
                })
            );

        new Setting(containerEl)
            .setName('Excluded File Extensions')
            .setDesc('输入你想在文件树中排除的文件扩展名，用逗号分隔。例如：png, pdf, jpeg。更改后需重载库或点击下方“重载文件树”按钮生效。')
            .addTextArea((text) =>
                text.setValue(this.plugin.settings.excludedExtensions).onChange((value) => {
                    this.plugin.settings.excludedExtensions = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Excluded Folder Paths')
            .setDesc('输入你想在文件树中排除的文件夹完整路径，用逗号分隔。例如：Personal/Attachments, Work/Documents/Folders。所有子文件夹也会被排除。更改后需重载库或点击下方“重载文件树”按钮生效。')
            .addTextArea((text) =>
                text.setValue(this.plugin.settings.excludedFolders).onChange((value) => {
                    this.plugin.settings.excludedFolders = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setDesc('使用此按钮可重载文件树。部分设置更改后需要重载文件树才能生效。你也可以重启库以达到同样效果。')
            .addButton((button) => {
                button
                    .setClass('reload-file-tree-button')
                    .setTooltip('Click here to reload the file tree')
                    .setButtonText('重载文件树')
                    .onClick((e) => {
                        this.plugin.refreshTreeLeafs();
                    });
            });

        /* ------------- Clear Data ------------- */
        containerEl.createEl('h2', { text: '清除数据' });

        new Setting(containerEl)
            .setName('清除所有缓存数据')
            .setDesc('此按钮将清除以下缓存数据：“分割线最后位置”、“文件夹面板已展开文件夹列表”、“最后激活的文件夹路径”。不会影响上方设置和已固定文件列表。建议定期清理缓存。')
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
            .setName('清除已固定文件')
            .setDesc('此按钮将清除文件列表面板中的已固定文件。')
            .addButton((button) => {
                let b = button
                    .setTooltip('点击此处清除已固定文件')
                    .setButtonText('点击清除已固定文件')
                    .onClick(async () => {
                        lsh.removeFromLocalStorage({ key: this.plugin.keys.pinnedFilesKey });
                        this.plugin.refreshTreeLeafs();
                        new Notice('已固定文件已清除...');
                    });
            });
    }
}
