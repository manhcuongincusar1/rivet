import { FC } from 'react';
import { NodeCanvas } from './NodeCanvas';
import { useRecoilState } from 'recoil';
import { connectionsSelector } from '../state/graph';
import { nodesSelector } from '../state/graph';
import { selectedNodeState } from '../state/graphBuilder';
import { NodeEditorRenderer } from './NodeEditor';
import styled from '@emotion/styled';
import { NodeType, Nodes, nodeFactory } from '../model/Nodes';
import { ChartNode, NodeId } from '../model/NodeBase';
import { ContextMenuData } from '../hooks/useContextMenu';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';
import { useStableCallback } from '../hooks/useStableCallback';

const Container = styled.div`
  position: relative;
`;

export const GraphBuilder: FC = () => {
  const [nodes, setNodes] = useRecoilState(nodesSelector);
  const [connections, setConnections] = useRecoilState(connectionsSelector);
  const [selectedNode, setSelectedNode] = useRecoilState(selectedNodeState);
  const { clientToCanvasPosition } = useCanvasPositioning();

  const nodesChanged = useStableCallback((newNodes: ChartNode[]) => {
    setNodes?.(newNodes);
  });

  const addNode = useStableCallback((nodeType: NodeType, position: { x: number; y: number }) => {
    const newNode = nodeFactory(nodeType);

    newNode.visualData.x = position.x;
    newNode.visualData.y = position.y;

    nodesChanged?.([...nodes, newNode]);

    setSelectedNode(newNode.id);
  });

  const removeNode = useStableCallback((nodeId: NodeId) => {
    const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex >= 0) {
      const newNodes = [...nodes];
      newNodes.splice(nodeIndex, 1);
      nodesChanged?.(newNodes);
    }

    // Remove all connections associated with the node
    const newConnections = connections.filter((c) => c.inputNodeId !== nodeId && c.outputNodeId !== nodeId);
    setConnections?.(newConnections);
  });

  const contextMenuItemSelected = useStableCallback((menuItemId: string, contextMenuData: ContextMenuData) => {
    if (menuItemId.startsWith('Add:')) {
      const nodeType = menuItemId.substring(4) as NodeType;
      addNode(nodeType, clientToCanvasPosition(contextMenuData.x, contextMenuData.y));
      return;
    }

    if (menuItemId.startsWith('Delete:')) {
      const nodeId = menuItemId.substring(7) as NodeId;
      removeNode(nodeId);
      return;
    }

    if (menuItemId.startsWith('Edit:')) {
      const nodeId = menuItemId.substring(5) as NodeId;
      setSelectedNode(nodeId);
      return;
    }

    if (menuItemId.startsWith('Duplicate:')) {
      const nodeId = menuItemId.substring(10) as NodeId;
      const node = nodes.find((n) => n.id === nodeId) as Nodes;
      if (node) {
        const newNode = nodeFactory(node.type);
        newNode.data = { ...node.data };
        newNode.visualData = {
          ...node.visualData,
          x: node.visualData.x + 20,
          y: node.visualData.y + 20,
        };
        nodesChanged?.([...nodes, newNode]);
        setSelectedNode(newNode.id);
      }
    }
  });

  const nodeSelected = useStableCallback((node: ChartNode) => {
    setSelectedNode?.(node.id);
  });

  return (
    <Container>
      <NodeCanvas
        nodes={nodes}
        connections={connections}
        onNodesChanged={nodesChanged}
        onConnectionsChanged={setConnections}
        onNodeSelected={nodeSelected}
        selectedNode={nodes.find((node) => node.id === selectedNode) ?? null}
        onContextMenuItemSelected={contextMenuItemSelected}
      />
      <NodeEditorRenderer />
    </Container>
  );
};