/**
 * Shuffles array in place. ES6 version
 * @param {Array} aInput items An array containing the items.
 */
export function shuffleArray(aInput) {
  const a = aInput.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
