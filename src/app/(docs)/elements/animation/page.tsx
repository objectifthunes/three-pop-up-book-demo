import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { PropTable } from '@/components/PropTable'
import { findExport } from '@/components/exports'
import { LiveAnimation } from '@/components/live/examples'

const e = findExport('/elements/animation/')!

const CODE = `import { springProgress } from '@objectifthunes/three-pop-up-book'

// Each element animates its own pop / collapse. The default is a spring:
element.animated = true   // elastic bounce on the way up, quick shrink down
element.animated = false  // snap straight to the target, no easing

// setProgress sets the target; the element eases toward it on update():
element.setProgress(1)    // start popping up
element.setProgress(0)    // start collapsing

// PopUpBook.update(dt) advances every element's animation each frame —
// you don't normally call update() yourself.
popUpBook.update(dt)

// springProgress is the easing curve behind the pop. It is an elastic
// ease-out: ~0.4s of travel that overshoots past 1 then settles back.
springProgress(0)    // 0   — flat on the page
springProgress(0.3)  // > 1 — the overshoot, peak of the bounce
springProgress(1)    // 1   — settled at full height`

export default async function Page() {
  return (
    <ExportPage group={e.group} title={e.name} lede={e.lede}>
      <LiveAnimation />
      <Source code={CODE} lang="ts" />
      <PropTable
        label="THE animated FLAG"
        cols={['Field', 'Type', 'Default', 'Behaviour']}
        rows={[
          { name: 'animated', type: 'boolean', def: 'true', desc: 'true: a pop springs up over ~0.4s with an elastic overshoot, and collapses over ~0.2s. false: setProgress jumps straight to the target with no easing.' },
        ]}
      />
      <PropTable
        label="springProgress(t)"
        cols={['Export', 'Signature', '', 'What it returns']}
        rows={[
          { name: 'springProgress', type: '(t: number) => number', desc: 'Elastic ease-out over normalized time t in 0…1. Returns 0 at t <= 0 and 1 at t >= 1; in between it overshoots above 1 then settles, giving the pop its bounce. This is the curve PopUpElement applies while popping up.' },
        ]}
      />
      <Notes>
        <p>
          Every <Link href="/elements/pop-up-element/">PopUpElement</Link> owns its pop. When{' '}
          <code>setProgress(t)</code> changes the target, the element either starts easing (when{' '}
          <code>animated</code> is <code>true</code>) or snaps to it (<code>false</code>). The rise uses{' '}
          <code>springProgress</code> — an elastic ease-out that overshoots past full height and settles back, so the
          object springs up rather than sliding. The collapse is a faster, plain shrink with no bounce.
        </p>
        <p>
          Animation only moves when something advances it: <code>PopUpBook.update(dt)</code> ticks every element each
          frame, so as long as you call the book&apos;s update in your render loop the springs play on their own. Use
          the bare <code>springProgress(t)</code> export when you want the same curve elsewhere — a 2D label, a UI
          accent, a parallel effect timed to the pop.
        </p>
      </Notes>
    </ExportPage>
  )
}
