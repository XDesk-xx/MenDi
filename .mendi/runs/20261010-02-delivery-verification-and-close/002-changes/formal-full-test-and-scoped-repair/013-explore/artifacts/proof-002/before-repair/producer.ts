// 故意保留接线缺陷；Explore 只修复隔离副本。
export function produceCompletion() {
  return { deliveryId: 'd01', changeId: 'second-entry', kind: 'change-completed' };
}
