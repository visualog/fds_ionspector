import type { LucideIcon } from 'lucide-react';

export type NavId =
  | 'dashboard'
  | 'tokens'
  | 'foundation'
  | 'components'
  | 'rules'
  | 'overlay'
  | 'build'
  | 'docs'
  | 'modules';

export type DisplayMode = 'light' | 'dark';
export type Language = 'ko' | 'en';

export interface NavItem {
  id: NavId;
  label: string;
  icon: LucideIcon;
}

export interface TokenFile {
  path: string;
  label: string;
  labelKo?: string;
  purpose: string;
  purposeKo?: string;
  groupCount: string;
  groupCountKo?: string;
  status: 'configured';
}

export interface RuleGroup {
  category: string;
  categoryKo?: string;
  check: string;
  checkKo?: string;
  runtimeFiles: string[];
  testFiles: string[];
}

export interface RuntimeGroup {
  label: string;
  labelKo?: string;
  files: string[];
  note: string;
  noteKo?: string;
}

export interface DocGroup {
  label: string;
  paths: string[];
}

export interface ModuleGroup {
  label: string;
  labelKo?: string;
  description: string;
  descriptionKo?: string;
  files: string[];
}

export interface FoundationGroup {
  label: string;
  labelKo?: string;
  description: string;
  descriptionKo?: string;
  sourceFiles: string[];
  tokens: string[];
  preview: 'color' | 'spacing' | 'radius' | 'type' | 'motion';
}

export interface ExtensionColorToken {
  name: string;
  value: string;
  cssVariable?: string;
  usage: string;
  usageKo?: string;
}

export interface ComponentGroup {
  label: string;
  labelKo?: string;
  role: string;
  roleKo?: string;
  states: string[];
  statesKo?: string[];
  sourceFiles: string[];
  testFiles: string[];
  tokenHooks: string[];
  tokenHooksKo?: string[];
}
