export interface Position {
    x: number;
    y: number;
}

export type Move = 'U' | 'D' | 'L' | 'R';

export interface LevelMap {
    [name: string]: string;
}

export interface GraphNode {
    id: number;
    state: any; // GameState, but circular dependency if imported here. Can use generic or just any for now, or import type only.
    group: 'start' | 'solved' | 'default';
    val?: number;
}

export interface GraphLink {
    source: number;
    target: number;
    label: string;
}
