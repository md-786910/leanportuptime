// Simple cross-fade + slide-up transition keyed on a value (route key, tab key).
// CSS-only; respects `prefers-reduced-motion`.
//
//   <PageTransition transitionKey={tabKey}>
//     {tabContent}
//   </PageTransition>
//
// When `transitionKey` changes, the wrapper remounts and replays the animation.
// Falls back to no animation when reduced-motion is requested.
import { useEffect, useState } from 'react';

export default function PageTransition({ transitionKey, children, duration = 200, className = '' }) {
  const [phase, setPhase] = useState('enter');
  const [renderKey, setRenderKey] = useState(transitionKey);

  useEffect(() => {
    if (transitionKey === renderKey) return;
    setRenderKey(transitionKey);
    setPhase('enter-from');
    const t = requestAnimationFrame(() => setPhase('enter'));
    return () => cancelAnimationFrame(t);
  }, [transitionKey, renderKey]);

  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const style = reduceMotion
    ? undefined
    : {
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        opacity: phase === 'enter' ? 1 : 0,
        transform: phase === 'enter' ? 'translateY(0)' : 'translateY(6px)',
      };

  return (
    <div key={renderKey} className={className} style={style}>
      {children}
    </div>
  );
}
