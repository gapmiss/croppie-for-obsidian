<script>
  import Gallery from './svelte-image-gallery.svelte'
  const app = this.app;
  const plugin = app.plugins.plugins['croppie'];
  const servePath = plugin.settings.inputFolder;
  const folder = app.vault.getAbstractFileByPath(servePath);
  const imageFormats = [
    "gif",
    "jpg",
    "jpeg",
    "png",
    "webp",
  ];

  if (!folder) {
    new Notice(
      createFragment((frag) => {
        frag.appendText("❗ ERROR ❗\n'"+servePath+"'");
        frag.appendText(" is not a valid folder in the Croppie plugin settings.");
      }),
      0
    );
  }

  function handleClick(e) {
    let el = window.document.querySelector('#'+e.detail.id);
    plugin.activateView(e.detail.alt);
    plugin.settings.imagePath = plugin.settings.inputFolder+'/'+e.detail.alt;
  }

  let initWidth = (Gallery.maxColumnWidth !== undefined) ? Gallery.maxColumnWidth : 200;
</script>

{#if folder.children && folder.children.length > 0}

  <div id="gallery-tools">
    <label id="gallery-slider-label" for="gallery-slider">
      <button on:click={(target) => {
        if (initWidth > 100) {
          Gallery.maxColumnWidth = (initWidth-50);
          initWidth = Gallery.maxColumnWidth;
        }
      }}>-</button>
      <input type="range" bind:value={initWidth} min="100" step="25" max="500" id="gallery-slider" />
      <button on:click={(target) => {
        if (initWidth !== 1000) {
          Gallery.maxColumnWidth = (initWidth+50);
          initWidth = Gallery.maxColumnWidth;
        }
      }}>+</button>
    </label>
  </div>

  <Gallery gap="15" maxColumnWidth="{initWidth}" on:click={handleClick}>
    {#each folder.children as img, i}
      {#if imageFormats.includes(img.extension)}
        <img src="http://127.0.0.1:{plugin.settings.serverPort}/{img.name}" alt="{img.name}" id="gallery-img-{i}" class="gallery-img" label="{img.name}">
      {/if}
    {/each}
  </Gallery>

{:else}

  <div class="gallery-noimgs">
    No images found in the <code style="color:var(--color-red)">{servePath}</code> folder.
    <br><br>
    The folder path (<code style="color:var(--color-red)">{servePath}</code>) is defined in the Croppie plugin settings.
  </div>

{/if}
