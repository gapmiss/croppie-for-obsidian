import { html } from "common-tags";
import CroppiePlugin from "src/main";
import {
  FileSystemAdapter,
  FuzzyMatch,
  FuzzySuggestModal,
  Notice,
  TFile,
  TFolder,
  Vault,
} from "obsidian";

export const imageFormats = [
  "gif",
  "jpg",
  "jpeg",
  "png",
  "webp",
];

export class ImageSelectModal extends FuzzySuggestModal<TFile> {
  plugin: CroppiePlugin;
  vault: Vault;
  targetFile: TFile;
  adapter: FileSystemAdapter;
  showPreviewInLocalModal: boolean;

  constructor(plugin: CroppiePlugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.vault = plugin.app.vault;
    this.adapter = plugin.app.vault.adapter as FileSystemAdapter;
    this.containerEl.addClass("attachment-local-image-modal");
    this.limit = 100;
    this.setPlaceholder("Select an image to crop.");
    this.showPreviewInLocalModal = true;
    this.emptyStateText = 'No images found in the "'+this.plugin.settings.inputFolder+'" folder';
  }

  getItems(): TFile[] {
    const servePath = this.plugin.settings.inputFolder;
    const folder = this.vault.getAbstractFileByPath(servePath);
    if (!folder || !(folder instanceof TFolder)) {
      new Notice(
        createFragment((frag) => {
          frag.appendText("❗ ERROR ❗\n'"+servePath+"'");
          frag.appendText(" is not a valid folder in the Croppie plugin settings.");
        }),
        0
      );
      this.close();
      return [];
    }
    return this.getImagesInFolder(folder);
  }

  getItemText(item: TFile): string {
    return item.name	;
  }

  renderSuggestion(match: FuzzyMatch<TFile>, el: HTMLElement) {
    super.renderSuggestion(match, el);
    /*/
    if (this.plugin.settings.showThumbs) {
      const content = el.innerHTML;
      el.addClass("attachment-suggestion-item");
      el.innerHTML = html`
        <p class="suggestion-text">${content}</p>
        <div class="suggestion-image-wrapper">
          <img src="${this.vault.getResourcePath(match.item)}" />
        </div>
      `;
    }
    /**/
  }

  async onChooseItem(image: TFile) {
    const path = this.adapter.getFullPath(image.path);
    if (path) {
      this.plugin.activateView(path);
      this.plugin.settings.imagePath = path;
      return path;
    } else {
      new Notice("Invalid file path.")
      console.log(`Invalid file path: ${path}`);
    }
  }

  private getImagesInFolder(folder: TFolder): TFile[] {
    const files: TFile[] = [];
    folder.children.forEach((abFile) => {
      const file = abFile as TFile;
      if (imageFormats.includes(file.extension)) {
        files.push(file);
      }
    });
    return files;
  }

}
