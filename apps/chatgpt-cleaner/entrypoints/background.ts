export default defineBackground(() => {
  // Phase 0 shell: privileged coordination will own queues/auth in later phases.
  browser.runtime.onInstalled.addListener(() => {
    // Intentionally no host or cloud side effects in Phase 0.
  });
});
