/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

export class TaskMonitor {
  #count = 0;
  #pending = new Map<string, () => void>();

  public capture(): void {
    this.#count++;
  }

  public release(): void {
    if (this.#count <= 0) {
      return;
    }

    this.#count--;

    if (this.#count === 0) {
      this.#flush();
    }
  }

  public isWorking() {
    return this.#count > 0;
  }

  public whenReady(name: string, task: () => void) {
    if (this.#count === 0) {
      task();
    } else {
      this.#pending.set(name, task);
    }
  }

  #flush() {
    if (this.#count !== 0 || this.#pending.size <= 0) {
      return;
    }

    const tasks = Array.from(this.#pending.values());
    this.#pending.clear();

    tasks.forEach((task) => task());
  }
}
