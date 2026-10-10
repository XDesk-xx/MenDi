export function consumeCompletion(message: { deliveryId: string; changeId: string; kind: string }) {
  if (message.kind !== 'change-archived') throw new Error('expected archived completion');
  return `${message.deliveryId}:${message.changeId}`;
}
