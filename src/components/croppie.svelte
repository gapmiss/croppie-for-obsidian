<div id="croppie-wrapper"></div>

<img src="{DEFAULT_IMAGE_SRC}" style="display:none;" alt>

<script>
  import { Notice } from "obsidian";
  const Croppie = require('../lib/croppie.js');
  const fs = require('fs');
  const app = this.app;
  const plugin = app.plugins.plugins['croppie'];

  let vaultPath = app.vault.adapter.basePath;
  let servePort = plugin.settings.serverPort;
  let serveFolder = plugin.settings.inputFolder;
  let selectedImage = plugin.settings.imagePath;
  let savePath = plugin.settings.outputFolder;

  let filePath = selectedImage.replace(vaultPath+"/", "");
  let servePath = filePath.replace(serveFolder+"/", "");

  const DEFAULT_IMAGE_SRC = "http://127.0.0.1:"+servePort+"/"+servePath;
  
  async function readMarkdownFile(file) {
      return app.vault.adapter.read(file);
  }
  
  const checkElement = async selector => {
    while ( document.querySelector(selector) === null) {
      await new Promise( resolve =>  requestAnimationFrame(resolve) )
    }
    return document.querySelector(selector);
  };

  const imgFile = app.vault.getAbstractFileByPath(filePath);
  let ext = imgFile.extension;

  plugin.settings.croppedImage = imgFile.basename+"-"+makeid(8)+"."+ext;

  const Run = (function() {

    function imageResizer() {
      let croppieWrapperEl = window.document.getElementById('croppie-wrapper');

      const resize = new Croppie(croppieWrapperEl, {
          viewport: { width: 500, height: 500 },
          boundary: { width: 700, height: 700 },
          showZoomer: true,
          enableResize: true,
          enableOrientation: true,
          mouseWheelZoom: 'ctrl'
      });
      resize.bind({
            url: DEFAULT_IMAGE_SRC,
            zoom: 0
      });
      croppieWrapperEl.addEventListener('update', function (ev) {
        let spanDimensions = window.document.querySelector('.cr-dimensions');
        if (spanDimensions) {
          spanDimensions.textContent = (ev.detail.points[2]-ev.detail.points[0])+' x '+(ev.detail.points[3]-ev.detail.points[1]);
        }
      });

      window.document.querySelector('.cr-save').addEventListener('click', function (ev) {
        resize.result({
          type: 'base64',
          size: 'original',
          format: ext
        }).then( async (blob) => {
          var data = decodeBase64Image(blob);
          saveFile(data.data, imgFile.basename+"-"+makeid(8)+"."+ext);
        });
      });

      window.document.querySelector('.cr-download').addEventListener('click', function (ev) {
        resize.result({
          type: 'base64',
          size: 'original',
          format: ext
        }).then(function (blob) {
          new Notice('Preparing download…', 1000);
          var data =  decodeBase64Image(blob);
          downloadFile(data.data, imgFile.basename+"-"+makeid(8)+"."+ext);
        });
      });

    }

    async function downloadFile(data, fileName, type="text/plain") {
      const a = window.document.createElement("a");
      a.style.display = "none";
      window.document.body.appendChild(a);
      a.href = window.URL.createObjectURL(
        new Blob([data], { type })
      );
      a.setAttribute("download", fileName);
      a.click();
      window.URL.revokeObjectURL(a.href);
      window.document.body.removeChild(a);
      return;
    }

    function decodeBase64Image(dataString) {
      var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};
      if (matches.length !== 3) {
        return new Error('Invalid input string');
      }
      response.type = matches[1];
      response.data = new Buffer.from(matches[2], 'base64');
      return response;
    }

    function saveFile(data, fileName) {
      const fullPath = vaultPath + '/'+savePath+'/';
      if (!fs.existsSync(fullPath)) {
        new Notice("❗ ERROR ❗\n'"+savePath+"' is not a valid folder in the Croppie plugin settings.", 0);
        return false;
      }
      fs.open(`${fullPath}${fileName}`, 'wx', (err, desc) => {
        if(err) {
          console.log(err);
          new Notice(err, 0);
          return false;
        }
        if(!err && desc) {
          fs.writeFile(desc, data, (err) => {
            if (err) {
              new Notice(err, 0);
              throw err;
            }
            new Notice("'"+fileName+"' saved", 3000);
            return fileName;
          })
        }
      })
    }

    function init() {
      imageResizer();
    }

    return {
      init: init
    };


  })();

  checkElement('#croppie-wrapper').then(() => {
    Run.init();
  });

  function makeid(length) {
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
</script>
