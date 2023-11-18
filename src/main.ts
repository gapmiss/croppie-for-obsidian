import { Plugin, Notice, TFile, DataAdapter, PluginManifest } from 'obsidian';
import { CroppiePluginSettingTab } from './settings';
import { ImageSelectModal, imageFormats } from "./modals/image-select-modal";
import staticServer, { StaticServer } from './server';
import { CropperView, VIEW_TYPE_CROPPER } from "./views/croppie";
import { GalleryView, VIEW_TYPE_GALLERY } from "./views/gallery";
import { createWorker } from 'tesseract.js';

interface CroppiePluginSettings {
  inputFolder: string;
  serverPort: string;
  imagePath: string;
  outputFolder: string;
  // showThumbs: boolean;
  randomID: boolean;
  croppedImage: string;
}

const DEFAULT_SETTINGS: CroppiePluginSettings = {
  inputFolder: "assets/input",
  serverPort: "1337",
  imagePath: "",
  outputFolder: "assets/output",
  // showThumbs: false,
  randomID: true,
  croppedImage: "",
}

export default class CroppiePlugin extends Plugin {
  settings: CroppiePluginSettings;
  webservers: StaticServer[];
  params: any;
  imagePath: any;
  outputFolder: any;
  // showThumbs: boolean;
  randomID: boolean;
  adapter: DataAdapter = app.vault.adapter;
  d: any = new Date();
  croppedImage: any;
  state: string = 'initial';
  manifest: PluginManifest;

  async onload() {
    this.webservers = [];
    this.state = "loading";

    this.addCommand({
      id: "open-croppie-modal",
      name: "Crop an image",
      callback: async () => {
        new ImageSelectModal(this).open();
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        const f = app.vault.getAbstractFileByPath(file.path);
        if (f instanceof TFile) {
          if (imageFormats.includes(f.extension) && f.path.includes(this.settings.inputFolder)) {
            menu.addItem((item) => {
              item
                .setTitle("Croppie: OCR this image")
                .setIcon("text-select")
                .onClick(async () => {
                  new Notice('OCR starting…', 2000);
                  this.ocrImage('http://127.0.0.1:'+this.settings.serverPort+'/'+f.path.replace(this.settings.inputFolder+"/", ""), f.name, f.basename, f.path);
                });
            });
          }
          if (!imageFormats.includes(f.extension) || f.path !== this.settings.inputFolder+'/'+file.name) {
            return;
          }
          menu.addItem((item) => {
            item
              .setTitle("Croppie: crop this image")
              .setIcon("crop")
              .onClick(async () => {
                this.activateView(f.name);
                this.settings.imagePath = f.path;
                return f.name;		
              });
          });
        }
      })
    );

    await this.loadSettings();
    await this.restartServers();
    this.addSettingTab(new CroppiePluginSettingTab(this.app, this));

    this.registerView(
      VIEW_TYPE_CROPPER,
      (leaf) => new CropperView(leaf, this)
    );

    this.registerView(
      VIEW_TYPE_GALLERY,
      (leaf) => new GalleryView(leaf, this)
    );
    
    const ribbonIconEl = this.addRibbonIcon('crop', 'Crop an image', (evt: MouseEvent) => {
      new ImageSelectModal(this).open();
    });
    ribbonIconEl.addClass('cropper-ribbon-class');

    const ribbonGalleryIconEl = this.addRibbonIcon('image', 'Croppie image gallery', (evt: MouseEvent) => {
      this.activateGalleryView("");
    });
    ribbonGalleryIconEl.addClass('gallery-ribbon-class');

    this.state = "loaded";
    console.log("["+this.manifest.name, "v"+this.manifest.version+"]", this.state );
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CROPPER);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_GALLERY);
    await this.shutDownServers();
    this.state = "unloaded"
    console.log("["+this.manifest.name, "v"+this.manifest.version+"]", this.state );
  }

  async restartServers() {
    await this.shutDownServers();
    const ws = staticServer(this.settings.inputFolder, this.settings.serverPort, this);
    ws.listen();
    this.webservers.push(ws);
  }

  async shutDownServers() {
    this.webservers.forEach(s => s.close());
    this.webservers = [];
  }

  async ocrImage(croppedImageToOCR:string, fileName:string, baseName:string, filePath:string) {

    const worker = await createWorker({
      // logger: m => console.log(m)
    });

    (async () => {
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(croppedImageToOCR);
      const newFile = await this.app.vault.create(
        this.settings.outputFolder+'/'+baseName + (this.settings.randomID) ? '-' + await this.makeid(8) : '' + ".md",
        await this.createText(
          fileName,
          text
        )
      );
      await worker.terminate();
      new Notice('OCR complete, '+this.settings.outputFolder+'/'+baseName + '.md created.');
      const leaf = this.app.workspace.getLeaf('tab');
      const state = leaf.getViewState();
      if (state.type === 'empty') {
          leaf.openFile(newFile);
      }
      else {
          const newLeaf = this.app.workspace.createLeafBySplit(leaf);
          newLeaf.openFile(newFile);
      }
    })();

  }

  async makeid(length:number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  async createText(
    fileName?: string,
    fileContent?: string
  ): Promise<string> {	
    let text = "---\nimage: "+fileName+"\ntags: ocr\ncreated: "+this.d.toISOString()+"\n---\n\n```ocr\n"+fileContent+"\n```\n\n![["+fileName+"]]";
    return text;
  }

  async activateView(params:any): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CROPPER);

    await this.app.workspace.getLeaf(true).setViewState({
      type: VIEW_TYPE_CROPPER,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_CROPPER)[0]
    );
  }

  async activateGalleryView(params:any): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_GALLERY);

    await this.app.workspace.getLeaf(true).setViewState({
      type: VIEW_TYPE_GALLERY,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_GALLERY)[0]
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * https://github.com/eoureo/obsidian-runjs/blob/master/src/main.ts#L1394
   */
  async reload() {
    this.state = "start reloading";
    console.log("["+this.manifest.name, "v"+this.manifest.version+"]", this.state );
    let manifest_id = this.manifest.id;
    // @ts-ignore
    if (this.app.plugins.enabledPlugins.has(manifest_id)) {
      this.state = "disable";
      // @ts-ignore
      await this.app.plugins.disablePlugin(manifest_id);

      window.setTimeout(async () => {
        // @ts-ignore
        this.app.plugins.enablePlugin(manifest_id);

        for (let i = 0; i < 100; i++) {
          // @ts-ignore
          let state = this.app.plugins.plugins[manifest_id]?.state;
          if (state == "loaded") {
            window.setTimeout(() => {
              // @ts-ignore
              this.app.setting.openTabById(manifest_id);
            }, 100);
            break;
          }
          await sleep(500);
        }
      }, 100);
    }
  }

  sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
