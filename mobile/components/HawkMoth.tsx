/**
 * Hummingbird hawk-moth mascot — implementation of the latest
 * "Hummingbird Hawk Moth.html" design handoff.
 *
 * Symmetric top-down view: spherical head with side-mounted orange
 * eyes, two upright antennae, spherical thorax, cylindrical grey
 * abdomen with segment lines, and two matched wings each carrying an
 * orange hindwing diamond pulled close to the body.
 *
 * Animations (matching the source CSS):
 *   - Whole moth hovers translateY 0 → -12 (5s ease-in-out alternate)
 *     applied via an outer Animated.View transform.
 *   - Wings flap at 700ms cubic-bezier(.6,0,.4,1) alternate.
 *     Left wing rotates 10° → -8°, right wing -10° → 8°.
 *     Both scaleY 0.95 → 1.05.
 *     Wing pivot is at the thorax (originX=500, originY=480).
 *
 * Wings are rendered with `rotation` + `scaleY` props on an animated
 * Group (not a transform string) — that's the path Reanimated +
 * react-native-svg actually animate reliably.
 */
import { useEffect } from "react";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Polygon,
  RadialGradient,
  Stop,
} from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);

const STROKE = "#161616";
const PVX = 500;
const PVY = 480;

export const HawkMoth = ({
  size = 240,
  flapping = true,
}: {
  size?: number;
  flapping?: boolean;
}) => {
  const flap = useSharedValue(0);
  const hover = useSharedValue(0);

  useEffect(() => {
    if (!flapping) {
      flap.value = 0.5;
      hover.value = 0.5;
      return;
    }
    flap.value = withRepeat(
      withTiming(1, {
        duration: 700,
        easing: Easing.bezier(0.6, 0, 0.4, 1),
      }),
      -1,
      true,
    );
    hover.value = withRepeat(
      withTiming(1, {
        duration: 2500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [flapping, flap, hover]);

  // Left wing: rotation 10° → -8°, scaleY 0.95 → 1.05.
  const leftWingProps = useAnimatedProps(() => ({
    rotation: interpolate(flap.value, [0, 1], [10, -8]),
    scaleY: interpolate(flap.value, [0, 1], [0.95, 1.05]),
  }));
  // Right wing: rotation -10° → 8°, scaleY 0.95 → 1.05.
  const rightWingProps = useAnimatedProps(() => ({
    rotation: interpolate(flap.value, [0, 1], [-10, 8]),
    scaleY: interpolate(flap.value, [0, 1], [0.95, 1.05]),
  }));

  // Whole-moth hover.
  const hoverStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(hover.value, [0, 1], [0, -12]) }],
  }));

  return (
    <Animated.View style={hoverStyle}>
      <Svg width={size} height={size} viewBox="0 0 1000 1000">
        <Defs>
          <LinearGradient id="hmWingGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#3a3a3a" />
            <Stop offset="55%" stopColor="#1f1f1f" />
            <Stop offset="100%" stopColor="#0e0e0e" />
          </LinearGradient>
          <LinearGradient id="hmOrangeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ffc066" />
            <Stop offset="55%" stopColor="#f59a36" />
            <Stop offset="100%" stopColor="#c47521" />
          </LinearGradient>
          <LinearGradient id="hmAbdomenGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#3e3e3e" />
            <Stop offset="35%" stopColor="#8a8a8a" />
            <Stop offset="55%" stopColor="#9a9a9a" />
            <Stop offset="80%" stopColor="#5a5a5a" />
            <Stop offset="100%" stopColor="#363636" />
          </LinearGradient>
          <RadialGradient id="hmThoraxGrad" cx="42%" cy="32%" r="70%">
            <Stop offset="0%" stopColor="#4a4a4a" />
            <Stop offset="55%" stopColor="#1f1f1f" />
            <Stop offset="100%" stopColor="#0a0a0a" />
          </RadialGradient>
          <RadialGradient id="hmHeadGrad" cx="40%" cy="32%" r="70%">
            <Stop offset="0%" stopColor="#4a4a4a" />
            <Stop offset="60%" stopColor="#1c1c1c" />
            <Stop offset="100%" stopColor="#080808" />
          </RadialGradient>
        </Defs>

        {/* Motion-blur trail: dimmed copy of each wing rendered behind
            the sharp copy. Pure opacity (no Gaussian blur — that doesn't
            render reliably across iOS/Android in react-native-svg). */}
        <AnimatedG
          animatedProps={leftWingProps}
          originX={PVX}
          originY={PVY}
          opacity={0.18}
        >
          <Polygon
            points="500,440 380,400 240,400 130,440 90,500 130,560 260,580 400,560 490,520"
            fill="url(#hmWingGrad)"
            stroke={STROKE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <Polygon
            points="320,560 430,540 460,640 350,660 290,610"
            fill="url(#hmOrangeGrad)"
            stroke={STROKE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
        </AnimatedG>
        <AnimatedG
          animatedProps={rightWingProps}
          originX={PVX}
          originY={PVY}
          opacity={0.18}
        >
          <Polygon
            points="500,440 620,400 760,400 870,440 910,500 870,560 740,580 600,560 510,520"
            fill="url(#hmWingGrad)"
            stroke={STROKE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <Polygon
            points="680,560 570,540 540,640 650,660 710,610"
            fill="url(#hmOrangeGrad)"
            stroke={STROKE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
        </AnimatedG>

        {/* LEFT WING — sharp copy */}
        <AnimatedG
          animatedProps={leftWingProps}
          originX={PVX}
          originY={PVY}
        >
          <Polygon
            points="500,440 380,400 240,400 130,440 90,500 130,560 260,580 400,560 490,520"
            fill="url(#hmWingGrad)"
            stroke={STROKE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <Polygon
            points="320,560 430,540 460,640 350,660 290,610"
            fill="url(#hmOrangeGrad)"
            stroke={STROKE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <Polygon
            points="200,420 380,415 420,460 220,470"
            fill="#ffffff"
            opacity={0.06}
          />
        </AnimatedG>

        {/* RIGHT WING — sharp copy */}
        <AnimatedG
          animatedProps={rightWingProps}
          originX={PVX}
          originY={PVY}
        >
          <Polygon
            points="500,440 620,400 760,400 870,440 910,500 870,560 740,580 600,560 510,520"
            fill="url(#hmWingGrad)"
            stroke={STROKE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <Polygon
            points="680,560 570,540 540,640 650,660 710,610"
            fill="url(#hmOrangeGrad)"
            stroke={STROKE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <Polygon
            points="800,420 620,415 580,460 780,470"
            fill="#ffffff"
            opacity={0.06}
          />
        </AnimatedG>

        {/* ABDOMEN — grey cylinder with side gradient + segment lines */}
        <Ellipse
          cx="500"
          cy="640"
          rx="58"
          ry="135"
          fill="url(#hmAbdomenGrad)"
          stroke={STROKE}
          strokeWidth={6}
        />
        <G stroke="#000" strokeWidth={2} opacity={0.35} fill="none">
          <Line x1="448" y1="595" x2="552" y2="595" />
          <Line x1="448" y1="650" x2="552" y2="650" />
          <Line x1="455" y1="710" x2="545" y2="710" />
        </G>
        <Ellipse cx="487" cy="640" rx="8" ry="120" fill="#fff" opacity={0.08} />

        {/* THORAX — spherical */}
        <Ellipse
          cx="500"
          cy="480"
          rx="78"
          ry="70"
          fill="url(#hmThoraxGrad)"
          stroke={STROKE}
          strokeWidth={6}
        />
        <Ellipse cx="478" cy="455" rx="20" ry="14" fill="#fff" opacity={0.1} />

        {/* HEAD — spherical */}
        <Circle
          cx="500"
          cy="370"
          r="50"
          fill="url(#hmHeadGrad)"
          stroke={STROKE}
          strokeWidth={6}
        />
        <Ellipse cx="485" cy="350" rx="12" ry="8" fill="#fff" opacity={0.12} />

        {/* SIDE EYES — orange */}
        <Ellipse
          cx="458"
          cy="370"
          rx="9"
          ry="14"
          fill="url(#hmOrangeGrad)"
          stroke={STROKE}
          strokeWidth={2}
        />
        <Ellipse
          cx="542"
          cy="370"
          rx="9"
          ry="14"
          fill="url(#hmOrangeGrad)"
          stroke={STROKE}
          strokeWidth={2}
        />
        <Circle cx="455" cy="366" r="2" fill="#fff" opacity={0.95} />
        <Circle cx="539" cy="366" r="2" fill="#fff" opacity={0.95} />

        {/* ANTENNAE */}
        <G fill="none" stroke={STROKE} strokeWidth={9} strokeLinecap="round">
          <Line x1="478" y1="328" x2="440" y2="140" />
          <Line x1="522" y1="328" x2="560" y2="140" />
        </G>
      </Svg>
    </Animated.View>
  );
};
