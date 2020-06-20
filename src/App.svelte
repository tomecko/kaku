<script>
  import "dmak";
  import cx from "classnames";
  import { pickBy } from "lodash-es";

  import WaniKani from "./services/wanikani";
  import { shuffleArray } from "./helpers/shuffleArray";

  const WANIKANI_API_KEY = "waniKaniAPIKey";

  let items = {};
  let itemsPromise = null;
  let currentItemIndex = 0;
  let revealed = false;
  let waniKaniAPIKey = localStorage.getItem(WANIKANI_API_KEY) || "";
  let startTime = null;
  let timeElapsed = 0;

  $: itemKeys = shuffleArray(Object.keys(items));
  $: currentItem = items[itemKeys[currentItemIndex]];
  $: currentItemIndexInc = currentItemIndex + 1;

  $: if (currentItem && revealed) {
    drawKanji();
  }

  function goToNext() {
    if (!revealed) {
      revealed = true;
      return;
    }
    currentItemIndex = currentItemIndex + 1;
    revealed = false;
  }
  function goToPrevious() {
    currentItemIndex = Math.max(0, currentItemIndex - 1);
    revealed = true;
  }
  function revealOrRedraw() {
    if (revealed) {
      drawKanji();
    } else {
      revealed = true;
    }
  }
  function getWaniKaniData() {
    if (!waniKaniAPIKey) {
      return;
    }
    localStorage.setItem(WANIKANI_API_KEY, waniKaniAPIKey);
    const waniKani = new WaniKani(waniKaniAPIKey);
    itemsPromise = waniKani.getKanjiInfos().then(data => {
      items = pickBy(data, val => val.stage === "Burned");
      currentItemIndex = 0;
      revealed = false;
      startTime = Date.now();
      setInterval(() => {
        timeElapsed = Math.floor((Date.now() - startTime) / (1000 * 60));
      }, 1000);
    });
  }
  function drawKanji() {
    const el = "kanji-animated";
    const $el = document.getElementById(el);
    if ($el) {
      $el.innerHTML = "";
    }
    new Dmak(currentItem.kanji, {
      element: el,
      uri: "kanjivg/",
      width: 300,
      height: 300,
      step: 0.02,
      stroke: {
        attr: {
          active: "#64de64"
        },
        order: {
          attr: {
            fill: "#aaa",
            "font-size": 6
          },
          visible: true
        }
      }
    });
  }
  function handleKeydown(event) {
    switch (event.code) {
      case "KeyD":
      case "Space":
      case "ArrowRight":
        event.preventDefault();
        goToNext();
        break;
      case "KeyS":
      case "ArrowDown":
        event.preventDefault();
        revealOrRedraw();
        break;
      case "KeyA":
      case "ArrowLeft":
        goToPrevious();
        break;
    }
  }
</script>

<style>
  :global(html, body) {
    margin: 0;
  }

  .main-container {
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .reading,
  .meaning {
    border: 1px solid #333;
    display: inline-block;
    margin-bottom: 0.5rem;
    margin-right: 0.5rem;
    padding: 0.5rem;
  }

  .reading {
    background: #222;
  }

  .meaning-primary,
  .reading-primary {
    border-color: #777;
    font-weight: bold;
  }

  #kanji-animated {
    height: 300px;
    width: 300px;
    margin: 20px;
  }

  .iframe-wrapper {
    position: absolute;
    top: -120px;
    right: 0;
    bottom: 0;
    width: 750px;
    overflow: hidden;
    filter: invert(100%);
  }

  iframe {
    transform: scale(0.9);
    transform-origin: top right;
    width: 100%;
    height: calc(111vh + 125px);
  }
</style>

<svelte:window on:keydown={handleKeydown} />
<svelte:head>
  <script src="raphael/raphael.min.js">

  </script>
</svelte:head>
<main class="main-container">
  {#if !currentItem}
    <section>
      <input bind:value={waniKaniAPIKey} type="text" placeholder="APIv2 Key" />
      <button on:click={getWaniKaniData}>ダウンロードする</button>
    </section>
  {/if}
  {#await itemsPromise}
    <p>ローディング。。。</p>
  {:then}
    {#if currentItem}
      <p>{timeElapsed}分</p>
      <p>{currentItemIndexInc})</p>
      <p>
        {#each currentItem.readings as { primary, reading }}
          <span class={cx('reading', { 'reading-primary': primary })}>
            {reading}
          </span>
        {/each}
        {#each currentItem.meanings as { meaning, primary }}
          <span class={cx('meaning', { 'meaning-primary': primary })}>
            {meaning}
          </span>
        {/each}
      </p>
      {#if revealed}
        <div id="kanji-animated" on:click={drawKanji} />
        <div class="iframe-wrapper">
          <iframe
            src={`https://jisho.org/search/*${currentItem.kanji}*`}
            title="" />
        </div>
      {/if}
    {/if}
  {/await}
</main>
