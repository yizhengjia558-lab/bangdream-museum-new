declare module "pixi-live2d-display/cubism4" {
  import type { Container } from "pixi.js";

  export class Live2DModel extends Container {
    static from(source: string, options?: { autoInteract?: boolean }): Promise<Live2DModel>;
    static registerTicker(ticker: { shared: { add: (fn: () => void) => void } }): void;
    width: number;
    height: number;
    anchor: { set: (x: number, y: number) => void };
    focus(x: number, y: number): void;
    motion(group: string, index?: number, priority?: number): Promise<boolean>;
    internalModel: {
      motionManager: {
        definitions: Record<string, unknown>;
      };
    };
  }
}
