import { App, PluginSettingTab, Setting, debounce, Notice } from 'obsidian';
import CroppiePlugin from '../main';
import { VIEW_TYPE_CROPPER } from "../views/croppie";
import { VIEW_TYPE_GALLERY } from "../views/gallery";
import { FolderSuggest } from "./FolderSuggester";

export class CroppiePluginSettingTab extends PluginSettingTab {
  plugin: CroppiePlugin;

  constructor(app: App, plugin: CroppiePlugin) {
      super(app, plugin);
      this.plugin = plugin;
  }

  display(): void {
    let debounceNotice = debounce(
      () => {
        new Notice("Port must be a number between 1-65535");
      },
      250
    );
    let { containerEl } = this;
    containerEl.addClass("croppie-settings-tab");
    containerEl.empty();

    new Setting(containerEl)
    .setName(this.plugin.manifest.name)
    .setDesc("(v" + this.plugin.manifest.version + ") Click \"Apply\" button below to save settings and restart the image server.")
    .setClass("setting-item-heading")
    .addExtraButton((component) => {
      component
      .setIcon("refresh-cw")
      .setTooltip("Reload plugin")
      .onClick(async () => {
        await this.plugin.reload();
        new Notice(`[${this.plugin.manifest.name} v${this.plugin.manifest.version}] reloaded`);
      });
      component.extraSettingsEl.classList.add("mod-warning");
    })
    .then(cb => {
      cb.settingEl.classList.add("setting-head");
    });

    new Setting(containerEl)
      .setName('Port')
      .setDesc('Port # for the image server.')
      // .setDesc('Click "Apply" button to restart server with new port number.')
      .addText(text =>
      text
      .setPlaceholder('e.g. 1337')
      .setValue(this.plugin.settings.serverPort)
      .onChange(async newPort => {
        if (!Number(newPort) || !( Number(newPort) >=1 && Number(newPort) < 65536)) {
          debounceNotice();
          text.setValue(this.plugin.settings.serverPort);
          return;
        }
        this.plugin.settings.serverPort = newPort;
      })
    );

    new Setting(containerEl)
    .setName('Input folder')
    .setDesc('The vault folder for serving images.')
    .addSearch((cb) => {
      new FolderSuggest(cb.inputEl);
      cb
      .setPlaceholder("e.g. folder")
      .setValue(this.plugin.settings.inputFolder)
      .onChange(async (newPath) => {
        this.plugin.settings.inputFolder = newPath;
        await this.plugin.saveSettings();
      });
    });

    new Setting(containerEl)
    .setName('Output folder')
    .setDesc('The vault folder for saving images.')
    .addSearch((cb) => {
      new FolderSuggest(cb.inputEl);
      cb
      .setPlaceholder("e.g. folder/topic")
      .setValue(this.plugin.settings.outputFolder)
      .onChange(async (newoutputFolder) => {
        this.plugin.settings.outputFolder = newoutputFolder;
        await this.plugin.saveSettings();
      });
    });
    /*/
    new Setting(containerEl)
    .setName('Thumbnails')
    .setDesc('Show thumbnails in the image suggester.')
    .addToggle(toggle =>
      toggle
      .setValue(this.plugin.settings.showThumbs)
      .onChange(async newValue => {
        this.plugin.settings.showThumbs = newValue;
      })
    );
    /**/
		new Setting(containerEl)
		.setName('Random I.D.')
		.setDesc('Append image filename with a random I.D. for rapid cropping of different sizes. Prevents image files from being over-written in the output folder.')
		.addToggle(toggle =>
			toggle
			.setValue(this.plugin.settings.randomID)
			.onChange(async newValue => {
				this.plugin.settings.randomID = newValue;
				await this.plugin.saveSettings();
			})
		);
    new Setting(containerEl)
    .setName('Apply new settings and restart image server')
    .addButton(button =>
      button.setButtonText('Apply').onClick(async () => {
        await this.plugin.saveSettings();
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CROPPER);
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_GALLERY);
        this.plugin.restartServers();
        new Notice('Settings saved', 3000);
      })
    );
  }
  
}
