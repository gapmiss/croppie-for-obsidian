<script>
    // https://madewithsvelte.com/svelte-image-gallery
    import { onMount, createEventDispatcher } from "svelte";
    import { tick } from "svelte";

    export let gap = 10;
    export let maxColumnWidth = 250;
    export let hover = false;
    export let loading;

    const dispatch = createEventDispatcher();

    let slotHolder = null;
    let columns = [];
    let galleryWidth = 0;
    let columnCount = 0;

    $: columnCount = parseInt(galleryWidth / maxColumnWidth) || 1;
    $: columnCount && Draw();
    $: galleryStyle = `grid-template-columns: repeat(${columnCount}, 1fr); --gap: ${gap}px`;

    onMount(Draw);

    function HandleClick(e) {
      dispatch("click", { src: e.target.src, alt: e.target.alt, id: e.target.id, loading: e.target.loading, class: e.target.className });
    }

    async function Draw() {
      await tick();

      if (!slotHolder) {
        return;
      }

      const images = Array.from(slotHolder.childNodes).filter(
        (child) => child.tagName === "IMG"
      );
      columns = [];

      // Fill the columns with image URLs
      for (let i = 0; i < images.length; i++) {
        const idx = i % columnCount;
        columns[idx] = [
          ...(columns[idx] || []),
          { src: images[i].src, alt: images[i].alt, id: images[i].id, class: images[i].className },
        ];
      }
    }
</script>

<div
    id="slotHolder"
    bind:this={slotHolder}
    on:DOMNodeInserted={Draw}
    on:DOMNodeRemoved={Draw}
>
    <slot />
</div>

{#if columns}
  <div id="gallery" bind:clientWidth={galleryWidth} style={galleryStyle}>
    {#each columns as column}
      <div class="column">
        {#each column as img}
          <img
            src={img.src}
            alt={img.alt}
            on:click={HandleClick}
            on:keyup={HandleClick}
            class="{hover === true ? "img-hover " : ""}{img.class}"
            loading={loading}
            id={img.id}
            aria-label="Click to crop {img.alt}"
            data-tooltip-position="top"
          />
        {/each}
      </div>
    {/each}
  </div>
{/if}

<style>
  #slotHolder {
    display: none;
  }
  #gallery {
    width: 100%;
    display: grid;
    gap: var(--gap);
    height: 100vh;
  }
  #gallery .column {
    display: flex;
    flex-direction: column;
  }
  #gallery .column * {
    width: 100%;
    margin-top: var(--gap);
  }
  #gallery .column *:nth-child(1) {
    margin-top: 0;
  }
  img.gallery-img { opacity: .9; transition: all .2s;border-radius: 8px; }
  img.gallery-img:hover { opacity: 1; transform: scale(1.03); cursor: pointer; }
</style>
