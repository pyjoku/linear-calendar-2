/**
 * LinearCalendarPlugin - Main plugin class for Linear Calendar 2
 *
 * This is the entry point for the Obsidian plugin.
 */

import { Plugin, WorkspaceLeaf, TFile } from 'obsidian';
import { CalendarView, VIEW_TYPE_LINEAR_CALENDAR } from '../presentation/views/CalendarView';
import { CalendarService } from '../application/services/CalendarService';
import { LinearCalendarSettingsTab } from './SettingsTab';
import type { LinearCalendarSettings } from '../core/domain/types';
import { DEFAULT_SETTINGS } from '../core/domain/types';

export class LinearCalendarPlugin extends Plugin {
  settings!: LinearCalendarSettings;
  private calendarService: CalendarService | null = null;

  async onload(): Promise<void> {
    console.log('Loading Linear Calendar 2');

    // Load settings
    await this.loadSettings();

    // Initialize the calendar service
    this.calendarService = new CalendarService(this.app, this.settings);
    await this.calendarService.initialize();

    // Register the view
    this.registerView(VIEW_TYPE_LINEAR_CALENDAR, (leaf) => {
      const view = new CalendarView(leaf);
      view.initialize({
        service: this.calendarService!,
        openFile: this.openFile.bind(this),
      });
      return view;
    });

    // Add ribbon icon
    this.addRibbonIcon('calendar', 'Open Linear Calendar', () => {
      this.activateView();
    });

    // Add command
    this.addCommand({
      id: 'open-linear-calendar',
      name: 'Open Linear Calendar',
      callback: () => {
        this.activateView();
      },
    });

    // Add command to go to today
    this.addCommand({
      id: 'linear-calendar-go-to-today',
      name: 'Go to Today',
      callback: () => {
        this.calendarService?.goToToday();
      },
    });

    // Add settings tab
    this.addSettingTab(new LinearCalendarSettingsTab(this.app, this));
  }

  async onunload(): Promise<void> {
    console.log('Unloading Linear Calendar 2');

    // Clean up service
    this.calendarService?.destroy();
    this.calendarService = null;

    // Detach all leaves of this type
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_LINEAR_CALENDAR);
  }

  /**
   * Activates (opens) the calendar view
   */
  async activateView(): Promise<void> {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_LINEAR_CALENDAR);

    if (leaves.length > 0) {
      // Use existing leaf
      leaf = leaves[0];
    } else {
      // Create new leaf in right sidebar
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE_LINEAR_CALENDAR,
          active: true,
        });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  /**
   * Opens a file in the workspace
   */
  async openFile(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  /**
   * Gets the calendar service
   */
  getCalendarService(): CalendarService | null {
    return this.calendarService;
  }

  /**
   * Loads settings from storage
   */
  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  /**
   * Saves settings to storage
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // Update service with new settings
    if (this.calendarService) {
      await this.calendarService.updateSettings(this.settings);
    }
  }
}
