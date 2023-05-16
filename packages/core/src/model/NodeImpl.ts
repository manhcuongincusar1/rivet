import { DataValue } from './DataValue';
import { ExternalFunction, GraphProcessor } from './GraphProcessor';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase';
import { GraphId } from './NodeGraph';
import { Project } from './Project';
import { NativeApi } from './native/NativeApi';

export interface Settings {
  openAiKey: string;
  openAiOrganization?: string;
}

export abstract class NodeImpl<T extends ChartNode, Type extends T['type'] = T['type']> {
  readonly chartNode: T;

  constructor(chartNode: T) {
    this.chartNode = chartNode;
  }

  get id(): string {
    return this.chartNode.id;
  }

  get type(): Type {
    return this.chartNode.type as Type;
  }

  get title(): string {
    return this.chartNode.title;
  }

  get visualData(): { x: number; y: number } {
    return this.chartNode.visualData;
  }

  get data(): T['data'] {
    return this.chartNode.data;
  }

  abstract getInputDefinitions(
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeInputDefinition[];

  abstract getOutputDefinitions(
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeOutputDefinition[];

  abstract process(
    inputData: Record<PortId, DataValue>,
    context: InternalProcessContext,
  ): Promise<Record<PortId, DataValue>>;
}

export type ProcessContext = {
  settings: Settings;
  nativeApi: NativeApi;
};

export type InternalProcessContext = ProcessContext & {
  project: Project;
  signal: AbortSignal;

  raiseEvent: (eventName: string, data: DataValue | undefined) => void;
  externalFunctions: Record<string, ExternalFunction>;

  /** Global cache shared by all nodes, is present for the entire execution of a graph (and shared in subgraphs). */
  executionCache: Map<string, unknown>;

  onPartialOutputs?: (outputs: Record<PortId, DataValue>) => void;
  createSubProcessor: (subGraphId: GraphId) => GraphProcessor;
};
