//require('./water-shader')

const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/NC.json'),
    ],
  })
  XR8.addCameraPipelineModule(LandingPage.pipelineModule())
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

