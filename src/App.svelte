<script>
  import "dmak";
  import cx from "classnames";
  import { pickBy } from "lodash-es";

  import WaniKani from "./services/wanikani";
  import { shuffleArray } from "./helpers/shuffleArray";

  let items = {};
  let itemsPromise = null;
  let currentItemIndex = 0;
  let revealed = false;
  let waniKaniAPIKey = "0d725fab-3a4b-4c66-b784-f706aeadc74e";

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
    const waniKani = new WaniKani(waniKaniAPIKey);
    itemsPromise = waniKani.getKanjiInfos().then(data => {
      items = pickBy(data, val => val.stage === "Burned");
      currentItemIndex = 0;
      revealed = false;
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
    console.log(event.code);
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
  section {
    text-align: center;
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
    margin: 0 auto;
  }
</style>

<svelte:window on:keydown={handleKeydown} />
<svelte:head>
  <script src="raphael/raphael.min.js">

  </script>
</svelte:head>
<main>
  {#if !currentItem}
    <section>
      <input bind:value={waniKaniAPIKey} type="text" placeholder="APIv2 Key" />
      <button on:click={getWaniKaniData}>get data</button>
    </section>
  {/if}
  <section>
    {#await itemsPromise}
      <p>Loading…</p>
    {:then}
      {#if currentItem}
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
        {/if}
      {/if}
    {/await}
  </section>
</main>
