// IPC channel names shared between main, preload and renderer.
export const LAUNCHER_CHANNELS = {
  GET_TEST_PACK: 'launcher:get-test-pack',
  LAUNCH_TEST_PACK: 'launcher:launch-test-pack',
  LOG: 'launcher:log',
  PROGRESS: 'launcher:progress',
  STATE: 'launcher:state'
}
