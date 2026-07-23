import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'firestore-count-display',

  add: (world, component) => {
    updateText(world, component)
  },

  tick: (world, component) => {
    updateText(world, component)
  },
})

function updateText(world: any, component: any) {
  const count = (window as any).cachedCount

  ecs.Ui.mutate(world, component.eid, (cursor: any) => {
    cursor.text = count !== null && count !== undefined
      ? `Count: ${count}`
      : '読み込み中...'
    return false
  })
}