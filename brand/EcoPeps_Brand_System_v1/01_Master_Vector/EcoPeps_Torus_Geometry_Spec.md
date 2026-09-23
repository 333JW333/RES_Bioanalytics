# EcoPeps Torus Geometry Specification

The approved center opening is locked at one tenth of the complete torus diameter.

Let `R` be the visible outer radius of the torus:

- center-opening radius = `0.10R`
- loop-circle radius = `0.55R`
- loop-center orbit radius = `0.45R`
- display loop count = `28`
- flat loop count = `20`
- micro loop count = `8`

For loop `i` among `N` total loops:

```text
angle(i) = 2πi / N
centerX(i) = centerX + 0.45R × cos(angle(i))
centerY(i) = centerY + 0.45R × sin(angle(i))
loopRadius = 0.55R
```

This construction keeps the opening, outer envelope, and circular-loop family mathematically consistent at every size.
