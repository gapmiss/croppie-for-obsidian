import { ItemView, WorkspaceLeaf, FileSystemAdapter } from 'obsidian';
import CroppiePlugin from "../main";
// @ts-ignore
import Component from "../components/gallery.svelte";

export const VIEW_TYPE_GALLERY = "gallery-view";

export class GalleryView extends ItemView {

  plugin: CroppiePlugin;
  component: Component;

  constructor(leaf: WorkspaceLeaf, plugin: CroppiePlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_GALLERY;
  }

  getDisplayText() {
    let OBSIDIAN_BASE_PATH = (app.vault.adapter as FileSystemAdapter).getBasePath();
    return "Croppie gallery";
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
    return "image";
  }

}
