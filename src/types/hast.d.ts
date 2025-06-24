import { Node, Parent } from 'unist';

export interface HASTNode extends Node {
  type: string;
  tagName?: string;
  properties?: {
    [key: string]: string | number | boolean | undefined | null;
    className?: string | string[];
    src?: string;
    alt?: string;
    'data-optimized-image'?: string;
    'data-src'?: string;
    'data-alt'?: string;
  };
  children?: HASTNode[];
  value?: string;
}

export interface HASTParent extends Parent {
  children: HASTNode[];
}

export interface HASTElement extends HASTNode {
  type: 'element';
  tagName: string;
  properties: NonNullable<HASTNode['properties']>;
  children: HASTNode[];
}
