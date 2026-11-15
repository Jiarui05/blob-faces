import { renderFace, renderParts, moodAnimClass } from '../core/index.js';
import type { FaceSpec } from '../core/index.js';

/**
 * 页面上的一个"活"角色：把 core 渲染出的 SVG 挂到元素上，
 * 提供换表情、朝向、眨眼这几个动作。它不关心自己在网格里还是在检查器里。
 */
export class Face {
  readonly el: HTMLElement;
  readonly svg: SVGSVGElement;
  spec: FaceSpec;
  nx = 0;
  ny = 0;
  nextBlink = performance.now() + Math.random() * 4000;
  /** 入场/退场涟漪的延迟（舞台使用） */
  delay = 0;

  private token = 0;
  private $pop: SVGGElement;
  private $lean: SVGGElement;
  private $bob: SVGGElement;
  private $inner: SVGGElement;
  private $look!: SVGGElement;
  private $pupils!: NodeListOf<SVGGElement>;

  constructor(el: HTMLElement, spec: FaceSpec) {
    this.el = el;
    this.spec = spec;
    el.innerHTML = renderFace(spec, { animated: true });
    this.svg = el.querySelector('svg')!;
    this.svg.style.setProperty('--bf-delay', `${(-Math.random() * 3).toFixed(2)}s`);
    const q = (s: string) => this.svg.querySelector<SVGGElement>(s)!;
    this.$pop = q('.bf-pop');
    this.$lean = q('.bf-lean');
    this.$bob = q('.bf-bob');
    this.$inner = q('.bf-inner');
    this.draw();
  }

  /** 换 spec。pop: true 时先"啵"地弹一下，在压扁的瞬间换脸 */
  setSpec(spec: FaceSpec, { pop = false } = {}): void {
    const token = ++this.token;
    if (!pop) {
      this.spec = spec;
      this.draw();
      return;
    }
    this.pop();
    setTimeout(() => {
      if (token !== this.token) return; // 期间又换过一次，以最新的为准
      this.spec = spec;
      this.draw();
    }, 130);
  }

  pop(): void {
    this.$pop.classList.remove('bf-go');
    void this.$pop.getBoundingClientRect(); // 强制重排，让动画能重新播放
    this.$pop.classList.add('bf-go');
  }

  private draw(): void {
    this.$bob.setAttribute('class', `bf-bob ${moodAnimClass(this.spec.mood)}`);
    this.$inner.innerHTML = renderParts(this.spec);
    this.$look = this.$inner.querySelector('.bf-look')!;
    this.$pupils = this.$inner.querySelectorAll('.bf-pupil');
    this.el.style.setProperty('--glow', this.spec.color);
    this.applyGaze();
  }

  /** 朝向：nx, ny ∈ [-1, 1]。五官平移 + 瞳孔再挪一点 + 身体往那边歪 */
  gaze(nx: number, ny: number): void {
    if (Math.abs(nx - this.nx) < 0.004 && Math.abs(ny - this.ny) < 0.004) return; // 几乎没变，不写样式
    this.nx = nx;
    this.ny = ny;
    this.applyGaze();
  }

  private applyGaze(): void {
    const { nx, ny } = this;
    this.$look.style.transform = `translate(${(nx * 9).toFixed(2)}px,${(ny * 6.5).toFixed(2)}px)`;
    this.$pupils.forEach((p) => { p.style.transform = `translate(${(nx * 3.2).toFixed(2)}px,${(ny * 3).toFixed(2)}px)`; });
    this.$lean.style.transform = `rotate(${(nx * 7).toFixed(2)}deg) skewX(${(-nx * 3).toFixed(2)}deg)`;
    this.svg.classList.toggle('bf-lookL', nx < -0.1);
  }

  blink(): void {
    this.svg.classList.add('bf-blink');
    setTimeout(() => this.svg.classList.remove('bf-blink'), 130);
  }
}
