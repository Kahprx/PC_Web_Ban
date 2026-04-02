# PC Store UI Enhancement Plan - Make "sang sang" + Animations

Current Progress: 0/8 steps complete

## Approved Plan Steps:
1. ✅ **Create TODO.md** - Tracking file created.
2. ✅ **Update src/index.css** - Added luxury vars (--gold, --glass, gradients), new keyframes (slide-in-left/right, scale-pop, glow-pulse), carousel/arrows/stagger utils.

Current Progress: 5/8 steps complete
3. ✅ **Update src/pages/home/Home.css** - Full luxury rewrite: glassmorphism/backdrop-blur, gold gradients/text, hover transforms/glows, carousel-ready (track/arrow), responsive staggers.
4. ✅ **Update src/pages/home/Home.jsx** - Added useCarousel hook (auto-play 4s infinite, pause hover), arrows with handlers/transforms, row-stagger/data-reveal everywhere (PC ban chay to dich vu flows).
5. ✅ **Polish src/components/common/ProductCard.css** - Glassmorphism upgrade, gold price/text gradients, enhanced hovers (lift/scale/glow/rotate).
6. **Enhance Header/Footer** - Subtle staggers/slides if needed.
7. **Test carousels** - From PC ban chay -> Tinh nang dich vu auto-scrolls + arrow animations.
8. **attempt_completion** - Showcase with `npm run dev` + browser open.

## Details:
- Auto carousels: Infinite loop, 4s interval per row, pause on hover.
- Arrows: Click anim (scale/glow/transition slide), throw/swipe feel.
- Luxury: Heavy glassmorphism, gold (#D4AF37) accents/gradients.
- Responsive + smooth 60fps.

Next step will be marked complete after each tool use.


