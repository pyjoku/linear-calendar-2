/**
 * SettingsTab - Settings UI for Linear Calendar 2
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type { LinearCalendarPlugin } from './LinearCalendarPlugin';
import type { CalendarWidth, DatePriority } from '../core/domain/types';

export class LinearCalendarSettingsTab extends PluginSettingTab {
  plugin: LinearCalendarPlugin;

  constructor(app: App, plugin: LinearCalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Linear Calendar 2 Settings' });

    // Calendar Width
    new Setting(containerEl)
      .setName('Calendar Width')
      .setDesc('Choose how the calendar fills available space')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('fit', 'Fit to Container')
          .addOption('scroll', 'Scrollable (Wider)')
          .setValue(this.plugin.settings.calendarWidth)
          .onChange(async (value: string) => {
            this.plugin.settings.calendarWidth = value as CalendarWidth;
            await this.plugin.saveSettings();
          })
      );

    // Date Properties
    containerEl.createEl('h3', { text: 'Date Extraction' });

    new Setting(containerEl)
      .setName('Date Properties')
      .setDesc('Frontmatter properties to check for start dates (comma-separated)')
      .addText((text) =>
        text
          .setPlaceholder('date, startDate, created')
          .setValue(this.plugin.settings.dateProperties.join(', '))
          .onChange(async (value) => {
            this.plugin.settings.dateProperties = value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('End Date Properties')
      .setDesc('Frontmatter properties to check for end dates (comma-separated)')
      .addText((text) =>
        text
          .setPlaceholder('endDate, due, deadline')
          .setValue(this.plugin.settings.endDateProperties.join(', '))
          .onChange(async (value) => {
            this.plugin.settings.endDateProperties = value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Date Priority')
      .setDesc('When both filename and frontmatter have dates, which to prefer')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('property', 'Frontmatter Property First')
          .addOption('filename', 'Filename First')
          .setValue(this.plugin.settings.datePriority)
          .onChange(async (value: string) => {
            this.plugin.settings.datePriority = value as DatePriority;
            await this.plugin.saveSettings();
          })
      );

    // Daily Notes
    containerEl.createEl('h3', { text: 'Daily Notes' });

    new Setting(containerEl)
      .setName('Daily Note Folder')
      .setDesc('Folder where daily notes are stored (empty for vault root)')
      .addText((text) =>
        text
          .setPlaceholder('Daily')
          .setValue(this.plugin.settings.dailyNoteFolder)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Daily Note Format')
      .setDesc('Filename format for daily notes (use YYYY, MM, DD)')
      .addText((text) =>
        text
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.plugin.settings.dailyNoteFormat)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteFormat = value.trim() || 'YYYY-MM-DD';
            await this.plugin.saveSettings();
          })
      );

    // Display Options
    containerEl.createEl('h3', { text: 'Display Options' });

    new Setting(containerEl)
      .setName('Show Multi-Day Bars')
      .setDesc('Show colored bars for events spanning multiple days')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showMultiDayBars)
          .onChange(async (value) => {
            this.plugin.settings.showMultiDayBars = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show Weekend Highlight')
      .setDesc('Highlight weekend days with a different background')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showWeekendHighlight)
          .onChange(async (value) => {
            this.plugin.settings.showWeekendHighlight = value;
            await this.plugin.saveSettings();
          })
      );

    // Info section
    containerEl.createEl('h3', { text: 'About' });

    const infoDiv = containerEl.createDiv({ cls: 'lc2-settings-info' });
    infoDiv.createEl('p', {
      text: 'Linear Calendar 2 displays all 365 days of the year in a compact linear format.',
    });
    infoDiv.createEl('p', {
      text: 'Click any day to open or create the corresponding daily note.',
    });
    infoDiv.createEl('p', {
      text: 'Right-click a day to see all notes on that date.',
    });

    const stats = this.plugin.getCalendarService()?.getCacheStats();
    if (stats) {
      infoDiv.createEl('p', {
        text: `Currently tracking ${stats.entryCount} notes with dates.`,
        cls: 'lc2-stats',
      });
    }
  }
}
