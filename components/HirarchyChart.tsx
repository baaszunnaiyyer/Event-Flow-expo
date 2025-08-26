import React, { useEffect } from "react";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Path,
  Text,
  G,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { Path as SvgPath } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(SvgPath);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface NodeData {
  name: string;
  parent?: string;
}

interface PositionedNode extends NodeData {
  x: number;
  y: number;
  level: number;
}

interface HierarchyChartProps {
  data: NodeData[][];
}

const NODE_RADIUS = 28;
const VERTICAL_SPACING = 100;
const CHART_WIDTH = 500;
const PRIMARY_COLOR = "#090040";

function limitLetters(name: string, limit = 5): string {
  return name.length <= limit ? name : name.slice(0, limit) + "-";
}

const HierarchyChart: React.FC<HierarchyChartProps> = ({ data }) => {
  const nodeMap: Record<string, PositionedNode> = {};
  const positionedNodes: PositionedNode[] = [];

  // Position all nodes
  data.forEach((level, levelIndex) => {
    const count = level.length;
    const levelY = 40 + levelIndex * VERTICAL_SPACING;
    level.forEach((node, nodeIndex) => {
      const nodeX = (CHART_WIDTH / (count + 1)) * (nodeIndex + 1);
      const fullNode: PositionedNode = {
        ...node,
        x: nodeX,
        y: levelY,
        level: levelIndex,
      };
      nodeMap[node.name] = fullNode;
      positionedNodes.push(fullNode);
    });
  });

  // Animated connection path
  const AnimatedConnection = ({ d }: { d: string }) => {
    const length = useSharedValue(1000);
    const animatedProps = useAnimatedProps(() => ({
      strokeDashoffset: length.value,
    }));

    useEffect(() => {
      length.value = withTiming(0, { duration: 5000 });
    }, []);

    return (
      <AnimatedPath
        d={d}
        animatedProps={animatedProps}
        stroke={PRIMARY_COLOR}
        strokeWidth={2}
        fill="none"
        strokeDasharray="1000"
      />
    );
  };

  // Paths between parent and child nodes
  const paths = positionedNodes
    .filter((node) => node.parent)
    .map((node, index) => {
      const parent = nodeMap[node.parent!];
      if (!parent) return null;
      const d = `M${parent.x},${parent.y + NODE_RADIUS}
        C${parent.x},${parent.y + NODE_RADIUS + 20}
         ${node.x},${node.y - NODE_RADIUS - 20}
         ${node.x},${node.y - NODE_RADIUS}`;
      return <AnimatedConnection key={`path-${index}`} d={d} />;
    });

  return (
    <Svg
      width="100%"
      height={data.length * VERTICAL_SPACING}
      viewBox={`0 0 ${CHART_WIDTH} ${data.length * VERTICAL_SPACING}`}
    >
      <Defs>
        <LinearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={PRIMARY_COLOR} />
          <Stop offset="100%" stopColor={PRIMARY_COLOR} />
        </LinearGradient>
      </Defs>

      {paths}

      {positionedNodes.map((node, index) => {
        const radius = useSharedValue(0);
        const animatedProps = useAnimatedProps(() => ({
          r: withTiming(radius.value, { duration: 500 }),
        }));

        useEffect(() => {
          radius.value = NODE_RADIUS;
        }, []);

        const handlePress = () => {
          console.log("Node clicked:", node.name);

          // Pulse effect: grow and shrink
          radius.value = withTiming(NODE_RADIUS * 1.2, { duration: 150 }, () => {
            radius.value = withTiming(NODE_RADIUS, { duration: 150 });
          });
        };

        return (
          <G key={`node-${index}`}>

            {/* Animated visible node */}
            <AnimatedCircle
              cx={node.x}
              cy={node.y}
              animatedProps={animatedProps}
              fill="url(#nodeGradient)"
              stroke={PRIMARY_COLOR}
              strokeWidth={2}
            />

            {/* Transparent hit area */}
            <Circle
              cx={node.x}
              cy={node.y}
              r={NODE_RADIUS + 10}
              fill="transparent"
              pointerEvents="auto"
              onPressIn={handlePress}
            />
            {/* Node label */}
            <Text
              x={node.x}
              y={node.y}
              fontSize="12"
              fill="white"
              fontFamily="FiraCode-Bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {limitLetters(node.name)}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
};

export default HierarchyChart;
  