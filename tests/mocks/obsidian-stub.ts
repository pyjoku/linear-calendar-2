/**
 * Obsidian API Stub for Testing
 *
 * This file provides minimal implementations of Obsidian classes
 * that can be used in tests without the actual Obsidian environment.
 */

// Base class stubs
export class Plugin {
  app: App;
  manifest: PluginManifest;

  constructor(app: App, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  async loadData(): Promise<unknown> {
    return {};
  }

  async saveData(_data: unknown): Promise<void> {
    // Stub
  }

  addRibbonIcon(
    _icon: string,
    _title: string,
    _callback: () => void
  ): HTMLElement {
    return document.createElement('div');
  }

  addCommand(_command: Command): Command {
    return _command;
  }

  addSettingTab(_tab: PluginSettingTab): void {
    // Stub
  }

  registerView(
    _type: string,
    _viewCreator: (leaf: WorkspaceLeaf) => ItemView
  ): void {
    // Stub
  }

  onload(): void {
    // Override in subclass
  }

  onunload(): void {
    // Override in subclass
  }
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display(): void {
    // Override in subclass
  }

  hide(): void {
    // Override in subclass
  }
}

export class ItemView {
  app: App;
  leaf: WorkspaceLeaf;
  containerEl: HTMLElement;
  contentEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf) {
    this.leaf = leaf;
    this.app = {} as App;
    this.containerEl = document.createElement('div');
    this.contentEl = document.createElement('div');
  }

  getViewType(): string {
    return '';
  }

  getDisplayText(): string {
    return '';
  }

  getIcon(): string {
    return '';
  }

  async onOpen(): Promise<void> {
    // Override in subclass
  }

  async onClose(): Promise<void> {
    // Override in subclass
  }
}

export class WorkspaceLeaf {
  view: ItemView | null = null;

  openFile(_file: TFile): Promise<void> {
    return Promise.resolve();
  }

  setViewState(_state: unknown): Promise<void> {
    return Promise.resolve();
  }
}

export class TFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  parent: TFolder | null;

  constructor(path: string) {
    this.path = path;
    const parts = path.split('/');
    this.name = parts[parts.length - 1] || '';
    this.basename = this.name.replace(/\.[^.]+$/, '');
    this.extension = this.name.split('.').pop() || '';
    this.parent = null;
  }
}

export class TFolder {
  path: string;
  name: string;
  children: (TFile | TFolder)[];
  parent: TFolder | null;

  constructor(path: string) {
    this.path = path;
    const parts = path.split('/');
    this.name = parts[parts.length - 1] || '';
    this.children = [];
    this.parent = null;
  }
}

export class Notice {
  constructor(_message: string, _timeout?: number) {
    // Stub
  }

  hide(): void {
    // Stub
  }
}

export class Modal {
  app: App;
  containerEl: HTMLElement;
  contentEl: HTMLElement;
  modalEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.containerEl = document.createElement('div');
    this.contentEl = document.createElement('div');
    this.modalEl = document.createElement('div');
  }

  open(): void {
    // Stub
  }

  close(): void {
    // Stub
  }
}

export class Menu {
  addItem(_cb: (item: MenuItem) => void): this {
    return this;
  }

  showAtMouseEvent(_event: MouseEvent): void {
    // Stub
  }
}

export class MenuItem {
  setTitle(_title: string): this {
    return this;
  }

  setIcon(_icon: string): this {
    return this;
  }

  onClick(_callback: () => void): this {
    return this;
  }
}

export class Setting {
  settingEl: HTMLElement;
  infoEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    this.infoEl = document.createElement('div');
    this.nameEl = document.createElement('div');
    this.descEl = document.createElement('div');
    this.controlEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
  }

  setName(_name: string): this {
    return this;
  }

  setDesc(_desc: string): this {
    return this;
  }

  addText(_cb: (text: TextComponent) => void): this {
    return this;
  }

  addToggle(_cb: (toggle: ToggleComponent) => void): this {
    return this;
  }

  addDropdown(_cb: (dropdown: DropdownComponent) => void): this {
    return this;
  }

  addButton(_cb: (button: ButtonComponent) => void): this {
    return this;
  }
}

export class TextComponent {
  inputEl: HTMLInputElement;

  constructor() {
    this.inputEl = document.createElement('input');
  }

  setValue(_value: string): this {
    return this;
  }

  setPlaceholder(_placeholder: string): this {
    return this;
  }

  onChange(_callback: (value: string) => void): this {
    return this;
  }
}

export class ToggleComponent {
  setValue(_value: boolean): this {
    return this;
  }

  onChange(_callback: (value: boolean) => void): this {
    return this;
  }
}

export class DropdownComponent {
  addOption(_value: string, _display: string): this {
    return this;
  }

  setValue(_value: string): this {
    return this;
  }

  onChange(_callback: (value: string) => void): this {
    return this;
  }
}

export class ButtonComponent {
  buttonEl: HTMLButtonElement;

  constructor() {
    this.buttonEl = document.createElement('button');
  }

  setButtonText(_text: string): this {
    return this;
  }

  setCta(): this {
    return this;
  }

  onClick(_callback: () => void): this {
    return this;
  }
}

// Types
export interface App {
  vault: Vault;
  workspace: Workspace;
  metadataCache: MetadataCache;
}

export interface Vault {
  getMarkdownFiles(): TFile[];
  getRoot(): TFolder;
  create(path: string, data: string): Promise<TFile>;
  read(file: TFile): Promise<string>;
  modify(file: TFile, data: string): Promise<void>;
  delete(file: TFile): Promise<void>;
}

export interface Workspace {
  getLeaf(newLeaf?: boolean): WorkspaceLeaf;
  getLeavesOfType(type: string): WorkspaceLeaf[];
  revealLeaf(leaf: WorkspaceLeaf): void;
  detachLeavesOfType(type: string): void;
  trigger(name: string, ...data: unknown[]): void;
}

export interface MetadataCache {
  getFileCache(file: TFile): CachedMetadata | null;
  on(
    name: string,
    callback: (...data: unknown[]) => void
  ): EventRef;
  off(name: string, callback: (...data: unknown[]) => void): void;
}

export interface CachedMetadata {
  frontmatter?: FrontMatterCache;
  tags?: TagCache[];
}

export interface FrontMatterCache {
  [key: string]: unknown;
}

export interface TagCache {
  tag: string;
  position: { start: { line: number }; end: { line: number } };
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
}

export interface Command {
  id: string;
  name: string;
  callback?: () => void;
  checkCallback?: (checking: boolean) => boolean | void;
  hotkeys?: Hotkey[];
}

export interface Hotkey {
  modifiers: string[];
  key: string;
}

export interface EventRef {
  // Opaque type
}

// Utility functions
export function setIcon(_el: HTMLElement, _icon: string): void {
  // Stub
}
