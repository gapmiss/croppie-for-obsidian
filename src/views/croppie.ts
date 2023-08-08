import { ItemView, Menu, WorkspaceLeaf, FileSystemAdapter } from 'obsidian';
import CroppiePlugin from "../main";
// @ts-ignore
import Component from "../components/croppie.svelte";

export const VIEW_TYPE_CROPPER = "cropper-view";

export class CropperView extends ItemView {

  plugin: CroppiePlugin;
  component: Component;

  constructor(leaf: WorkspaceLeaf, plugin: CroppiePlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_CROPPER;
  }

  getDisplayText() {
    let OBSIDIAN_BASE_PATH = (app.vault.adapter as FileSystemAdapter).getBasePath();
    return "Crop "+this.plugin.settings.imagePath.replace(OBSIDIAN_BASE_PATH+"/assets/", "");
  }

  async onOpen() {
    this.contentEl.empty();
    this.component = new Component({
      target: this.contentEl,
      props: this.plugin.params
    });
  }

  async onClose() {
    this.component.$destroy();
  }

  getIcon(): string {
    return "crop";
  }

  onPaneMenu(menu: Menu, source: string): void {
    super.onPaneMenu(menu, source)
    let bttnSave = window.document.querySelector('.cr-save');
    if (!bttnSave) {
      return;
    }
    menu
    .addItem((item) => {
        item.setTitle('Croppie: save image')
        item.setIcon('save')
        item.onClick(() => {
          if (source == 'more-options') {
            bttnSave?.dispatchEvent(new MouseEvent('click'));
          }
        })
    })
    .addItem((item) => {
        item.setTitle('Croppie: download image')
        item.setIcon('download')
        item.onClick(() => {
          if (source == 'more-options') {
            let bttnDownload = window.document.querySelector('.cr-download');
            bttnDownload?.dispatchEvent(new MouseEvent('click'));
          }
        })
    })
  }

}
