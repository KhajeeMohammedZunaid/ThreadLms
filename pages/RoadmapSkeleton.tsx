import React from 'react';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import { motion } from 'framer-motion';
import { Skeleton } from '../components/Skeleton';

const SkeletonNode = () => (
    <div className="bg-white rounded-xl border border-border shadow-md p-5 w-[640px] h-[88px]">
        <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="w-3/4 h-6" />
                <Skeleton className="w-1/2 h-4" />
            </div>
            <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
    </div>
);

const nodeTypes = { skeleton: SkeletonNode };

const skeletonNodes: Node[] = [
    { id: '1', type: 'skeleton', position: { x: 0, y: 0 }, data: {} },
    { id: '2', type: 'skeleton', position: { x: 740, y: 300 }, data: {} },
    { id: '3', type: 'skeleton', position: { x: 0, y: 600 }, data: {} },
];

const skeletonEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', style: { stroke: '#e2e8f0', strokeWidth: 3 } },
    { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', style: { stroke: '#e2e8f0', strokeWidth: 3 } },
];

const RoadmapSkeleton: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full bg-slate-50"
        >
            <ReactFlow
                nodes={skeletonNodes}
                edges={skeletonEdges}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnDoubleClick={false}
                attributionPosition="top-right"
            >
                <Background color="#e2e8f0" gap={24} />
                <Controls showInteractive={false} />
            </ReactFlow>
        </motion.div>
    );
};

export default RoadmapSkeleton;