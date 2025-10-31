let queue: Promise<any> = Promise.resolve();

export function queueDB<T>(task: () => Promise<T>): Promise<T> {
  // Chain the next task after the current one finishes
  queue = queue.then(task).catch(task);
  return queue;
}